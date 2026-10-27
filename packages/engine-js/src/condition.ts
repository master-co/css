// Class conditions: native queries, layers, `@starting-style` and custom media, with the
// range features that order conditional rules, as the engine's condition.rs and
// custom_media.rs and the lexer's query.rs read them.
import { decodeNativeContent } from './class-syntax'
import { DELIM, DIMENSION, FUNCTION, IDENT, NUMBER, PERCENTAGE, tokenize, type Token, isNameCodePoint } from './css-syntax'
import { naturalCompare } from './order'
import type { MediaQuery, UtilityLayer } from './program-model'
import { asciiLowercase, isAsciiCase, isWhitespace, trim } from './text'
import type { ConditionFeature } from './types'
import { parseDecimal, decimalIsFinite, decimalToNumber } from './value'

const isDelim = (token: Token | undefined, value: string) => token?.kind === DELIM && token.value === value
const QUERY_KEYWORDS = ['and', 'or', 'not', 'only']
const isKeyword = (name: string) => QUERY_KEYWORDS.some((keyword) => isAsciiCase(name, keyword))

export interface NativeQuery {
  kind: string
  prelude: string
}

/** A `media(…)`, `supports(…)` or `container(…)` condition simple enough for a class. */
export function parseNativeQuery(token: string): NativeQuery | undefined {
  const open = token.indexOf('(')
  const kind = token.slice(0, open)
  if (open < 0 || (kind !== 'media' && kind !== 'supports' && kind !== 'container') || !token.endsWith(')')) return
  const prelude = decodeNativeContent(token.slice(open + 1, -1))
  if (prelude === undefined || !trim(prelude) || !simpleQuery(kind, prelude)) return
  return { kind, prelude }
}

function simpleQuery(kind: string, prelude: string) {
  const tokens = tokenize(prelude)
  if (!tokens.length) return false
  const isName = (token: Token | undefined) => token?.kind === IDENT && !isKeyword(token.value)
  if (kind === 'media' && tokens.length === 1) return isName(tokens[0])
  const start = kind === 'container' && isName(tokens[0]) ? 1 : 0
  const group = tokens[start]
  if (!group) return false
  const style = kind === 'container' && group.kind === FUNCTION && isAsciiCase(group.value, 'style')
  if ((!style && !isDelim(group, '(')) || group.close !== tokens.length - 1) return false
  const end = tokens.length - 1
  const inner = tokens.slice(start + 1, end)
  if (!inner.length) return false
  const ident = isName(inner[0]) && (!style || inner[0].value.startsWith('--'))
  const declaration = inner.length > 2 && isDelim(inner[1], ':') && simpleValue(tokens, start + 3, end)
  if (style || kind === 'supports') return ident && ((style && inner.length === 1) || declaration)
  if (ident && inner.length === 1) return true
  if (ident && inner.length > 2 && isDelim(inner[1], ':')) return declaration
  // One or two comparisons; each operand is one token, function or numeric ratio.
  const operands: boolean[] = []
  const comparisons: string[] = []
  let index = start + 1
  while (index < end) {
    const token = tokens[index]
    const name = isName(token)
    if (!name && token.kind !== NUMBER && token.kind !== DIMENSION && token.kind !== PERCENTAGE && token.kind !== FUNCTION) return false
    operands.push(name)
    index = token.close < 0 ? index + 1 : token.close + 1
    if (index + 1 < end && isDelim(tokens[index], '/') && tokens[index + 1].kind === NUMBER) index += 2
    if (index === end) break
    const operator = tokens[index]
    if (operator.kind !== DELIM || !'<>='.includes(operator.value)) return false
    index++
    if (operator.value !== '=' && index < end && isDelim(tokens[index], '=')) index++
    comparisons.push(operator.value)
    if (index === end) return false
  }
  if (comparisons.length === 1) return operands.length === 2 && operands.filter(Boolean).length === 1
  return comparisons.length === 2 && comparisons[0] === comparisons[1] && comparisons[0] !== '='
    && operands.length === 3 && !operands[0] && operands[1] && !operands[2]
}

/** A feature value without query structure: functions only, no bare groups or separators. */
function simpleValue(tokens: Token[], index: number, end: number) {
  while (index < end) {
    const token = tokens[index]
    if (token.kind === DELIM && '|;{}'.includes(token.value)) return false
    if (token.close >= 0) {
      if (token.kind !== FUNCTION) return false
      index = token.close + 1
    } else {
      index++
    }
  }
  return true
}

export function resolveLayerCondition(token: string): UtilityLayer | undefined {
  if (!token.startsWith('layer(') || !token.endsWith(')')) return
  const name = token.slice(6, -1)
  return name === 'base' || name === 'defaults' || name === 'components' || name === 'utilities' ? name : undefined
}

/** A condition's wrapper rule and its kind, for conditions that are not custom media or layers. */
export function renderConditionToken(token: string): [kind: string, wrapper: string] | undefined {
  if (token === 'starting-style') return ['starting-style', '@starting-style']
  const query = parseNativeQuery(token)
  return query && [query.kind, `@${query.kind} ${query.prelude}`]
}

const RANGE_FEATURES = new Set(['width', 'height', 'resolution', 'aspect-ratio'])

function rangeDimension(value: string): [number, string] | undefined {
  const end = value.search(/[^0-9.+-]/)
  const decimal = parseDecimal(end < 0 ? value : value.slice(0, end))
  const unit = end < 0 ? '' : value.slice(end)
  if (!decimal || !decimalIsFinite(decimal) || !/^[a-zA-Z%]*$/.test(unit)) return
  return [decimalToNumber(decimal), asciiLowercase(unit)]
}

function intersectRange(target: ConditionFeature, source: ConditionFeature) {
  const lower = source.lower
  if (lower) {
    if (target.lower && target.lower.value === lower.value) target.lower.inclusive &&= lower.inclusive
    else if (!target.lower || !(target.lower.value > lower.value)) target.lower = { ...lower }
  }
  const upper = source.upper
  if (upper) {
    if (target.upper && target.upper.value === upper.value) target.upper.inclusive &&= upper.inclusive
    else if (!target.upper || !(target.upper.value < upper.value)) target.upper = { ...upper }
  }
}

function addConditionFeature(features: ConditionFeature[], name: string, operator: string, value: number) {
  const colon = name.indexOf(':')
  const feature = colon < 0 ? name : name.slice(0, colon)
  const unit = colon < 0 ? '' : name.slice(colon + 1)
  const bound = { value, inclusive: operator.includes('=') }
  const source: ConditionFeature = { domain: '', feature, unit, lower: null, upper: null }
  if (operator === '>' || operator === '>=') source.lower = bound
  else if (operator === '<' || operator === '<=') source.upper = bound
  else if (operator === '=') {
    source.lower = bound
    source.upper = { ...bound }
  } else return
  const target = features.find((item) => item.feature === feature && item.unit === unit)
  if (target) intersectRange(target, source)
  else features.push(source)
}

const REVERSED: Record<string, string> = { '>': '<', '>=': '<=', '<': '>', '<=': '>=', '=': '=' }

function addRangeFeatures(features: ConditionFeature[], body: string) {
  const colon = body.indexOf(':')
  if (colon >= 0) {
    let name = trim(body.slice(0, colon))
    let operator = '='
    if (name.startsWith('min-')) [name, operator] = [name.slice(4), '>=']
    else if (name.startsWith('max-')) [name, operator] = [name.slice(4), '<=']
    const dimension = rangeDimension(trim(body.slice(colon + 1)))
    if (!dimension || !RANGE_FEATURES.has(name)) return false
    addConditionFeature(features, `${name}:${dimension[1]}`, operator, dimension[0])
    return true
  }
  const operands: string[] = []
  const operators: string[] = []
  let remaining = body
  for (let index = remaining.search(/[<>=]/); index >= 0; index = remaining.search(/[<>=]/)) {
    operands.push(trim(remaining.slice(0, index)))
    remaining = remaining.slice(index)
    const end = remaining.search(/[^<>=]/)
    operators.push(end < 0 ? remaining : remaining.slice(0, end))
    remaining = end < 0 ? '' : remaining.slice(end)
  }
  operands.push(trim(remaining))
  if (!operators.length || operators.length > 2) return false
  if (operators.length === 2 && (!RANGE_FEATURES.has(operands[1]) || operators[0][0] === '=' || operators[0][0] !== operators[1][0])) return false
  for (const [index, operator] of operators.entries()) {
    const [left, right] = [operands[index], operands[index + 1]]
    let name: string
    let value: string
    let direction: string | undefined = operator
    if (RANGE_FEATURES.has(left)) [name, value] = [left, right]
    else if (RANGE_FEATURES.has(right)) [name, value, direction] = [right, left, Object.hasOwn(REVERSED, operator) ? REVERSED[operator] : undefined]
    else return false
    if (direction === undefined || !Object.hasOwn(REVERSED, direction)) return false
    const dimension = rangeDimension(value)
    if (!dimension) return false
    addConditionFeature(features, `${name}:${dimension[1]}`, direction, dimension[0])
  }
  return true
}

const sortFeatures = (features: ConditionFeature[]) => features.sort((left, right) =>
  naturalCompare(left.domain, right.domain) || naturalCompare(left.feature, right.feature) || naturalCompare(left.unit, right.unit))

/** Numeric ranges of a conjunction of simple range features with identical units; empty otherwise. */
export function nativeQueryFeatures(query: string): ConditionFeature[] {
  let domain: string
  let body: string
  if (query.startsWith('@media ')) {
    domain = 'media'
    body = trim(query.slice(7))
  } else if (query.startsWith('@container ')) {
    body = trim(query.slice(11))
    if (body[0] === '(') {
      domain = 'container:'
    } else {
      let space = 0
      while (space < body.length && !isWhitespace(body.charCodeAt(space))) space++
      if (space === body.length) return []
      const name = body.slice(0, space)
      for (let index = 0; index < name.length; index++) if (!isNameCodePoint(name.charCodeAt(index))) return []
      domain = `container:${name}`
      body = trim(body.slice(space + 1))
    }
  } else {
    return []
  }
  const features: ConditionFeature[] = []
  for (const part of body.split(' and ')) {
    const trimmed = trim(part)
    if (trimmed[0] !== '(' || !trimmed.endsWith(')')) return []
    const inner = trimmed.slice(1, -1)
    if (/[()'"]/.test(inner) || !addRangeFeatures(features, trim(inner))) return []
  }
  for (const feature of features) feature.domain = domain
  return sortFeatures(features)
}

function mergeConditionFeatures(target: ConditionFeature[], source: ConditionFeature[]) {
  for (const feature of source) {
    const existing = target.find((item) => item.domain === 'media' && item.domain === feature.domain && item.feature === feature.feature && item.unit === feature.unit)
    if (existing) intersectRange(existing, feature)
    else target.push(feature)
  }
  sortFeatures(target)
}

/**
 * Ordering evidence of condition wrappers. Only a wholly numeric media conjunction
 * intersects across wrappers; container ancestry and other conditions keep their order.
 */
export function conditionPriority(wrappers: [kind: string, wrapper: string][]): [features: ConditionFeature[], conditions: string[]] {
  const parsed = wrappers.map(([, wrapper]) => nativeQueryFeatures(wrapper))
  const mediaConjunction = wrappers.every(([kind], index) => kind === 'media' && parsed[index].length)
  const features: ConditionFeature[] = []
  const conditions: string[] = []
  for (const [index, [, wrapper]] of wrappers.entries()) {
    const ranges = parsed[index]
    if (!ranges.length) {
      conditions.push(`${index}:${trim(wrapper)}`)
    } else if (mediaConjunction) {
      mergeConditionFeatures(features, ranges)
    } else {
      for (const range of ranges) {
        range.domain = `${index}:${range.domain}`
        features.push(range)
      }
    }
  }
  return [features, conditions]
}

/** Unwinds the media query parser; never leaves it. */
const MEDIA_ERROR = new Error('Invalid media query')
const MAX_MEDIA_DEPTH = 128

/** Parses a media query that references custom media, resolving `(--name)` through `resolve`. */
export function parseCustomMediaQuery(source: string, resolve: (name: string) => MediaQuery | undefined): MediaQuery | undefined {
  const tokens = tokenize(source)
  if (tokens.length === 1 && tokens[0].kind === IDENT) {
    if (isAsciiCase(tokens[0].value, 'true')) return { type: 'true' }
    if (isAsciiCase(tokens[0].value, 'false')) return { type: 'false' }
  }
  let depth = 0
  for (const token of tokens) {
    if (token.close >= 0 && ++depth > MAX_MEDIA_DEPTH) return
    if (token.kind === DELIM && (token.value === ')' || token.value === ']' || token.value === '}') && depth) depth--
  }
  const fail = (): never => {
    throw MEDIA_ERROR
  }
  const ident = (index: number, name: string) => tokens[index]?.kind === IDENT && isAsciiCase(tokens[index].value, name)
  const top = (start: number, end: number) => {
    const result: number[] = []
    for (let index = start; index < end;) {
      result.push(index)
      const token = tokens[index]
      if (token.kind === FUNCTION || isDelim(token, '(') || isDelim(token, '[') || isDelim(token, '{')) {
        if (token.close < 0 || token.close >= end) fail()
        index = token.close + 1
      } else {
        index++
      }
    }
    return result
  }
  const list = (start: number, end: number): MediaQuery => {
    const queries: MediaQuery[] = []
    let cursor = start
    for (const index of top(start, end)) {
      if (isDelim(tokens[index], ',')) {
        queries.push(query(cursor, index))
        cursor = index + 1
      }
    }
    queries.push(query(cursor, end))
    return queries.length === 1 ? queries[0] : { type: 'or', queries }
  }
  const query = (start: number, end: number): MediaQuery => {
    if (start >= end) fail()
    const items = top(start, end)
    const qualifier = ident(start, 'not') || ident(start, 'only')
    const typeIndex = start + (qualifier ? 1 : 0)
    const typeToken = tokens[typeIndex]
    if (typeToken?.kind === IDENT) {
      const name = typeToken.value
      if (isKeyword(name) || name.startsWith('--')) fail()
      let result: MediaQuery = isAsciiCase(name, 'all') ? { type: 'true' } : { type: 'media-type', name: asciiLowercase(name) }
      if (typeIndex + 1 < end) {
        if (!ident(typeIndex + 1, 'and')) fail()
        const inner = condition(typeIndex + 2, end)
        if (top(typeIndex + 2, end).some((index) => ident(index, 'or'))) fail()
        result = { type: 'and', queries: [result, inner] }
      }
      return ident(start, 'not') ? { type: 'not', query: result } : result
    }
    if (qualifier && ident(start, 'only')) fail()
    if (!items.length) fail()
    return condition(start, end)
  }
  const condition = (start: number, end: number): MediaQuery => {
    const items = top(start, end)
    if (!items.length) fail()
    if (ident(start, 'not')) {
      if (items.length !== 2) fail()
      return { type: 'not', query: atom(items[1], end) }
    }
    const queries: MediaQuery[] = []
    let operator: boolean | undefined
    for (const [position, index] of items.entries()) {
      if (position % 2 === 0) {
        queries.push(atom(index, items[position + 1] ?? end))
        continue
      }
      const or = ident(index, 'or') ? true : ident(index, 'and') ? false : fail()
      if (operator !== undefined && operator !== or) fail()
      operator = or
    }
    if (items.length % 2 === 0) fail()
    return operator === undefined ? queries[0] : { type: operator ? 'or' : 'and', queries }
  }
  const atom = (start: number, end: number): MediaQuery => {
    const token = tokens[start]
    if (token.close < 0 || token.close + 1 !== end) fail()
    const close = token.close
    if (isDelim(token, '(')) {
      const inner = top(start + 1, close)
      if (inner.length === 1 && tokens[inner[0]].kind === IDENT && tokens[inner[0]].value.startsWith('--')) {
        return resolve(tokens[inner[0]].value) ?? fail()
      }
      const first = tokens[inner[0]]
      if (first && (isDelim(first, '(') || first.kind === FUNCTION || ident(inner[0], 'not'))) return condition(start + 1, close)
      if (inner.some((index) => tokens[index].kind === IDENT && tokens[index].value.startsWith('--'))) fail()
      if (!inner.length) fail()
    } else if (token.kind !== FUNCTION) {
      fail()
    }
    return { type: 'feature', value: source.slice(token.start, tokens[close].end) }
  }
  try {
    return list(0, tokens.length)
  } catch (error) {
    if (error === MEDIA_ERROR) return
    throw error
  }
}
