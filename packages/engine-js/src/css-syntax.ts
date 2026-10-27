// CSS component tokens with decoded names, source ranges and matched block ends, as
// `tokenize_css_syntax` in crates/mastercss-lexer/src/css_syntax.rs produces them.
// Ranges are UTF-16 offsets where Rust has UTF-8 ones; both fall on the same characters.
import { isAsciiDigit } from './text'

export const IDENT = 0
export const STRING = 1
export const AT_KEYWORD = 2
export const FUNCTION = 3
export const NUMBER = 4
export const DIMENSION = 5
export const PERCENTAGE = 6
export const OTHER = 7
export const DELIM = 8

export interface Token {
  kind: number
  /** The decoded name or string, the number text, or the delimiter character. */
  value: string
  /** The decoded unit of a dimension. */
  unit: string
  start: number
  end: number
  /** The index of the token closing this block, or -1. */
  close: number
}

export interface Statement {
  start: number
  end: number
  parent: number
  hasBlock: boolean
  declaration: boolean
}

const isNewline = (unit: number) => unit === 0x0a || unit === 0x0d || unit === 0x0c
const isHex = (unit: number) => isAsciiDigit(unit) || (unit >= 0x61 && unit <= 0x66) || (unit >= 0x41 && unit <= 0x46)
const isLetter = (unit: number) => (unit >= 0x61 && unit <= 0x7a) || (unit >= 0x41 && unit <= 0x5a)
const isNameStart = (unit: number) => isLetter(unit) || unit === 0x5f || unit >= 0x80
export const isCssWhitespace = (unit: number) => unit === 0x20 || unit === 0x09 || unit === 0x0a || unit === 0x0d || unit === 0x0c

/** A CSS name code point: an ASCII letter or digit, `-`, `_` or any non-ASCII code point. */
export const isNameCodePoint = (unit: number) => isNameStart(unit) || isAsciiDigit(unit) || unit === 0x2d

export function startsIdentifier(source: string, index: number) {
  if (index >= source.length) return false
  const validEscape = (at: number) => at < source.length && !isNewline(source.charCodeAt(at))
  const first = source.charCodeAt(index)
  if (first === 0x2d) {
    if (index + 1 >= source.length) return false
    const next = source.charCodeAt(index + 1)
    return next === 0x5c ? validEscape(index + 2) : isNameStart(next) || next === 0x2d
  }
  return first === 0x5c ? validEscape(index + 1) : isNameStart(first)
}

/** The end of a signed CSS number with an optional fraction and exponent at `index`, or -1. */
export function numberEnd(source: string, index: number) {
  let cursor = index
  const sign = source.charCodeAt(cursor)
  if (sign === 0x2b || sign === 0x2d) cursor++
  const start = cursor
  while (isAsciiDigit(source.charCodeAt(cursor))) cursor++
  if (source.charCodeAt(cursor) === 0x2e && isAsciiDigit(source.charCodeAt(cursor + 1))) {
    cursor += 2
    while (isAsciiDigit(source.charCodeAt(cursor))) cursor++
  } else if (cursor === start) {
    return -1
  }
  const exponent = source.charCodeAt(cursor)
  if (exponent === 0x65 || exponent === 0x45) {
    let digits = cursor + 1
    const exponentSign = source.charCodeAt(digits)
    if (exponentSign === 0x2b || exponentSign === 0x2d) digits++
    if (isAsciiDigit(source.charCodeAt(digits))) {
      cursor = digits + 1
      while (isAsciiDigit(source.charCodeAt(cursor))) cursor++
    }
  }
  return cursor
}

let text = ''
let at = 0

/** Consumes the escape whose backslash is at `at`. An escaped newline and the end of input decode to nothing. */
function escape() {
  at++
  if (at >= text.length) return ''
  const first = text.charCodeAt(at)
  if (isNewline(first)) {
    at++
    if (first === 0x0d && text.charCodeAt(at) === 0x0a) at++
    return ''
  }
  if (isHex(first)) {
    const start = at
    while (at - start < 6 && isHex(text.charCodeAt(at))) at++
    const value = parseInt(text.slice(start, at), 16)
    const whitespace = text.charCodeAt(at)
    if (isCssWhitespace(whitespace)) {
      at++
      if (whitespace === 0x0d && text.charCodeAt(at) === 0x0a) at++
    }
    return value === 0 || value > 0x10ffff || (value >= 0xd800 && value <= 0xdfff) ? '\ufffd' : String.fromCodePoint(value)
  }
  const character = String.fromCodePoint(text.codePointAt(at)!)
  at += character.length
  return character
}

function name() {
  const start = at
  let decoded: string | undefined
  while (at < text.length) {
    const unit = text.charCodeAt(at)
    if (unit === 0x5c && at + 1 < text.length && !isNewline(text.charCodeAt(at + 1))) {
      decoded ??= text.slice(start, at)
      decoded += escape()
    } else if (isNameCodePoint(unit)) {
      at++
      if (decoded !== undefined) decoded += text[at - 1]
    } else {
      break
    }
  }
  return decoded ?? text.slice(start, at)
}

/** The colon offset and decoded name of a leading `name:`, read as the first two tokens would be. */
export function leadingDeclarationName(source: string): [colon: number, name: string] | undefined {
  if (numberEnd(source, 0) >= 0 || !startsIdentifier(source, 0)) return
  text = source
  at = 0
  const value = name()
  return at > 0 && source.charCodeAt(at) === 0x3a && value !== '--' ? [at, value] : undefined
}

function skipComment(source: string, index: number) {
  const end = source.indexOf('*/', index + 2)
  return end < 0 ? source.length : end + 2
}

/** The name of the leading function token, without tokenizing the rest. */
export function leadingFunctionName(source: string) {
  let index = 0
  while (index < source.length) {
    const unit = source.charCodeAt(index)
    if (isCssWhitespace(unit)) index++
    else if (unit === 0x2f && source.charCodeAt(index + 1) === 0x2a) index = skipComment(source, index)
    else break
  }
  const unit = source.charCodeAt(index)
  if (unit === 0x22 || unit === 0x27 || numberEnd(source, index) >= 0 || (unit === 0x40 && startsIdentifier(source, index + 1))) return
  if (!startsIdentifier(source, index)) return
  text = source
  at = index
  const value = name()
  return at > index && source.charCodeAt(at) === 0x28 ? value : undefined
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  const opens: number[] = []
  text = source
  at = 0
  while (at < source.length) {
    const start = at
    const unit = source.charCodeAt(at)
    if (isCssWhitespace(unit)) {
      at++
      continue
    }
    if (unit === 0x2f && source.charCodeAt(at + 1) === 0x2a) {
      at = skipComment(source, at)
      continue
    }
    let kind: number
    let value = ''
    let dimension = ''
    let end: number
    if (unit === 0x22 || unit === 0x27) {
      at++
      const contentStart = at
      let decoded: string | undefined
      let valid = true
      while (at < source.length) {
        const next = source.charCodeAt(at)
        if (next === unit) break
        if (isNewline(next)) {
          valid = false
          break
        }
        if (next === 0x5c) {
          decoded ??= source.slice(contentStart, at)
          decoded += escape()
        } else {
          at++
          if (decoded !== undefined) decoded += source[at - 1]
        }
      }
      value = decoded ?? source.slice(contentStart, at)
      if (source.charCodeAt(at) === unit) at++
      kind = valid ? STRING : OTHER
    } else if ((end = numberEnd(source, at)) >= 0) {
      at = end
      value = source.slice(start, at)
      if (startsIdentifier(source, at)) {
        kind = DIMENSION
        dimension = name()
      } else if (source.charCodeAt(at) === 0x25) {
        at++
        kind = PERCENTAGE
      } else {
        kind = NUMBER
      }
    } else if (unit === 0x40 && startsIdentifier(source, at + 1)) {
      at++
      value = name()
      kind = value ? AT_KEYWORD : DELIM
      if (!value) value = '@'
    } else if (startsIdentifier(source, at)) {
      value = name()
      if (at === start) {
        at++
        kind = OTHER
      } else if (source.charCodeAt(at) === 0x28) {
        at++
        kind = FUNCTION
      } else {
        kind = IDENT
      }
    } else {
      // Every non-ASCII code point starts an identifier, so a delimiter is one unit.
      at++
      kind = DELIM
      value = source[start]
    }
    const index = tokens.length
    if (kind === FUNCTION || (kind === DELIM && (value === '(' || value === '[' || value === '{'))) {
      opens.push(index)
    } else if (kind === DELIM && opens.length && closer(tokens[opens[opens.length - 1]]) === value) {
      tokens[opens.pop()!].close = index
    }
    tokens.push({ kind, value, unit: dimension, start, end: at, close: -1 })
  }
  return tokens
}

const closer = (token: Token) => token.kind === FUNCTION || token.value === '(' ? ')' : token.value === '[' ? ']' : '}'

const isDelim = (token: Token | undefined, value: string) => token?.kind === DELIM && token.value === value

/** Statement and block structure with parent indexes, as `collect_css_syntax_statements` walks it. */
export function collectStatements(tokens: Token[]): Statement[] {
  const result: Statement[] = []
  const blocks: [start: number, end: number, parent: number][] = [[0, tokens.length, -1]]
  while (blocks.length) {
    let [start, end, parent] = blocks.pop()!
    while (start < end) {
      if (isDelim(tokens[start], ';') || isDelim(tokens[start], '}')) {
        start++
        continue
      }
      const declaration = parent >= 0 && tokens[start].kind === IDENT && isDelim(tokens[start + 1], ':')
      const custom = declaration && tokens[start].value.startsWith('--')
      let cursor = start
      while (cursor < end) {
        const token = tokens[cursor]
        if (isDelim(token, ';') || (!custom && isDelim(token, '{'))) break
        if (token.kind === FUNCTION || isDelim(token, '(') || isDelim(token, '[') || isDelim(token, '{')) {
          cursor = token.close < 0 ? end : token.close + 1
        } else {
          cursor++
        }
      }
      const hasBlock = cursor < end && isDelim(tokens[cursor], '{')
      const index = result.length
      result.push({ start, end: cursor, parent, hasBlock, declaration: declaration && !hasBlock })
      if (hasBlock) {
        const close = Math.min(tokens[cursor].close < 0 ? end : tokens[cursor].close, end)
        blocks.push([cursor + 1, close, index])
        start = close + 1
      } else {
        start = cursor + 1
      }
    }
  }
  return result
}
