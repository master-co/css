// Differential harness: runs the Rust engine (full Wasm, Node entry) and the JS engine
// on the same compiled runtime program and class sets, and reports every divergence in
// transitions, execution state, snapshots, keyframe definitions and emitted globals.
//
//   node --import tsx packages/engine-js/scripts/differential.mts [--fuzz 2000] [--seed 1] [--out dir]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compileRuntimeProgram, createWasmEngineSession } from '../../binding-wasm-engine/src/node.ts'
import { createEngineSession, type EngineSession } from '../src/index.ts'
import { corpusEngineCases, fuzzClasses, markupClasses, rustTestClasses, type EngineCase } from './class-sources.mts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const args = new Map<string, string>()
for (let index = 2; index < process.argv.length; index += 2) args.set(process.argv[index].replace(/^--/, ''), process.argv[index + 1])
const fuzzCount = Number(args.get('fuzz') ?? 2000)
const seed = Number(args.get('seed') ?? 1)
const chunkSize = Number(args.get('chunk') ?? 200)
const outDir = resolve(args.get('out') ?? join(root, 'packages/engine-js/.reports'))
const EXAMPLE_LIMIT = 5

type RustSession = Awaited<ReturnType<typeof createWasmEngineSession>>
type Operation = 'ensure' | 'delete' | 'executionState' | 'snapshot' | 'keyframeDefinitions'
  | 'registerEmittedGlobals' | 'replaceEmittedGlobals' | 'refresh' | 'batchEnsure' | 'batchDelete'

interface OperationStats { compared: number, mismatched: number, examples: unknown[] }
interface SourceStats { candidates: number, rustValid?: number, operations: Partial<Record<Operation, OperationStats>> }

const sources = new Map<string, SourceStats>()

function firstDifference(left: unknown, right: unknown, path = '$'): string | undefined {
  if (Object.is(left, right)) return
  if (typeof left !== 'object' || typeof right !== 'object' || left === null || right === null || Array.isArray(left) !== Array.isArray(right)) {
    return `${path}: rust=${JSON.stringify(left)?.slice(0, 160)} js=${JSON.stringify(right)?.slice(0, 160)}`
  }
  if (Array.isArray(left) && Array.isArray(right) && left.length !== right.length) {
    return `${path}.length: rust=${left.length} js=${right.length}`
  }
  const keys = new Set([...Object.keys(left), ...Object.keys(right)])
  for (const key of keys) {
    const difference = firstDifference((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key], `${path}.${key}`)
    if (difference) return difference
  }
}

function source(name: string) {
  let stats = sources.get(name)
  if (!stats) sources.set(name, stats = { candidates: 0, operations: {} })
  return stats
}

/** Runs one operation on both engines; a thrown error is compared as `{ error }`. */
function compare(name: string, operation: Operation, subject: unknown, rust: () => unknown, js: () => unknown) {
  const run = (callback: () => unknown) => {
    try {
      return callback()
    } catch (error) {
      return { error: (error as { code?: string }).code ?? String(error) }
    }
  }
  const rustResult = run(rust)
  const jsResult = run(js)
  const stats = source(name).operations[operation] ??= { compared: 0, mismatched: 0, examples: [] }
  stats.compared++
  const difference = firstDifference(rustResult, jsResult)
  if (difference) {
    stats.mismatched++
    if (stats.examples.length < EXAMPLE_LIMIT) stats.examples.push({ subject, difference })
  }
  return rustResult
}

const manifestJSON = readFileSync(join(root, 'packages/preset/src/default-manifest.json'), 'utf8')
const manifest = JSON.parse(manifestJSON)
const programs = new Map<string, Uint8Array>()
async function programFor(manifestSource: EngineCase['manifest']) {
  const json = manifestSource === 'default' ? manifestJSON : JSON.stringify(manifestSource)
  let program = programs.get(json)
  if (!program) programs.set(json, program = await compileRuntimeProgram(json))
  return program
}

async function sessions(program: Uint8Array): Promise<[RustSession, EngineSession]> {
  return [await createWasmEngineSession(program), createEngineSession(program)]
}

// Coverage: syntactic features among the classes Rust accepts, plus which manifest
// utilities, custom media and variable namespaces they reach.
const FEATURES: [string, RegExp][] = [
  ['native declaration', /^-?[a-z-]+:[^:]/],
  ['custom property', /^--/],
  ['group {…}', /^\{/],
  ['function utility', /^-?[a-z-]+\(/],
  ['negative', /^-[a-z]/],
  ['important !', /!(?=$|[:@._[])/],
  ['pseudo-class :x', /[^:]:[a-z-]+(?![^(]*\))(?=$|[:@.[_(])/],
  ['pseudo-element ::x', /::[a-z-]+/],
  ['class/attribute selector', /(?:\.[a-z][\w-]*|\[[^\]]+\])(?=$|[:@.[_])/],
  ['descendant/combinator _', /_[:.[a-z*>+~]/],
  ['@ condition', /@/],
  ['@layer()', /@layer\(/],
  ['@starting-style', /@starting-style/],
  ['math calc/min/max/clamp', /(?:calc|min|max|clamp)\(/],
  ['var()', /var\(/],
  ['multi-value |', /\|/]
]
const coverage = {
  features: Object.fromEntries(FEATURES.map(([name]) => [name, 0])) as Record<string, number>,
  utilities: new Set<string>(),
  customMedia: new Set<string>(),
  variables: new Set<string>(),
  keyframes: new Set<string>()
}
const utilityNames = (manifest.utilities as { name: string }[]).map((utility) => utility.name).sort((a, b) => b.length - a.length)
const mediaNames = Object.keys(manifest.customMedia).map((name) => name.slice(2))

function recordCoverage(className: string, rules: { variableNames?: string[], keyframeNames?: string[] }[]) {
  for (const [name, pattern] of FEATURES) if (pattern.test(className)) coverage.features[name]++
  const base = className.replace(/^-/, '')
  const utility = utilityNames.find((name) => base === name || base.startsWith(`${name}-`) || base.startsWith(`${name}(`))
  if (utility) coverage.utilities.add(utility)
  for (const media of mediaNames) if (className.includes(`@${media}`)) coverage.customMedia.add(media)
  for (const rule of rules) {
    for (const name of rule.variableNames ?? []) coverage.variables.add(name.replace(/-[^-]+$/, ''))
    for (const name of rule.keyframeNames ?? []) coverage.keyframes.add(name)
  }
}

async function runClassSet(name: string, classes: Iterable<string>) {
  const program = await programFor('default')
  const list = [...classes]
  source(name).candidates = list.length
  for (let start = 0; start < list.length; start += chunkSize) {
    const chunk = list.slice(start, start + chunkSize)
    const [rust, js] = await sessions(program)
    for (const className of chunk) {
      const transition = compare(name, 'ensure', className, () => rust.ensureClassRules([className]), () => js.ensureClassRules([className])) as
        { mutations?: { rule?: { variableNames?: string[], keyframeNames?: string[] } }[] }
      const state = compare(name, 'executionState', className, () => rust.executionState([className]), () => js.executionState([className])) as
        { classes?: { references: unknown[] }[] }
      if (state.classes?.[0]?.references.length) {
        source(name).rustValid = (source(name).rustValid ?? 0) + 1
        recordCoverage(className, (transition.mutations ?? []).flatMap((mutation) => mutation.rule ? [mutation.rule] : []))
      }
      compare(name, 'delete', className, () => rust.deleteClassRules([className]), () => js.deleteClassRules([className]))
    }
    const subject = `${name}[${start}..${start + chunk.length}]`
    compare(name, 'batchEnsure', subject, () => rust.ensureClassRules(chunk), () => js.ensureClassRules(chunk))
    compare(name, 'snapshot', `${subject} ensured`, () => rust.snapshot(), () => js.snapshot())
    const half = chunk.slice(0, chunk.length >> 1)
    compare(name, 'batchDelete', `${subject} first half`, () => rust.deleteClassRules(half), () => js.deleteClassRules(half))
    compare(name, 'snapshot', `${subject} half deleted`, () => rust.snapshot(), () => js.snapshot())
    compare(name, 'batchDelete', `${subject} rest`, () => rust.deleteClassRules(chunk.slice(half.length)), () => js.deleteClassRules(chunk.slice(half.length)))
    compare(name, 'snapshot', `${subject} all deleted`, () => rust.snapshot(), () => js.snapshot())
    rust.dispose()
    js.dispose()
  }
}

async function runCorpusCases(cases: EngineCase[]) {
  const name = 'corpus engineCases'
  for (const engineCase of cases) {
    const [rust, js] = await sessions(await programFor(engineCase.manifest))
    for (const [index, step] of engineCase.steps.entries()) {
      source(name).candidates += step.classes.length
      const subject = `${engineCase.id}#${index}`
      if (step.op === 'ensure') compare(name, 'batchEnsure', subject, () => rust.ensureClassRules(step.classes), () => js.ensureClassRules(step.classes))
      else compare(name, 'batchDelete', subject, () => rust.deleteClassRules(step.classes), () => js.deleteClassRules(step.classes))
      compare(name, 'snapshot', subject, () => rust.snapshot(), () => js.snapshot())
    }
    compare(name, 'keyframeDefinitions', engineCase.id, () => rust.keyframeDefinitions(), () => js.keyframeDefinitions())
    rust.dispose()
    js.dispose()
  }
}

async function runGlobals() {
  const name = 'emitted globals'
  const program = await programFor('default')
  const [rust, js] = await sessions(program)
  const classes = ['fg-red-60', 'animation:fade|1s', 'bg-blue-50@dark', 'm-md']
  compare(name, 'batchEnsure', 'initial', () => rust.ensureClassRules(classes), () => js.ensureClassRules(classes))
  const steps: [Operation, string, Parameters<EngineSession['registerEmittedGlobals']>[0]][] = [
    ['registerEmittedGlobals', 'variable', { variables: { 'color-red-60': 1 } }],
    ['registerEmittedGlobals', 'keyframe', { keyframes: { fade: 1 } }],
    ['replaceEmittedGlobals', 'replace all', { variables: { 'spacing-md': 2 }, suppressedKeyframes: ['fade'] }],
    ['replaceEmittedGlobals', 'clear', {}]
  ]
  for (const [operation, subject, globals] of steps) {
    compare(name, operation, subject, () => rust[operation as 'registerEmittedGlobals'](globals), () => js[operation as 'registerEmittedGlobals'](globals))
    compare(name, 'snapshot', subject, () => rust.snapshot(), () => js.snapshot())
  }
  compare(name, 'refresh', 'same program + globals', () => rust.refresh(program, { variables: { 'color-red-60': 1 } }), () => js.refresh(program, { variables: { 'color-red-60': 1 } }))
  compare(name, 'snapshot', 'after refresh', () => rust.snapshot(), () => js.snapshot())
  compare(name, 'keyframeDefinitions', 'default', () => rust.keyframeDefinitions(), () => js.keyframeDefinitions())
  rust.dispose()
  js.dispose()
}

const startedAt = performance.now()
const markup = markupClasses(root)
await runCorpusCases(corpusEngineCases(root))
await runClassSet('rust tests', rustTestClasses(root))
await runClassSet('site + examples', markup.classes)
await runClassSet(`fuzz (seed ${seed})`, fuzzClasses(manifest, fuzzCount, seed))
await runGlobals()
const elapsed = performance.now() - startedAt

let compared = 0
let mismatched = 0
for (const stats of sources.values()) {
  for (const operation of Object.values(stats.operations)) {
    compared += operation!.compared
    mismatched += operation!.mismatched
  }
}
const report = {
  generatedAt: new Date().toISOString(),
  elapsedMs: Math.round(elapsed),
  config: { fuzzCount, seed, chunkSize, markupFiles: markup.files },
  totals: { compared, mismatched, matched: compared - mismatched },
  coverage: {
    features: coverage.features,
    utilities: { reached: coverage.utilities.size, total: new Set(utilityNames).size, missing: [...new Set(utilityNames)].filter((name) => !coverage.utilities.has(name)) },
    customMedia: { reached: coverage.customMedia.size, total: mediaNames.length, missing: mediaNames.filter((name) => !coverage.customMedia.has(name)) },
    variableFamilies: [...coverage.variables].sort(),
    keyframes: { reached: [...coverage.keyframes].sort(), total: new Set(manifest.keyframes.map((keyframe: { name: string }) => keyframe.name)).size }
  },
  sources: Object.fromEntries(sources)
}

mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'differential.json'), `${JSON.stringify(report, null, 2)}\n`)

const lines = [
  '# Engine differential report',
  '',
  `${report.generatedAt}, ${report.elapsedMs} ms. fuzz=${fuzzCount} seed=${seed} chunk=${chunkSize}`,
  '',
  `**${mismatched} / ${compared} comparisons differ** (Rust full Wasm vs JS engine).`,
  '',
  '| source | candidates | Rust-valid | operation | compared | mismatched |',
  '|---|---|---|---|---|---|'
]
for (const [name, stats] of sources) {
  for (const [operation, operationStats] of Object.entries(stats.operations)) {
    lines.push(`| ${name} | ${stats.candidates} | ${stats.rustValid ?? '—'} | ${operation} | ${operationStats!.compared} | ${operationStats!.mismatched} |`)
  }
}
lines.push('', '## Coverage (Rust-valid classes)', '', '| feature | classes |', '|---|---|')
for (const [feature, count] of Object.entries(coverage.features)) lines.push(`| ${feature} | ${count} |`)
lines.push(
  '',
  `- utilities reached: ${report.coverage.utilities.reached}/${report.coverage.utilities.total}; missing: ${report.coverage.utilities.missing.join(', ') || '—'}`,
  `- custom media reached: ${report.coverage.customMedia.reached}/${report.coverage.customMedia.total}; missing: ${report.coverage.customMedia.missing.join(', ') || '—'}`,
  `- variable families: ${report.coverage.variableFamilies.join(', ')}`,
  `- keyframes: ${report.coverage.keyframes.reached.length}/${report.coverage.keyframes.total} (${report.coverage.keyframes.reached.join(', ')})`,
  '',
  '## First mismatches',
  ''
)
for (const [name, stats] of sources) {
  for (const [operation, operationStats] of Object.entries(stats.operations)) {
    for (const example of operationStats!.examples.slice(0, 2)) lines.push(`- ${name} / ${operation}: \`${JSON.stringify(example).slice(0, 300)}\``)
  }
}
writeFileSync(join(outDir, 'differential.md'), `${lines.join('\n')}\n`)
process.stdout.write(`${lines.slice(0, 6).join('\n')}\nReport: ${join(outDir, 'differential.md')}\n`)
process.exitCode = mismatched ? 1 : 0
