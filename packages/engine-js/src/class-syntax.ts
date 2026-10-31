// Master class structure: native content, value and state boundaries, and functional
// class heads, as crates/mastercss-lexer and the engine's utility.rs and state.rs read
// them. Every scan skips escapes, quotes and nested brackets.
import { DELIM, FUNCTION, readName, startsIdentifier, tokenize } from './css-syntax'
import { isAsciiCase, isAsciiDigit, isAsciiWhitespace, isWhitespace, trim } from './text'

const isOpen = (unit: number) => unit === 0x28 || unit === 0x5b || unit === 0x7b
const isClose = (unit: number) => unit === 0x29 || unit === 0x5d || unit === 0x7d
export const isQuote = (unit: number) => unit === 0x22 || unit === 0x27

/**
 * Balanced native content outside strings, escapes and comments, or undefined. With
 * `decode`, Master's `|` separators become spaces.
 */
function content(source: string, decode: boolean) {
  let result = ''
  let copied = 0
  const stack: number[] = []
  let quote = 0
  let escaped = false
  let comment = false
  for (let index = 0; index < source.length; index++) {
    const unit = source.charCodeAt(index)
    if (comment) {
      if (unit === 0x2a && source.charCodeAt(index + 1) === 0x2f) {
        index++
        comment = false
      }
    } else if (escaped) {
      escaped = false
    } else if (unit === 0x5c) {
      escaped = true
    } else if (quote) {
      if (unit === quote) quote = 0
    } else if (unit === 0x2f && source.charCodeAt(index + 1) === 0x2a) {
      index++
      comment = true
    } else if (isQuote(unit)) {
      quote = unit
    } else if (unit === 0x28 || unit === 0x5b) {
      stack.push(unit)
    } else if (unit === 0x29) {
      if (stack.pop() !== 0x28) return
    } else if (unit === 0x5d) {
      if (stack.pop() !== 0x5b) return
    } else if ((unit === 0x7b || unit === 0x7d || unit === 0x3b) && !stack.length) {
      return
    } else if (decode && unit === 0x7c) {
      result += `${source.slice(copied, index)} `
      copied = index + 1
    }
  }
  return !stack.length && !quote && !escaped && !comment ? result + source.slice(copied) : undefined
}

export const nativeContent = (source: string) => content(source, false)
export const decodeNativeContent = (source: string) => content(source, true)

/** The characters that may begin a class suffix after a complete head. */
export const isClassSuffixStart = (character: string) => '!*>+~:[@_.'.includes(character)

/** Whether a matched name may end here: the rest is empty or starts a state. */
export function isMatchStateBoundary(rest: string) {
  return !rest.length || isClassSuffixStart(rest[0])
}

/** A `(property:value)` head, as `parse_native_declaration` in crates/mastercss-lexer/src/class_head.rs reads it. */
export interface NativeDeclarationHead {
  property: [start: number, end: number]
  /** The authored value, without a trailing native `!important`. */
  value: [start: number, end: number]
  important: boolean
  suffixStart: number
}

/** The property range of a `(property:` prefix and the value start once its colon exists. */
function nativeDeclarationPrefix(source: string): [property: [number, number], valueStart: number | undefined] | undefined {
  if (source.charCodeAt(0) !== 0x28 || !startsIdentifier(source, 1)) return
  const [end, property] = readName(source, 1)
  if (property === '--') return
  return [[1, end], source.charCodeAt(end) === 0x3a ? end + 1 : undefined]
}

/** The end of the string whose quote is at `start`, or undefined when it is unclosed or broken by a newline. */
function skipString(source: string, start: number) {
  const quote = source.charCodeAt(start)
  for (let cursor = start + 1; cursor < source.length; cursor++) {
    const unit = source.charCodeAt(cursor)
    if (unit === 0x5c) {
      cursor++
      if (cursor >= source.length) return
    } else if (unit === 0x0a || unit === 0x0d || unit === 0x0c) {
      return
    } else if (unit === quote) {
      return cursor + 1
    }
  }
}

/** Rust `char::is_control`: the C0 and C1 controls. */
const isControl = (unit: number) => unit <= 0x1f || (unit >= 0x7f && unit <= 0x9f)

/** The end of an unquoted `url(` token whose contents start at `start`; brackets, braces and pipes are URL text. */
function skipUrl(source: string, start: number) {
  for (let cursor = start; cursor < source.length; cursor++) {
    const unit = source.charCodeAt(cursor)
    if (unit === 0x29) return cursor + 1
    if (unit === 0x5c && startsIdentifier(source, cursor)) {
      cursor++
    } else if (isQuote(unit) || unit === 0x28 || unit === 0x5c || isWhitespace(unit) || isControl(unit)) {
      return
    }
  }
}

const OTHER_ITEM = -1
const IMPORTANT_ITEM = -2

/** The closing parenthesis and top-level items of a declaration value; bangs are their offsets. */
function scanValue(source: string, start: number, custom: boolean): [close: number, items: number[]] | undefined {
  const stack: number[] = []
  const items: number[] = []
  let cursor = start
  while (cursor < source.length) {
    const unit = source.charCodeAt(cursor)
    const top = !stack.length
    if (isQuote(unit)) {
      const end = skipString(source, cursor)
      if (end === undefined) return
      cursor = end
      if (top) items.push(OTHER_ITEM)
      continue
    }
    if (unit === 0x2f && source.charCodeAt(cursor + 1) === 0x2a) {
      const end = source.indexOf('*/', cursor + 2)
      if (end < 0) return
      cursor = end + 2
      continue
    }
    if (startsIdentifier(source, cursor)) {
      const [end, ident] = readName(source, cursor)
      cursor = end
      if (source.charCodeAt(cursor) === 0x28) {
        cursor++
        if (isAsciiCase(ident, 'url') && !isQuote(source.charCodeAt(cursor))) {
          const url = skipUrl(source, cursor)
          if (url === undefined) return
          cursor = url
        } else {
          stack.push(0x29)
        }
        if (top) items.push(OTHER_ITEM)
      } else if (top) {
        items.push(isAsciiCase(ident, 'important') ? IMPORTANT_ITEM : OTHER_ITEM)
      }
      continue
    }
    if (unit === 0x5c) return
    if (unit === 0x28) stack.push(0x29)
    else if (unit === 0x5b) stack.push(0x5d)
    else if (unit === 0x7b) {
      if (top && !custom) return
      stack.push(0x7d)
    } else if (unit === 0x29 && top) return [cursor, items]
    else if (unit === 0x29 || unit === 0x5d || unit === 0x7d) {
      if (stack.pop() !== unit) return
    } else if (unit === 0x3b && top) return
    else if (unit === 0x21 && top) items.push(cursor)
    else if (unit !== 0x7c && !isAsciiWhitespace(unit) && top) items.push(OTHER_ITEM)
    cursor++
  }
}

/**
 * Parses a class that starts with `(` as exactly one native declaration: undefined for
 * other classes, null for a malformed declaration, which never becomes another head.
 */
export function parseNativeDeclaration(source: string): NativeDeclarationHead | null | undefined {
  if (source.charCodeAt(0) !== 0x28) return
  const prefix = nativeDeclarationPrefix(source)
  if (!prefix || prefix[1] === undefined) return null
  const [property, start] = prefix
  const custom = source.startsWith('--', 1)
  const scan = scanValue(source, start, custom)
  if (!scan) return null
  const [close, items] = scan
  const bang = items.length >= 2 && items[items.length - 1] === IMPORTANT_ITEM ? items[items.length - 2] : -1
  const important = bang >= 0
  let valueEnd = important ? bang : close
  while (important && valueEnd > start && (source.charCodeAt(valueEnd - 1) === 0x7c || isAsciiWhitespace(source.charCodeAt(valueEnd - 1)))) valueEnd--
  if (!custom && items.length === (important ? 2 : 0)) return null
  const suffixStart = close + 1
  if (suffixStart < source.length && !isClassSuffixStart(source[suffixStart])) return null
  return { property, value: [start, valueEnd], important, suffixStart }
}

/** Decodes Master's `|` value spaces outside strings, comments, escapes and URL tokens. */
export function decodeNativeValue(value: string) {
  let output = ''
  let cursor = 0
  while (cursor < value.length) {
    const start = cursor
    const unit = value.charCodeAt(cursor)
    if (isQuote(unit)) {
      cursor = skipString(value, cursor) ?? value.length
    } else if (unit === 0x2f && value.charCodeAt(cursor + 1) === 0x2a) {
      const end = value.indexOf('*/', cursor + 2)
      cursor = end < 0 ? value.length : end + 2
    } else if (startsIdentifier(value, cursor)) {
      const [end, ident] = readName(value, cursor)
      cursor = end
      if (isAsciiCase(ident, 'url') && value.charCodeAt(cursor) === 0x28 && !isQuote(value.charCodeAt(cursor + 1))) {
        cursor = skipUrl(value, cursor + 1) ?? value.length
      }
    } else if (unit === 0x7c) {
      output += ' '
      cursor++
      continue
    } else {
      cursor++
    }
    output += value.slice(start, cursor)
  }
  return output
}

/** Whether a class has a complete head and a structurally balanced suffix. */
export function validClassStructure(className: string) {
  const source = className.endsWith('!') ? className.slice(0, -1) : className
  const head = parseNativeDeclaration(source)
  if (head === null) return false
  return decodeNativeContent(head ? source.slice(head.suffixStart) : className) !== undefined
}

/** Splits a dynamic value from the state that follows it at the first top-level state character. */
export function splitDynamicValueState(value: string): [value: string, state: string] {
  let quote = 0
  let escaped = false
  let depth = 0
  for (let index = 0; index < value.length; index++) {
    const unit = value.charCodeAt(index)
    if (escaped) {
      escaped = false
      continue
    }
    if (unit === 0x5c) {
      escaped = true
      continue
    }
    if (quote) {
      if (unit === quote) quote = 0
      continue
    }
    if (isQuote(unit)) {
      quote = unit
      continue
    }
    if (unit === 0x5b && !depth) return [value.slice(0, index), value.slice(index)]
    if (isOpen(unit)) {
      depth++
      continue
    }
    if (isClose(unit)) {
      if (depth) depth--
      continue
    }
    if (depth) continue
    let startsState: boolean
    if (unit === 0x2e) {
      startsState = !isAsciiDigit(value.charCodeAt(index + 1))
    } else if (unit === 0x23) {
      const previous = value.charCodeAt(index - 1)
      startsState = index > 0 && previous !== 0x7c && previous !== 0x20
    } else {
      startsState = '!*>+~:@_'.includes(value[index])
    }
    if (startsState) return [value.slice(0, index), value.slice(index)]
  }
  return [value, '']
}

export function hasTopLevelValueSeparator(value: string) {
  let quote = 0
  let escaped = false
  let depth = 0
  for (let index = 0; index < value.length; index++) {
    const unit = value.charCodeAt(index)
    if (escaped) {
      escaped = false
    } else if (unit === 0x5c) {
      escaped = true
    } else if (quote) {
      if (unit === quote) quote = 0
    } else if (isQuote(unit)) {
      quote = unit
    } else if (isOpen(unit)) {
      depth++
    } else if (isClose(unit)) {
      if (depth) depth--
    } else if (unit === 0x7c && !depth) {
      return true
    }
  }
  return false
}

/** Splits `source` at each top-level `delimiter`. */
export function splitTopLevel(source: string, delimiter: string) {
  const result: string[] = []
  const separator = delimiter.charCodeAt(0)
  let start = 0
  let depth = 0
  let quote = 0
  let escaped = false
  for (let index = 0; index < source.length; index++) {
    const unit = source.charCodeAt(index)
    if (escaped) {
      escaped = false
    } else if (unit === 0x5c) {
      escaped = true
    } else if (quote) {
      if (unit === quote) quote = 0
    } else if (isQuote(unit)) {
      quote = unit
    } else if (isOpen(unit)) {
      depth++
    } else if (isClose(unit)) {
      if (depth) depth--
    } else if (unit === separator && !depth) {
      result.push(source.slice(start, index))
      start = index + 1
    }
  }
  result.push(source.slice(start))
  return result
}

/** Splits a state token into its selector and the conditions after each top-level `@`. */
export function splitStateToken(stateToken: string): [selector: string, conditions: string[]] {
  const parts = splitTopLevel(stateToken, '@')
  return [parts[0], parts.slice(1).filter((condition, index) => condition || index < parts.length - 2)]
}

export interface FunctionalClassHead {
  name: string
  arguments: string[]
  suffix: string
}

/** A functional class head, `name(arguments)` before its suffix; undefined when the class does not start with a function. */
export function parseFunctionalClass(source: string): FunctionalClassHead | string | undefined {
  const tokens = tokenize(source)
  const first = tokens[0]
  if (first?.kind !== FUNCTION) return
  if (first.close < 0) return 'Unclosed mixin argument list'
  const close = first.close
  const suffixStart = tokens[close].end
  const suffix = source.slice(suffixStart)
  if (suffix && !'!*>+~:[@_.'.includes(suffix[0])) return 'Invalid suffix after mixin arguments'
  const argumentsStart = first.end
  const argumentsEnd = tokens[close].start
  const ranges: [number, number][] = []
  if (trim(source.slice(argumentsStart, argumentsEnd))) {
    let start = argumentsStart
    for (let index = 1; index < close; index++) {
      const token = tokens[index]
      if (token.kind === DELIM && token.value === ',') {
        ranges.push([start, token.start])
        start = token.end
      } else if (token.close >= 0) {
        index = token.close
      }
    }
    ranges.push([start, argumentsEnd])
    if (ranges.some(([start, end]) => !trim(source.slice(start, end)))) return 'Empty mixin argument'
  }
  return { name: first.value, arguments: ranges.map(([start, end]) => source.slice(start, end)), suffix }
}
