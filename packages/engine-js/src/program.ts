// Decoder for the binary runtime program, matching `decode` in
// crates/mastercss-engine/src/program.rs field for field. Every bound is checked, and
// malformed input yields an error result instead of an exception.
import { NATIVE_CSS_PROPERTIES } from './native-properties'
import {
  MIXIN_PARAMETER_SYNTAXES,
  UTILITY_KINDS,
  UTILITY_LAYERS,
  type DecodeResult,
  type KeyframeDefinition,
  type MediaQuery,
  type MixinDefinition,
  type MixinNode,
  type MixinValuePart,
  type Program,
  type ProgramErrorCode,
  type SourceReference,
  type ThemeNode,
  type TokenFamily,
  type Utility,
  type UtilityEmit,
  type UtilityMatcher,
  type Variable
} from './program-model'
import { selectedInlineValue } from './value'

export const PROGRAM_VERSION = 1
export const LANGUAGE_VERSION = 16
const MAGIC = [0x4d, 0x43, 0x53, 0x50] // MCSP
const MAX_DEPTH = 512
// The Rust engine runs as wasm32, where `usize` is 32 bits wide.
const MAX_U32 = 0xffffffff

class Malformed {
  constructor(readonly code: ProgramErrorCode, readonly message: string) {}
}
const invalid = (message: string): never => {
  throw new Malformed('INVALID_PROGRAM', message)
}

let bytes: Uint8Array
let view: DataView
let position: number
let strings: string[]
let used: number
let depth: number

function byte() {
  if (position >= bytes.length) invalid('truncated')
  return bytes[position++]
}

/** An unsigned LEB128 varint. Values past 2^53 lose precision, but every use rejects them anyway. */
function uint() {
  let value = 0
  for (let shift = 0; shift < 64; shift += 7) {
    const current = byte()
    const bits = current & 0x7f
    if (shift === 63 && bits > 1) invalid('integer overflow')
    value += bits * 2 ** shift
    if (!(current & 0x80)) return value
  }
  return invalid('integer overflow')
}

function u32() {
  const value = uint()
  return value > MAX_U32 ? invalid('integer overflow') : value
}

function i32() {
  const value = uint()
  // Zigzag: even values are non-negative.
  const decoded = value % 2 ? -(value + 1) / 2 : value / 2
  return decoded > 0x7fffffff || decoded < -0x80000000 ? invalid('integer overflow') : decoded
}

function length() {
  const value = uint()
  return value > bytes.length - position ? invalid('length exceeds input') : value
}

function tag(variants: number) {
  const value = byte()
  return value >= variants ? invalid('unknown variant') : value
}

function string() {
  const reference = uint()
  let index: number
  if (reference === 0) index = used++
  else if (reference - 1 < used) index = reference - 1
  else return invalid('unknown string')
  return index < strings.length ? strings[index] : invalid('unknown string')
}

const bool = () => tag(2) === 1
const f64 = () => {
  if (position + 8 > bytes.length) invalid('truncated')
  const value = view.getFloat64(position, true)
  position += 8
  return value
}
const option = <T>(decode: () => T): T | undefined => tag(2) === 1 ? decode() : undefined
function vec<T>(decode: () => T): T[] {
  const count = length()
  const items: T[] = []
  for (let index = 0; index < count; index++) items.push(decode())
  return items
}
function nested<T>(decode: () => T): T {
  if (++depth > MAX_DEPTH) invalid('nesting too deep')
  const value = decode()
  depth--
  return value
}

const stringList = () => vec(string)
const position32 = () => ({ line: u32(), column: u32() })
const sourceReference = (): SourceReference => {
  const file = option(string)
  const range = { start: u32(), end: u32() }
  const loc = option(() => ({ start: position32(), end: position32() }))
  return { file, range, loc }
}
const source = () => option(sourceReference)

function themeNode(): ThemeNode {
  return nested(() => tag(2) === 0
    ? { type: 'rule', prelude: string(), children: vec(themeNode) }
    : { type: 'declaration', name: string(), value: string(), inline: bool(), isStatic: bool() })
}

function keyframe(): KeyframeDefinition {
  return {
    id: string(),
    ownerId: option(string),
    slotId: option(string),
    occurrence: option(u32),
    name: string(),
    text: string(),
    resources: vec(() => ({ start: u32(), end: u32(), value: string() })),
    containers: vec(() => ({ id: string(), prelude: string() })),
    retained: bool(),
    dependencies: stringList(),
    source: source()
  }
}

function mediaQuery(): MediaQuery {
  return nested((): MediaQuery => {
    switch (tag(7)) {
      case 0: return { type: 'true' }
      case 1: return { type: 'false' }
      case 2: return { type: 'feature', value: string() }
      case 3: return { type: 'media-type', name: string() }
      case 4: return { type: 'not', query: mediaQuery() }
      case 5: return { type: 'and', queries: vec(mediaQuery) }
      default: return { type: 'or', queries: vec(mediaQuery) }
    }
  })
}

function valuePart(): MixinValuePart {
  return nested(() => tag(2) === 0
    ? { type: 'text', value: string() }
    : { type: 'function', name: string(), value: vec(valuePart) })
}
const mixinValue = () => vec(valuePart)

function mixinNode(): MixinNode {
  return nested((): MixinNode => {
    switch (tag(5)) {
      case 0: return { type: 'declaration', property: string(), value: mixinValue(), source: source() }
      case 1: return { type: 'rule', selector: string(), body: vec(mixinNode) }
      case 2: return { type: 'condition', condition: string(), body: vec(mixinNode) }
      case 3: return { type: 'apply', name: string(), arguments: vec(mixinValue), contents: option(() => vec(mixinNode)), source: source() }
      default: return { type: 'contents', fallback: vec(mixinNode) }
    }
  })
}

const mixinDefinition = (): MixinDefinition => ({
  name: string(),
  parameters: vec(() => ({
    name: string(),
    syntax: option(() => MIXIN_PARAMETER_SYNTAXES[tag(4)]),
    default: option(string),
    source: source()
  })),
  body: vec(mixinNode),
  source: source()
})

const tokenFamily = (): TokenFamily => ({
  utility: string(),
  prefix: string(),
  namespace: string(),
  argument: tag(2) === 0 ? 'value' : 'key',
  properties: stringList()
})

function variable(): Variable {
  const key = string()
  const namespace = string()
  const name = option(string) ?? (!namespace ? key : !key ? namespace : `${namespace}-${key}`)
  const values = vec(() => ({ path: stringList(), value: string(), inline: bool(), isStatic: bool() }))
  return {
    name,
    key,
    namespace,
    values,
    numeric: option(() => ({ value: f64(), unit: string() })),
    variableType: string(),
    dependencies: stringList(),
    inlineValue: selectedInlineValue(values),
    isStatic: values.some((value) => value.isStatic)
  }
}

interface EncodedUtility extends Omit<Utility, 'name' | 'order'> {
  name?: string
  order?: number
}

function matcher(): UtilityMatcher {
  switch (tag(4)) {
    case 0: return { type: 'static', name: string() }
    case 1: return { type: 'key', keys: stringList() }
    case 2: return { type: 'token', prefix: string() }
    default: return { type: 'function', name: string() }
  }
}

const utility = (): EncodedUtility => ({
  id: string(),
  name: option(string),
  utilityType: i32(),
  order: option(i32),
  layer: UTILITY_LAYERS[tag(4)],
  keys: stringList(),
  aliasGroups: stringList(),
  variableAliases: vec(() => [string(), string()]),
  variableAliasRefs: stringList(),
  nativeFallback: bool(),
  emit: tag(2) === 0
    ? { type: 'recipe', definition: u32(), key: bool() } satisfies UtilityEmit
    : { type: 'property', property: string() },
  matchers: vec(matcher)
})

/** `CSS.escape` as `mastercss_lexer::css_escape` implements it, code unit by code unit. */
export function cssEscape(value: string) {
  if (value === '-') return '\\-'
  let result = ''
  for (let index = 0; index < value.length; index++) {
    const unit = value.charCodeAt(index)
    const digit = unit >= 0x30 && unit <= 0x39
    if (unit === 0) result += '�'
    else if (unit <= 0x1f || unit === 0x7f || (index === 0 && digit) || (index === 1 && digit && value.charCodeAt(0) === 0x2d)) {
      result += `\\${unit.toString(16)} `
    } else if (unit >= 0x80) {
      // Rust converts each code unit alone, so surrogate halves become U+FFFD.
      result += unit >= 0xd800 && unit <= 0xdfff ? '�' : value[index]
    } else if (unit === 0x2d || unit === 0x5f || digit || (unit >= 0x41 && unit <= 0x5a) || (unit >= 0x61 && unit <= 0x7a)) {
      result += value[index]
    } else {
      result += `\\${value[index]}`
    }
  }
  return result
}

/** Disjunction of conjunctions of native media queries, as `custom_media_branches` builds it. */
export function customMediaBranches(query: MediaQuery): string[][] | undefined {
  let remaining = 32768
  const branches = (query: MediaQuery, negate: boolean, level: number): string[][] | undefined => {
    if (remaining === 0 || level > 128) return
    remaining--
    switch (query.type) {
      case 'true': return negate ? [] : [[]]
      case 'false': return negate ? [[]] : []
      case 'feature': return [[negate ? `not ${query.value}` : query.value]]
      case 'media-type': {
        const name = cssEscape(query.name)
        return [[negate ? `not ${name}` : name]]
      }
      case 'not': return branches(query.query, !negate, level + 1)
      default: {
        const and = (query.type === 'and') !== negate
        let result: string[][] = and ? [[]] : []
        for (const item of query.queries) {
          const next = branches(item, negate, level + 1)
          if (!next) return
          if ((and ? result.length * next.length : result.length + next.length) > 4096) return
          result = and ? result.flatMap((prefix) => next.map((suffix) => [...prefix, ...suffix])) : [...result, ...next]
        }
        return result
      }
    }
  }
  return branches(query, false, 0)
}

function push<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const values = map.get(key)
  if (values) values.push(value)
  else map.set(key, [value])
}

/** What `finish_program` derives: native utilities, defaults, match order and indexes. */
function finish(program: Program, encoded: EncodedUtility[]) {
  const ids = new Set(encoded.map((entry) => entry.id))
  for (const property of NATIVE_CSS_PROPERTIES) {
    const id = `native:${property}`
    if (ids.has(id)) continue
    ids.add(id)
    encoded.push({
      id,
      name: property,
      utilityType: 0,
      order: 0,
      layer: 'utilities',
      keys: [],
      aliasGroups: [],
      variableAliases: [],
      variableAliasRefs: [],
      nativeFallback: true,
      emit: { type: 'property', property },
      matchers: [{ type: 'key', keys: [property] }]
    })
  }
  const count = encoded.length
  const utilities = encoded.map((entry, index): Utility => ({
    ...entry,
    name: entry.name ?? entry.id,
    order: entry.order ?? count - index - 1
  }))
  const isStatic = (entry: Utility) => entry.matchers.some((item) => item.type === 'static')
  program.utilities = [...utilities.filter(isStatic), ...utilities.filter((entry) => !isStatic(entry))]
  for (const [index, entry] of program.utilities.entries()) {
    for (const item of entry.matchers) {
      if (item.type === 'token') push(program.tokenUtilities, item.prefix, index)
      else if (item.type === 'key') for (const key of item.keys) push(program.keyUtilities, key, index)
      else if (item.type === 'function') program.functionUtilities.set(item.name, index)
      else push(program.staticUtilities, item.name, index)
    }
  }
  for (const prefix of program.tokenUtilities.keys()) push(program.tokenPrefixes, prefix[0] ?? '', prefix)
  for (const prefixes of program.tokenPrefixes.values()) prefixes.sort((left, right) => right.length - left.length)
}

export function decodeProgram(input: Uint8Array): DecodeResult {
  bytes = input
  view = new DataView(input.buffer, input.byteOffset, input.byteLength)
  position = 0
  strings = []
  used = 0
  depth = 0
  try {
    if (MAGIC.some((value, index) => input[index] !== value)) invalid('not a Master CSS program')
    position = MAGIC.length
    if (uint() !== PROGRAM_VERSION || uint() !== LANGUAGE_VERSION) {
      throw new Malformed('UNSUPPORTED_PROGRAM_VERSION', 'unsupported program version')
    }
    const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true })
    const count = length()
    for (let index = 0; index < count; index++) {
      const size = length()
      try {
        strings.push(decoder.decode(input.subarray(position, position + size)))
      } catch {
        invalid('invalid UTF-8')
      }
      position += size
    }
    const program: Program = {
      theme: vec(themeNode),
      keyframes: vec(keyframe),
      animationVariables: new Map(vec(() => [string(), stringList()] as const)),
      customMedia: new Map(vec(() => [string(), mediaQuery()] as const)),
      customMediaPaths: new Map(),
      mixins: vec(mixinDefinition),
      utilityDefinitions: vec(() => ({ kind: UTILITY_KINDS[tag(3)], recipe: mixinDefinition() })),
      tokenFamilies: vec(tokenFamily),
      variables: new Map(),
      variableOrder: [],
      hasInlineTokens: false,
      utilities: [],
      staticUtilities: new Map(),
      keyUtilities: new Map(),
      tokenUtilities: new Map(),
      functionUtilities: new Map(),
      tokenPrefixes: new Map()
    }
    const variables = vec(variable)
    const encoded = vec(utility)
    if (position !== input.length || used !== strings.length) invalid('trailing bytes')
    for (const entry of variables) {
      program.variables.set(entry.name, entry)
      program.variableOrder.push(entry.name)
      if (entry.inlineValue !== undefined) program.hasInlineTokens = true
    }
    if (program.variables.size !== variables.length) invalid('duplicate variable')
    for (const entry of encoded) {
      if (entry.emit.type === 'recipe' && entry.emit.definition >= program.utilityDefinitions.length) invalid('unknown recipe')
    }
    for (const [name, query] of program.customMedia) {
      const paths = customMediaBranches(query)
      if (!paths) invalid('invalid custom media')
      program.customMediaPaths.set(name, paths!)
    }
    finish(program, encoded)
    return { ok: true, program }
  } catch (error) {
    if (error instanceof Malformed) return { ok: false, error: { code: error.code, message: error.message } }
    // A stack overflow from hostile nesting is still a malformed program.
    if (error instanceof RangeError) return { ok: false, error: { code: 'INVALID_PROGRAM', message: 'nesting too deep' } }
    throw error
  } finally {
    bytes = view = strings = undefined!
  }
}
