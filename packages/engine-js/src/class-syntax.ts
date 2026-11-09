// Master class structure: native content, value and state boundaries, and functional
// class heads, as crates/mastercss-lexer and the engine's utility.rs and state.rs read
// them. Every scan skips escapes, quotes and nested brackets.
import { DELIM, FUNCTION, isHex, isNameCodePoint, readName, startsIdentifier, tokenize } from './css-syntax'
import { isAsciiCase, isAsciiDigit, isAsciiWhitespace, trim } from './text'

/** The deepest bracket nesting a class may carry, as `MAX_CLASS_NESTING` in crates/mastercss-lexer. */
const MAX_CLASS_NESTING = 64

const isOpen = (unit: number) => unit === 0x28 || unit === 0x5b || unit === 0x7b
const isClose = (unit: number) => unit === 0x29 || unit === 0x5d || unit === 0x7d
export const isQuote = (unit: number) => unit === 0x22 || unit === 0x27

/** Balanced native content outside strings, escapes and comments, or undefined. */
export function nativeContent(source: string) {
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
      if (stack.push(unit) > MAX_CLASS_NESTING) return
    } else if (unit === 0x29) {
      if (stack.pop() !== 0x28) return
    } else if (unit === 0x5d) {
      if (stack.pop() !== 0x5b) return
    } else if ((unit === 0x7b || unit === 0x7d || unit === 0x3b) && !stack.length) {
      return
    }
  }
  return !stack.length && !quote && !escaped && !comment ? source : undefined
}

/** Balanced native content with Master's `_` (and deprecated `|`) spaces decoded; every `--name` keeps its underscores. */
export function decodeNativeContent(source: string) {
  const content = nativeContent(source)
  return content === undefined ? undefined : decodeSpaces(content, true)
}

/** The characters that may begin a class suffix after a complete head. */
export const isClassSuffixStart = (character: string) => '!*>+~:[@_.#'.includes(character)

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

/** The property range of a `(property:` prefix, the value start once its colon exists and whether the decoded property is custom. */
function nativeDeclarationPrefix(source: string): [property: [number, number], valueStart: number | undefined, custom: boolean] | undefined {
  if (source.charCodeAt(0) !== 0x28 || !startsIdentifier(source, 1)) return
  const [end, property] = readName(source, 1)
  if (property === '--') return
  return [[1, end], source.charCodeAt(end) === 0x3a ? end + 1 : undefined, property.startsWith('--')]
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


/**
 * The end of an unquoted `url(` token whose contents start at `start`; brackets, braces
 * and pipes are URL text. Only CSS whitespace before `)` and non-printable code points
 * end it badly; other Unicode, including U+00A0 and U+0085, is URL text.
 */
function skipUrl(source: string, start: number) {
  for (let cursor = start; cursor < source.length; cursor++) {
    const unit = source.charCodeAt(cursor)
    if (unit === 0x29) return cursor + 1
    if (unit === 0x5c && startsIdentifier(source, cursor)) {
      cursor++
    } else if (isAsciiWhitespace(unit)) {
      while (cursor < source.length && isAsciiWhitespace(source.charCodeAt(cursor))) cursor++
      return source.charCodeAt(cursor) === 0x29 ? cursor + 1 : undefined
    } else if (isQuote(unit) || unit === 0x28 || unit === 0x5c || unit < 0x20 || unit === 0x7f) {
      // Below 0x20, only non-printable code points remain: they end a URL token badly.
      return
    }
  }
}

const OTHER_ITEM = -1
const IMPORTANT_ITEM = -2

/**
 * The closing parenthesis and top-level items of a declaration value. A bang is the end
 * of the last component before it, so a trailing `!important` never trims into an escape.
 */
function scanValue(source: string, start: number, custom: boolean): [close: number, items: number[]] | undefined {
  const stack: number[] = []
  const items: number[] = []
  let componentEnd = start
  let cursor = start
  while (cursor < source.length) {
    const unit = source.charCodeAt(cursor)
    const top = !stack.length
    if (isQuote(unit)) {
      const end = skipString(source, cursor)
      if (end === undefined) return
      cursor = componentEnd = end
      if (top) items.push(OTHER_ITEM)
      continue
    }
    if (unit === 0x2f && source.charCodeAt(cursor + 1) === 0x2a) {
      const end = source.indexOf('*/', cursor + 2)
      if (end < 0) return
      cursor = componentEnd = end + 2
      continue
    }
    if (startsIdentifier(source, cursor)) {
      const identStart = cursor
      const [end, ident] = readName(source, cursor)
      cursor = end
      // A lone `_` is an encoded space, like `|` and whitespace.
      if (end - identStart === 1 && source.charCodeAt(identStart) === 0x5f) continue
      if (source.charCodeAt(cursor) === 0x28) {
        cursor++
        if (isAsciiCase(ident, 'url') && !isQuote(source.charCodeAt(cursor))) {
          const url = skipUrl(source, cursor)
          if (url === undefined) return
          cursor = url
        } else if (stack.push(0x29) > MAX_CLASS_NESTING) {
          return
        }
        if (top) items.push(OTHER_ITEM)
      } else if (top) {
        // `red_!_important` spells the spaces around `!` as `_`.
        const word = isSpaceUnderscore(source, identStart) ? ident.slice(1) : ident
        items.push(isAsciiCase(word, 'important') ? IMPORTANT_ITEM : OTHER_ITEM)
      }
      // An encoded space never ends a component: `red_!important` is `red`.
      componentEnd = isSpaceUnderscore(source, cursor - 1) ? cursor - 1 : cursor
      continue
    }
    if (unit === 0x7c || isAsciiWhitespace(unit)) {
      cursor++
      continue
    }
    if (unit === 0x5c) return
    // A block is a component of its own: `a!important{}` is not important.
    if (isOpen(unit)) {
      if (unit === 0x7b && top && !custom) return
      if (stack.push(unit === 0x28 ? 0x29 : unit === 0x5b ? 0x5d : 0x7d) > MAX_CLASS_NESTING) return
      if (top) items.push(OTHER_ITEM)
    } else if (unit === 0x29 && top) return [cursor, items]
    else if (isClose(unit)) {
      if (stack.pop() !== unit) return
    } else if (unit === 0x3b && top) return
    else if (unit === 0x21 && top) items.push(componentEnd)
    else if (top) items.push(OTHER_ITEM)
    cursor++
    componentEnd = cursor
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
  const [property, start, custom] = prefix
  const scan = scanValue(source, start, custom)
  if (!scan) return null
  const [close, items] = scan
  const bang = items.length >= 2 && items[items.length - 1] === IMPORTANT_ITEM ? items[items.length - 2] : -1
  const important = bang >= 0
  const valueEnd = important ? Math.max(bang, start) : close
  if (!custom && items.length === (important ? 2 : 0)) return null
  const suffixStart = close + 1
  if (suffixStart < source.length && !isClassSuffixStart(source[suffixStart])) return null
  return { property, value: [start, valueEnd], important, suffixStart }
}

// Master value spaces, as crates/mastercss-lexer/src/spaces.rs decodes them: `_`, and the
// deprecated `|`, outside strings, comments, escapes, unquoted URL tokens and protected
// `--name`s; an underscore next to another underscore is literal.

/** Whether the underscore at `index` encodes a space by position alone: unescaped, with no underscore beside it. */
export function isSpaceUnderscore(source: string, index: number) {
  if (source.charCodeAt(index) !== 0x5f || source.charCodeAt(index - 1) === 0x5f || source.charCodeAt(index + 1) === 0x5f) return false
  let slashes = 0
  for (let cursor = index - 1; cursor >= 0 && source.charCodeAt(cursor) === 0x5c; cursor--) slashes++
  return slashes % 2 === 0
}

/**
 * Decodes `_` and `|` spaces outside protected text. The `--name` that opens a `var()`
 * keeps its underscores; `allDashed` extends that to every `--name`, for queries and
 * `@apply` calls.
 */
export function decodeSpaces(source: string, allDashed: boolean) {
  let output = ''
  let cursor = 0
  // 0 outside a name run, 1 in a run whose underscores are spaces, 2 in a literal run.
  let run = 0
  let variable = false
  while (cursor < source.length) {
    const start = cursor
    const unit = source.charCodeAt(cursor)
    if (isQuote(unit)) {
      cursor = skipString(source, cursor) ?? source.length
      run = 0
    } else if (unit === 0x2f && source.charCodeAt(cursor + 1) === 0x2a) {
      const end = source.indexOf('*/', cursor + 2)
      cursor = end < 0 ? source.length : end + 2
      run = 0
    } else if (unit === 0x7c || (unit === 0x5f && run !== 2 && isSpaceUnderscore(source, cursor))) {
      output += ' '
      cursor++
      run = 0
      variable = false
      continue
    } else if (!run && startsIdentifier(source, cursor)) {
      const [end, ident] = readName(source, cursor)
      const call = source.charCodeAt(end) === 0x28
      if (call && isAsciiCase(ident, 'url') && !isQuote(source.charCodeAt(end + 1))) {
        cursor = skipUrl(source, end + 1) ?? source.length
        variable = false
        output += source.slice(start, cursor)
        continue
      }
      if (call && isAsciiCase(ident, 'var')) {
        cursor = end + 1
        variable = true
        output += source.slice(start, cursor)
        continue
      }
      run = ident.startsWith('--') && (allDashed || variable) ? 2 : 1
      cursor = escapeOrCharacterEnd(source, cursor)
    } else if (unit === 0x5c || isNameCodePoint(unit)) {
      if (!run) run = 1
      cursor = escapeOrCharacterEnd(source, cursor)
    } else {
      cursor++
      run = 0
    }
    variable = false
    output += source.slice(start, cursor)
  }
  return output
}

/** The end of the escape or code point at `cursor`. */
function escapeOrCharacterEnd(source: string, cursor: number) {
  if (source.charCodeAt(cursor) !== 0x5c) return cursor + 1
  let end = cursor + 1
  if (end >= source.length) return end
  if (!isHex(source.charCodeAt(end))) return end + (source.codePointAt(end)! > 0xffff ? 2 : 1)
  const digits = end
  while (end - digits < 6 && isHex(source.charCodeAt(end))) end++
  const next = source.charCodeAt(end)
  if (next === 0x0d && source.charCodeAt(end + 1) === 0x0a) end += 2
  else if (next === 0x20 || next === 0x09 || next === 0x0a || next === 0x0c || next === 0x0d) end++
  return end
}

/** Decodes Master's `_` (and deprecated `|`) value spaces outside strings, comments, escapes, URL tokens and the `--name` that opens a `var()`. */
export const decodeNativeValue = (value: string) => decodeSpaces(value, false)

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
  if (suffix && !isClassSuffixStart(suffix[0])) return 'Invalid suffix after mixin arguments'
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
