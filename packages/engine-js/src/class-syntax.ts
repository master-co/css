// Master class structure: native content, value and state boundaries, and functional
// class heads, as crates/mastercss-lexer and the engine's utility.rs and state.rs read
// them. Every scan skips escapes, quotes and nested brackets.
import { DELIM, FUNCTION, tokenize } from './css-syntax'
import { isAsciiDigit, trim } from './text'

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

/** Whether a matched name may end here: the rest is empty or starts a state. */
export function isMatchStateBoundary(rest: string) {
  return !rest.length || '!*>+~:[@_.'.includes(rest[0])
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
