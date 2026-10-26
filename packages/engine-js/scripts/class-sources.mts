// Class sources for the differential harness. Every source returns raw candidates;
// invalid ones are kept on purpose, since both engines must reject them alike.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

export interface EngineCaseStep {
  op: 'ensure' | 'delete'
  classes: string[]
}

export interface EngineCase {
  id: string
  manifest: 'default' | Record<string, unknown>
  steps: EngineCaseStep[]
}

const SKIP_DIRECTORIES = new Set(['node_modules', 'dist', '.next', '.nuxt', '.astro', '.output', 'target', '.git', '.turbo', 'artifacts', 'public'])

function walk(root: string, extensions: Set<string>, files: string[] = []) {
  let entries: string[]
  try {
    entries = readdirSync(root)
  } catch {
    return files
  }
  for (const entry of entries) {
    if (SKIP_DIRECTORIES.has(entry)) continue
    const path = join(root, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) walk(path, extensions, files)
    else if (extensions.has(extname(entry))) files.push(path)
  }
  return files
}

// A class candidate has no whitespace or quotes and contains a Master CSS separator.
const CANDIDATE = /^[^\s"'`<>]{2,160}$/
function isCandidate(token: string) {
  return CANDIDATE.test(token) && /[:(@{!-]/.test(token) && !/^(https?:|\/\/|\.\/|\.\.\/)/.test(token)
}

function splitCandidates(text: string, into: Set<string>) {
  for (const token of text.split(/\s+/)) if (isCandidate(token)) into.add(token)
}

export function corpusEngineCases(root: string): EngineCase[] {
  const corpus = JSON.parse(readFileSync(join(root, 'parity/v2-language-corpus.json'), 'utf8')) as {
    engineCases: { id: string, manifest: EngineCase['manifest'], steps: { op: string, classes?: string[] }[] }[]
  }
  return corpus.engineCases.map((engineCase) => ({
    id: engineCase.id,
    manifest: engineCase.manifest,
    steps: engineCase.steps
      .filter((step): step is EngineCaseStep => (step.op === 'ensure' || step.op === 'delete') && Array.isArray(step.classes))
  }))
}

/** String literals in the Rust engine and compiler sources and tests. */
export function rustTestClasses(root: string) {
  const classes = new Set<string>()
  for (const crate of ['crates/mastercss-engine', 'crates/mastercss-compiler']) {
    for (const file of walk(join(root, crate), new Set(['.rs', '.json']))) {
      const text = readFileSync(file, 'utf8')
      // Plain Rust string literals and JSON strings; escapes stay as written.
      for (const match of text.matchAll(/"((?:[^"\\\n]|\\.){2,400})"/g)) {
        splitCandidates(match[1].replaceAll('\\\\', '\\').replaceAll('\\"', '"'), classes)
      }
    }
  }
  return classes
}

/** `class`, `className` and `class:list` attribute values in the site and examples. */
export function markupClasses(root: string) {
  const classes = new Set<string>()
  const files: string[] = []
  for (const directory of ['site', 'examples']) {
    walk(join(root, directory), new Set(['.html', '.tsx', '.jsx', '.vue', '.svelte', '.astro', '.md', '.mdx', '.ts', '.php']), files)
  }
  const attribute = /\b(?:class|className|class:list)\s*=\s*(?:\{\s*)?(["'`])([\s\S]*?)\1/g
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    for (const match of text.matchAll(attribute)) splitCandidates(match[2].replace(/\$\{[^}]*\}/g, ' '), classes)
  }
  return { classes, files: files.map((file) => relative(root, file)).length }
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

interface ManifestLike {
  utilities: { kind: string, name: string, parameters?: { syntax: string }[] }[]
  variables: Record<string, { key: string }[]>
  customMedia: Record<string, unknown>
  keyframes: { name: string }[]
}

const NATIVE_DECLARATIONS = [
  'display:block', 'display:flex', 'display:grid', 'width:10px', 'width:calc(100%-2rem)', 'height:50%',
  'margin:-.25rem', 'margin:0.25rem', 'padding:1rem|2rem', 'color:#fff', 'color:rgb(0,0,0,0.75)',
  'background-color:oklch(60%|.2|240/.5)', 'border:1px|solid|var(--color-red-60)', 'font-size:min(.625rem,calc(1.5625rem-.625rem))',
  'transition:opacity|300ms|ease|100ms', 'animation:fade|1s', 'opacity:.5', 'z-index:10', 'gap:1.5rem', 'inset:0',
  'content:\'a_b\'', 'grid-template-columns:repeat(3,1fr)', 'transform:translate(1px,2px)', 'line-height:1.2',
  'width:clamp(1px,2px+3px,4px)', 'top:1', 'margin-top:2', 'font-weight:600', '--x:1', 'aspect-ratio:16/9'
]
const STATES = [':hover', ':focus', ':active', ':first', '::before', '::after', ':nth-child(2n+1)', '.active', '[disabled]', ':not(.disabled)', ':is(_foo)', ':of(.active>)', '_button', ':where(h1,h2)']
const PRIMITIVE_CONDITIONS = ['@layer(base)', '@layer(defaults)', '@layer(components)', '@starting-style', '@print']

/** Grammar-driven combinations of utilities, values, states and conditions. */
export function fuzzClasses(manifest: ManifestLike, count: number, seed: number) {
  const random = mulberry32(seed)
  const pick = <T,>(values: readonly T[]) => values[Math.floor(random() * values.length)]
  const namespaces = Object.entries(manifest.variables).filter(([, values]) => values.length)
  const media = Object.keys(manifest.customMedia).map((name) => `@${name.slice(2)}`)
  const conditions = [...media, ...PRIMITIVE_CONDITIONS]
  const keyframes = manifest.keyframes.map((keyframe) => keyframe.name)
  const bases: (() => string)[] = [
    () => pick(NATIVE_DECLARATIONS),
    () => {
      const utility = pick(manifest.utilities.filter((entry) => entry.kind === 'token'))
      const [, values] = pick(namespaces)
      return `${utility.name}-${pick(values).key}`
    },
    () => {
      const utility = pick(manifest.utilities.filter((entry) => entry.kind === 'function'))
      return `${utility.name}(${1 + Math.floor(random() * 12)})`
    },
    () => pick(manifest.utilities.filter((entry) => entry.kind === 'static')).name,
    () => `animation:${pick(keyframes)}|${pick(['1s', '300ms', '2s|infinite'])}`,
    () => `{${pick(NATIVE_DECLARATIONS)};${pick(NATIVE_DECLARATIONS)}}`
  ]
  const classes = new Set<string>()
  for (let attempt = 0; classes.size < count && attempt < count * 10; attempt++) {
    let className = pick(bases)()
    if (random() < 0.12) className = `-${className}`
    if (random() < 0.1) className += '!'
    if (random() < 0.45) className += pick(STATES)
    if (random() < 0.15) className += pick(STATES)
    if (random() < 0.45) className += pick(conditions)
    if (random() < 0.1) className += pick(conditions)
    classes.add(className)
  }
  return classes
}
