// Declaration values: native math normalization, custom property references, inline
// theme tokens and decimal opacity, as the engine's value_syntax.rs, inline_theme.rs
// and decimal.rs compute them. Numbers stay decimal text; nothing goes through floats.
import { decodeNativeContent } from './class-syntax'
import { DELIM, DIMENSION, FUNCTION, IDENT, NUMBER, PERCENTAGE, tokenize, type Token } from './css-syntax'
import type { Program, Variable } from './program-model'
import { isAsciiCase, isAsciiDigit, isAsciiWhitespace, trimEnd } from './text'

const MATH_FUNCTIONS = ['calc', 'min', 'max', 'clamp']
const isNumeric = (token: Token | undefined) => token !== undefined && (token.kind === NUMBER || token.kind === DIMENSION || token.kind === PERCENTAGE)

/** Normalizes the math functions of a value, leaving strings, comments and URLs opaque. */
export function normalizeCssMathFunctions(source: string): string {
  if (!source.includes('(')) return source
  const tokens = tokenize(source)
  let output = ''
  let copied = 0
  let index = 0
  while (index < tokens.length) {
    const token = tokens[index]
    if (token.kind !== FUNCTION || token.close < 0) {
      index++
      continue
    }
    const close = token.close
    index = close + 1
    if (isAsciiCase(token.value, 'url')) continue
    const start = token.end
    const end = tokens[close].start
    let inner = normalizeCssMathFunctions(source.slice(start, end))
    if (MATH_FUNCTIONS.some((name) => isAsciiCase(token.value, name))) inner = normalizeMathExpression(inner)
    output += source.slice(copied, start) + inner
    copied = end
  }
  return output + source.slice(copied)
}

/**
 * Spaces binary operators and commas. Token boundaries protect exponent signs and
 * escaped or quoted identifiers; signed adjacent numbers and numeric subtraction
 * inside compact dimensions are Master's two extensions to CSS tokenization.
 */
function normalizeMathExpression(source: string): string {
  const tokens = tokenize(source)
  const edits: [start: number, end: number, replacement: string][] = []
  let operand = false
  let index = 0
  while (index < tokens.length) {
    const token = tokens[index]
    const raw = source.slice(token.start, token.end)
    if (token.close >= 0) {
      // Nested parentheses are math; function payloads were normalized as values.
      if (token.kind === DELIM && token.value === '(') {
        const start = token.end
        const end = tokens[token.close].start
        edits.push([start, end, normalizeMathExpression(source.slice(start, end))])
      }
      operand = true
      index = token.close + 1
      continue
    }
    if (isNumeric(token)) {
      if (operand && (raw[0] === '+' || raw[0] === '-')) edits.push([token.start, token.start + 1, ` ${raw[0]} `])
      if (token.kind === DIMENSION && !raw.includes('\\')) {
        // `1px-2px` is one native dimension; only a minus before a numeric operand subtracts.
        for (let minus = raw.indexOf('-', token.value.length); minus >= 0; minus = raw.indexOf('-', minus + 1)) {
          const next = raw.charCodeAt(minus + 1)
          if ((minus + 1 === raw.length && tokens[index + 1]?.start === token.end && isNumeric(tokens[index + 1]))
            || isAsciiDigit(next)
            || (next === 0x2e && isAsciiDigit(raw.charCodeAt(minus + 2)))) {
            // Re-tokenized, so a later exponent sign never becomes another operator.
            edits.push([token.start + minus, token.end, ` - ${normalizeMathExpression(raw.slice(minus + 1))}`])
            break
          }
        }
      }
      operand = true
    } else if (token.kind === DELIM && operand && '+-*/'.includes(token.value)) {
      edits.push([token.start, token.end, ` ${token.value} `])
      operand = false
    } else if (token.kind === DELIM && token.value === ',') {
      edits.push([token.start, token.end, ', '])
      operand = false
    } else {
      operand = token.kind === IDENT
    }
    index++
  }
  // Operator edits absorb adjacent whitespace, never comments.
  for (const edit of edits) {
    const replacement = edit[2]
    if (replacement[0] !== ' ' && replacement[0] !== ',') continue
    if (replacement[0] === ' ') while (edit[0] > 0 && isAsciiWhitespace(source.charCodeAt(edit[0] - 1))) edit[0]--
    while (edit[1] < source.length && isAsciiWhitespace(source.charCodeAt(edit[1]))) edit[1]++
  }
  let output = ''
  let copied = 0
  for (const [start, end, replacement] of edits) {
    if (start < copied) continue
    output += source.slice(copied, start) + replacement
    copied = end
  }
  return output + source.slice(copied)
}

const isVarReference = (tokens: Token[], index: number, end: number) => {
  const name = tokens[index + 1]
  return name?.kind === IDENT && name.value.length > 2 && name.value.startsWith('--')
    && (index + 2 === end || (tokens[index + 2]?.kind === DELIM && tokens[index + 2].value === ','))
}

/** The custom properties a value references with `var()`, in source order, outside strings, comments and URLs. */
export function collectCssVariableReferences(source: string) {
  const names: string[] = []
  if (!source.includes('(')) return names
  const tokens = tokenize(source)
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index]
    if (token.kind !== FUNCTION) continue
    const end = token.close < 0 ? tokens.length : token.close
    if (isAsciiCase(token.value, 'url')) {
      index = Math.min(end + 1, tokens.length) - 1
      continue
    }
    if (isAsciiCase(token.value, 'var') && isVarReference(tokens, index, end)) {
      const name = tokens[index + 1].value.slice(2)
      if (!names.includes(name)) names.push(name)
    }
  }
  return names
}

/** Replaces `var()` references to inline theme tokens with their values. */
export function substituteInlineTokens(source: string, program: Program) {
  if (!program.hasInlineTokens || !source.includes('(')) return source
  const tokens = tokenize(source)
  let result = ''
  let copied = 0
  let index = 0
  while (index < tokens.length) {
    const token = tokens[index]
    if (token.kind === FUNCTION && token.close >= 0) {
      const close = token.close
      if (isAsciiCase(token.value, 'url')) {
        index = close + 1
        continue
      }
      const name = tokens[index + 1]
      const value = isAsciiCase(token.value, 'var') && name?.kind === IDENT && name.value.startsWith('--')
        && (index + 2 === close || (tokens[index + 2].kind === DELIM && tokens[index + 2].value === ','))
        ? program.variables.get(name.value.slice(2))?.inlineValue
        : undefined
      if (value !== undefined) {
        result += source.slice(copied, token.start) + value
        copied = tokens[close].end
        index = close + 1
        continue
      }
    }
    index++
  }
  return result + source.slice(copied)
}

/** A value without its trailing `!important`, and whether it had one. */
export function valueWithoutImportance(value: string): [value: string, important: boolean] {
  const tokens = tokenize(value)
  const bang = tokens[tokens.length - 2]
  const keyword = tokens[tokens.length - 1]
  if (bang?.kind === DELIM && bang.value === '!' && keyword.kind === IDENT && isAsciiCase(keyword.value, 'important')) {
    return [trimEnd(value.slice(0, bang.start)), true]
  }
  return [value, false]
}

/**
 * The value an inlined variable reference becomes: the last declared value, unless an
 * earlier `!important` one outranks it; only when that value is an inline one.
 */
export function selectedInlineValue(values: Variable['values']) {
  if (!values.some((entry) => entry.inline)) return
  let selected: [inline: boolean, value: string] | undefined
  let selectedImportant = false
  for (const entry of values) {
    const [value, important] = valueWithoutImportance(entry.value)
    if (selectedImportant && !important) continue
    selected = [entry.inline, value]
    selectedImportant = important
  }
  return selected?.[0] ? selected[1] : undefined
}

/** A decimal number as `f64::from_str` accepts it: `0.<digits> × 10^point`, without leading or trailing zeros. */
export interface Decimal {
  negative: boolean
  digits: string
  point: number
}

const DIGITS = /^\d*$/

export function parseDecimal(text: string): Decimal | undefined {
  const negative = text[0] === '-'
  const unsigned = negative || text[0] === '+' ? text.slice(1) : text
  let mantissa = unsigned
  let exponent = 0
  const e = unsigned.search(/[eE]/)
  if (e >= 0) {
    const raw = unsigned.slice(e + 1)
    const digits = raw[0] === '+' || raw[0] === '-' ? raw.slice(1) : raw
    if (!digits || !DIGITS.test(digits)) return
    // Beyond this the value is zero or out of range either way.
    const magnitude = Math.min(digits.replace(/^0+/, '').length > 7 ? Infinity : Number(digits), 1 << 20)
    exponent = raw[0] === '-' ? -magnitude : magnitude
    mantissa = unsigned.slice(0, e)
  }
  const dot = mantissa.indexOf('.')
  const integer = dot < 0 ? mantissa : mantissa.slice(0, dot)
  const fraction = dot < 0 ? '' : mantissa.slice(dot + 1)
  if ((!integer && !fraction) || !DIGITS.test(integer) || !DIGITS.test(fraction)) return
  const all = integer + fraction
  const leading = all.length - all.replace(/^0+/, '').length
  return { negative, digits: all.slice(leading).replace(/0+$/, ''), point: integer.length - leading + exponent }
}

/** `2^1024 − 2^970`, the least magnitude that `f64::from_str` rounds to infinity. */
const F64_OVERFLOW = '179769313486231580793728971405303415079934132710037826936173778980444968292764750946649017977587207096330286416692887910946555547851940402630657488671505820681908902000708383676273854845817711531764475730270069855571366959622842914819860834936475292719074168444365510704342711559699508093042880177904174497792'

/** Whether `f64::from_str` parses the number to a finite value. */
export function decimalIsFinite({ digits, point }: Decimal) {
  if (!digits || point !== F64_OVERFLOW.length) return !digits || point < F64_OVERFLOW.length
  // Equal digits round, as ties to even, to infinity.
  for (let index = 0; index < F64_OVERFLOW.length; index++) {
    const digit = digits[index] ?? '0'
    if (digit !== F64_OVERFLOW[index]) return digit < F64_OVERFLOW[index]
  }
  return false
}

/** Whether a digit string without leading zeros is below 2^53. */
const belowTwo53 = (digits: string) => digits.length < 16 || (digits.length === 16 && digits < '9007199254740992')

/**
 * The number as Rust's `Decimal::to_f64` computes it: exact for at most 15 significant
 * digits within the exactly representable powers of ten, close to it otherwise.
 */
export function decimalToNumber({ negative, digits, point }: Decimal) {
  const significant = digits.slice(0, 19)
  const exponent = point - significant.length
  // A u64 converts to the nearest double, as a correctly rounded parse of its digits does.
  let value = Number(significant || '0')
  if (belowTwo53(significant) && exponent >= -22 && exponent <= 22) {
    // Decimal literals of powers of ten up to 1e22 are exact doubles.
    value = exponent < 0 ? value / Number(`1e${-exponent}`) : value * Number(`1e${exponent}`)
  } else if (exponent > 22 && exponent - 22 <= 19 && belowTwo53(significant + '0'.repeat(exponent - 22))) {
    value = Number(significant + '0'.repeat(exponent - 22)) * 1e22
  } else {
    // Out of the exact range, overflow and underflow still reach infinity and zero.
    for (let step = Math.min(Math.abs(exponent), 400); step > 0; step--) value = exponent < 0 ? value / 10 : value * 10
  }
  return negative ? -value : value
}

/** An opacity from 0 to 1 as a percentage, computed on its digits so `.07` is `7`, not `7.000000000000001`. */
export function alphaPercentage(alpha: string) {
  const decimal = parseDecimal(alpha)
  if (!decimal) return
  const { negative, digits } = decimal
  if (!digits) return '0'
  if (negative || decimal.point > 1 || (decimal.point === 1 && digits !== '1')) return
  const point = decimal.point + 2
  if (point <= 0) return `0.${'0'.repeat(-point)}${digits}`
  if (point >= digits.length) return digits + '0'.repeat(point - digits.length)
  return `${digits.slice(0, point)}.${digits.slice(point)}`
}

/** A dynamic value with Master separators decoded and math normalized, and the program variables it references. */
export function resolveValueComponents(value: string, program: Program): [value: string, variableNames: string[]] {
  const output = decodeNativeContent(value) ?? value
  const variableNames = collectCssVariableReferences(output).filter((name) => program.variables.has(name))
  return [normalizeCssMathFunctions(output), variableNames]
}
