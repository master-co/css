// J1 gate: the JS decoder reads every program the Rust encoder writes exactly as Rust
// does. For each manifest the harness uses, it checks that
// - re-encoding the decoded program in the Rust layout reproduces the Rust bytes,
// - table sizes, name sets and samples agree with the manifest and the Rust session,
// - truncated and bit-flipped programs are accepted or rejected exactly when the Rust
//   engine Wasm accepts or rejects them, without the decoder throwing.
//
//   node --import tsx packages/engine-js/scripts/verify-program.mts [--flips 4000] [--seed 1]
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compileRuntimeProgram, createWasmEngineSession } from '../../binding-wasm-engine/src/node.ts'
import { decodeProgram, LANGUAGE_VERSION, PROGRAM_VERSION } from '../src/program.ts'
import type { KeyframeDefinition, MediaQuery, MixinDefinition, MixinNode, MixinValuePart, Program, SourceReference, ThemeNode } from '../src/program-model.ts'
import { corpusEngineCases } from './class-sources.mts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const args = new Map<string, string>()
for (let index = 2; index < process.argv.length; index += 2) args.set(process.argv[index].replace(/^--/, ''), process.argv[index + 1])
const flips = Number(args.get('flips') ?? 4000)
let seed = Number(args.get('seed') ?? 1)
const failures: string[] = []
const fail = (message: string) => {
  if (failures.length < 50) failures.push(message)
  else if (failures.length === 50) failures.push('…')
}

// ---- Encoder in the Rust layout, for the round trip ----
class Writer {
  body: number[] = []
  indexes = new Map<string, number>()
  strings: string[] = []
  uint(value: number) {
    for (;;) {
      const low = value % 128
      value = Math.floor(value / 128)
      if (!value) return void this.body.push(low)
      this.body.push(low | 0x80)
    }
  }
  int(value: number) { this.uint(value < 0 ? -value * 2 - 1 : value * 2) }
  bool(value: boolean) { this.uint(value ? 1 : 0) }
  string(value: string) {
    const index = this.indexes.get(value)
    if (index !== undefined) return this.uint(index + 1)
    this.indexes.set(value, this.strings.length)
    this.strings.push(value)
    this.uint(0)
  }
  f64(value: number) {
    const buffer = new DataView(new ArrayBuffer(8))
    buffer.setFloat64(0, value, true)
    for (let index = 0; index < 8; index++) this.body.push(buffer.getUint8(index))
  }
  option<T>(value: T | undefined, encode: (value: T) => void) {
    if (value === undefined) return this.uint(0)
    this.uint(1)
    encode(value)
  }
  vec<T>(values: readonly T[], encode: (value: T) => void) {
    this.uint(values.length)
    for (const value of values) encode(value)
  }
  finish() {
    const header = new Writer()
    header.body.push(0x4d, 0x43, 0x53, 0x50)
    header.uint(PROGRAM_VERSION)
    header.uint(LANGUAGE_VERSION)
    header.uint(this.strings.length)
    const encoder = new TextEncoder()
    for (const value of this.strings) {
      const encoded = encoder.encode(value)
      header.uint(encoded.length)
      header.body.push(...encoded)
    }
    return Uint8Array.from([...header.body, ...this.body])
  }
}

const byteOrder = (left: string, right: string) => Buffer.compare(Buffer.from(left), Buffer.from(right))

function encode(program: Program) {
  const w = new Writer()
  const s = (value: string) => w.string(value)
  const strings = (values: readonly string[]) => w.vec(values, s)
  const source = (value?: SourceReference) => w.option(value, (reference) => {
    w.option(reference.file, s)
    w.uint(reference.range.start)
    w.uint(reference.range.end)
    w.option(reference.loc, (loc) => {
      w.uint(loc.start.line); w.uint(loc.start.column); w.uint(loc.end.line); w.uint(loc.end.column)
    })
  })
  const theme = (node: ThemeNode): void => {
    if (node.type === 'rule') { w.uint(0); s(node.prelude); w.vec(node.children, theme) }
    else { w.uint(1); s(node.name); s(node.value); w.bool(node.inline); w.bool(node.isStatic) }
  }
  const keyframe = (value: KeyframeDefinition) => {
    s(value.id); w.option(value.ownerId, s); w.option(value.slotId, s); w.option(value.occurrence, (n) => w.uint(n))
    s(value.name); s(value.text)
    w.vec(value.resources, (resource) => { w.uint(resource.start); w.uint(resource.end); s(resource.value) })
    w.vec(value.containers, (container) => { s(container.id); s(container.prelude) })
    w.bool(value.retained); strings(value.dependencies); source(value.source)
  }
  const media = (query: MediaQuery): void => {
    const tags = ['true', 'false', 'feature', 'media-type', 'not', 'and', 'or']
    w.uint(tags.indexOf(query.type))
    if (query.type === 'feature') s(query.value)
    else if (query.type === 'media-type') s(query.name)
    else if (query.type === 'not') media(query.query)
    else if (query.type === 'and' || query.type === 'or') w.vec(query.queries, media)
  }
  const part = (value: MixinValuePart): void => {
    if (value.type === 'text') { w.uint(0); s(value.value) }
    else { w.uint(1); s(value.name); w.vec(value.value, part) }
  }
  const mixinValue = (value: MixinValuePart[]) => w.vec(value, part)
  const node = (value: MixinNode): void => {
    switch (value.type) {
      case 'declaration': w.uint(0); s(value.property); mixinValue(value.value); source(value.source); break
      case 'rule': w.uint(1); s(value.selector); w.vec(value.body, node); break
      case 'condition': w.uint(2); s(value.condition); w.vec(value.body, node); break
      case 'apply': w.uint(3); s(value.name); w.vec(value.arguments, mixinValue); w.option(value.contents, (contents) => w.vec(contents, node)); source(value.source); break
      case 'contents': w.uint(4); w.vec(value.fallback, node)
    }
  }
  const mixin = (value: MixinDefinition) => {
    s(value.name)
    w.vec(value.parameters, (parameter) => {
      s(parameter.name)
      w.option(parameter.syntax, (syntax) => w.uint(['integer', 'number', 'string', 'custom-ident'].indexOf(syntax)))
      w.option(parameter.default, s)
      source(parameter.source)
    })
    w.vec(value.body, node)
    source(value.source)
  }
  w.vec(program.theme, theme)
  w.vec(program.keyframes, keyframe)
  w.vec([...program.animationVariables].sort(([left], [right]) => byteOrder(left, right)), ([name, values]) => { s(name); strings(values) })
  w.vec([...program.customMedia].sort(([left], [right]) => byteOrder(left, right)), ([name, query]) => { s(name); media(query) })
  w.vec(program.mixins, mixin)
  w.vec(program.utilityDefinitions, (definition) => { w.uint(['static', 'token', 'function'].indexOf(definition.kind)); mixin(definition.recipe) })
  w.vec(program.tokenFamilies, (family) => { s(family.utility); s(family.prefix); s(family.namespace); w.uint(family.argument === 'value' ? 0 : 1); strings(family.properties) })
  w.vec(program.variableOrder.map((name) => program.variables.get(name)!), (variable) => {
    s(variable.key); s(variable.namespace)
    const defaultName = !variable.namespace ? variable.key : !variable.key ? variable.namespace : `${variable.namespace}-${variable.key}`
    w.option(variable.name === defaultName ? undefined : variable.name, s)
    w.vec(variable.values, (value) => { strings(value.path); s(value.value); w.bool(value.inline); w.bool(value.isStatic) })
    w.option(variable.numeric, (numeric) => { w.f64(numeric.value); s(numeric.unit) })
    s(variable.variableType); strings(variable.dependencies)
  })
  // Rust encodes registered utilities after `finish_program` named and ordered them.
  w.vec(program.utilities.filter((utility) => !utility.nativeFallback), (utility) => {
    s(utility.id); w.option(utility.name, s); w.int(utility.utilityType); w.option(utility.order, (order) => w.int(order))
    w.uint(['base', 'defaults', 'components', 'utilities'].indexOf(utility.layer))
    strings(utility.keys); strings(utility.aliasGroups)
    w.vec(utility.variableAliases, ([alias, variable]) => { s(alias); s(variable) })
    strings(utility.variableAliasRefs); w.bool(utility.nativeFallback)
    if (utility.emit.type === 'recipe') { w.uint(0); w.uint(utility.emit.definition); w.bool(utility.emit.key) }
    else { w.uint(1); s(utility.emit.property) }
    w.vec(utility.matchers, (matcher) => {
      const tags = ['static', 'key', 'token', 'function']
      w.uint(tags.indexOf(matcher.type))
      if (matcher.type === 'key') strings(matcher.keys)
      else s(matcher.type === 'token' ? matcher.prefix : matcher.name)
    })
  })
  return w.finish()
}

// ---- Comparisons ----
/** Rust's JSON for keyframe definitions omits `None`, empty lists and `false`. */
function serdeShape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(serdeShape)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .filter(([, item]) => item !== undefined && item !== false && !(Array.isArray(item) && !item.length))
      .map(([key, item]) => [key, serdeShape(item)]))
  }
  return value
}
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right)

async function rustAccepts(program: Uint8Array) {
  try {
    const session = await createWasmEngineSession(program)
    const keyframes = session.keyframeDefinitions()
    session.dispose()
    return { ok: true as const, keyframes }
  } catch (error) {
    return { ok: false as const, error: String((error as Error).message ?? error) }
  }
}

interface ManifestJSON {
  utilities?: { name: string }[]
  variables?: Record<string, { key: string, values: unknown[] }[]>
  customMedia?: Record<string, unknown>
  keyframes?: { id: string }[]
}

const summaries: string[] = []
async function verifyManifest(label: string, manifestJSON: string) {
  const bytes = await compileRuntimeProgram(manifestJSON)
  const result = decodeProgram(bytes)
  if (!result.ok) return fail(`${label}: decode failed: ${result.error.message}`)
  const { program } = result
  const reencoded = encode(program)
  if (Buffer.compare(Buffer.from(reencoded), Buffer.from(bytes)) !== 0) {
    let at = 0
    while (reencoded[at] === bytes[at]) at++
    fail(`${label}: re-encoding differs from the Rust bytes at offset ${at} (${reencoded.length} vs ${bytes.length} bytes)`)
  }
  const rust = await rustAccepts(bytes)
  if (!rust.ok) fail(`${label}: Rust rejects its own program`)
  else if (!same(serdeShape(program.keyframes), rust.keyframes)) fail(`${label}: keyframe definitions differ from the Rust session`)
  const manifest = JSON.parse(manifestJSON) as ManifestJSON
  const manifestMedia = Object.keys(manifest.customMedia ?? {}).sort()
  if (!same([...program.customMedia.keys()].sort(), manifestMedia)) fail(`${label}: custom media names differ from the manifest`)
  const manifestVariables = Object.entries(manifest.variables ?? {}).flatMap(([namespace, entries]) => entries.map((entry) => ({ namespace, ...entry })))
  if (program.variables.size !== manifestVariables.length) fail(`${label}: ${program.variables.size} variables, manifest has ${manifestVariables.length}`)
  for (const entry of manifestVariables) {
    const name = !entry.namespace ? entry.key : !entry.key ? entry.namespace : `${entry.namespace}-${entry.key}`
    const variable = program.variables.get(name)
    if (!variable) fail(`${label}: missing variable ${name}`)
    else if (variable.values.length !== entry.values.length) fail(`${label}: variable ${name} value count differs`)
  }
  const registered = program.utilities.filter((utility) => !utility.nativeFallback)
  // Each manifest utility compiles to one recipe of the same name.
  if (!same((manifest.utilities ?? []).map((utility) => utility.name), program.utilityDefinitions.map((definition) => definition.recipe.name))) {
    fail(`${label}: recipe names differ from the manifest utilities`)
  }
  summaries.push(`| ${label} | ${bytes.length} | ${registered.length} | ${program.utilities.length} | ${program.tokenUtilities.size} | ${program.variables.size} | ${program.customMedia.size} | ${program.keyframes.length} | ${program.mixins.length} | ${program.utilityDefinitions.length} | ${program.tokenFamilies.length} |`)
  return { bytes, program }
}

function random() {
  seed |= 0
  seed = seed + 0x6D2B79F5 | 0
  let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
  return ((t ^ t >>> 14) >>> 0) / 4294967296
}

async function mutate(label: string, base: Uint8Array) {
  const outcomes = { truncations: 0, flips: 0, bothAccept: 0, bothReject: 0, mismatched: 0, threw: 0 }
  async function compareOutcome(kind: string, bytes: Uint8Array) {
    let js
    try {
      js = decodeProgram(bytes)
    } catch (error) {
      outcomes.threw++
      return fail(`${label} ${kind}: decoder threw ${error}`)
    }
    const rust = await rustAccepts(bytes)
    if (rust.ok !== js.ok) {
      outcomes.mismatched++
      return fail(`${label} ${kind}: Rust ${rust.ok ? 'accepts' : `rejects (${rust.error})`}, JS ${js.ok ? 'accepts' : `rejects (${js.error.message})`}`)
    }
    if (rust.ok && js.ok) {
      outcomes.bothAccept++
      if (!same(serdeShape(js.program.keyframes), rust.keyframes)) {
        outcomes.mismatched++
        fail(`${label} ${kind}: both accept, keyframes differ`)
      }
    } else outcomes.bothReject++
  }
  // Every prefix of the first 4 KB, then every 97th one.
  for (let size = 0; size < base.length; size += size < 4096 ? 1 : 97) {
    outcomes.truncations++
    await compareOutcome(`truncated to ${size}`, base.subarray(0, size))
  }
  for (let index = 0; index < flips; index++) {
    const bytes = base.slice()
    const offset = Math.floor(random() * bytes.length)
    const bit = Math.floor(random() * 8)
    bytes[offset] ^= 1 << bit
    outcomes.flips++
    await compareOutcome(`bit ${bit} of byte ${offset} flipped`, bytes)
  }
  return outcomes
}

const startedAt = performance.now()
const defaultManifest = readFileSync(join(root, 'packages/preset/src/default-manifest.json'), 'utf8')
const verified = await verifyManifest('default', defaultManifest)
const seen = new Set([defaultManifest])
for (const engineCase of corpusEngineCases(root)) {
  if (engineCase.manifest === 'default') continue
  const json = JSON.stringify(engineCase.manifest)
  if (seen.has(json)) continue
  seen.add(json)
  await verifyManifest(engineCase.id, json)
}
const mutation = verified ? await mutate('default', verified.bytes) : undefined

// Decode speed on the default program.
let decodeMs = Infinity
if (verified) {
  for (let round = 0; round < 50; round++) {
    const at = performance.now()
    decodeProgram(verified.bytes)
    decodeMs = Math.min(decodeMs, performance.now() - at)
  }
}

const lines = [
  '# Program decoder verification',
  '',
  `${new Date().toISOString()}, ${Math.round(performance.now() - startedAt)} ms. flips=${flips}`,
  '',
  failures.length ? `**${failures.length} failure(s)**` : '**All checks pass.**',
  '',
  '| manifest | bytes | registered utilities | all utilities | token prefixes | variables | custom media | keyframes | mixins | recipes | token families |',
  '|---|---|---|---|---|---|---|---|---|---|---|',
  ...summaries,
  '',
  mutation ? `Mutations of the default program: ${mutation.truncations} truncations, ${mutation.flips} bit flips; both accept ${mutation.bothAccept}, both reject ${mutation.bothReject}, mismatched ${mutation.mismatched}, decoder threw ${mutation.threw}.` : '',
  `Default program decode: ${decodeMs.toFixed(2)} ms (best of 50, Node).`,
  '',
  ...failures.map((failure) => `- ${failure}`)
]
process.stdout.write(`${lines.join('\n')}\n`)
process.exitCode = failures.length ? 1 : 0
