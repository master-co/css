// Rust `str` and `char` semantics that engine output depends on, over UTF-16 strings.
// Rust strings are UTF-8, so these compare code points, trim Unicode White_Space and
// fold only ASCII case, where the JS built-ins would differ.

export const isAsciiDigit = (unit: number) => unit >= 0x30 && unit <= 0x39

/** Rust `u8::is_ascii_whitespace`, which is also CSS whitespace. */
export const isAsciiWhitespace = (unit: number) => unit === 0x20 || unit === 0x09 || unit === 0x0a || unit === 0x0c || unit === 0x0d

/** Rust `char::is_whitespace` (Unicode White_Space), which `trim` uses; JS also trims U+FEFF but not U+0085. */
export function isWhitespace(unit: number) {
  if (unit < 0x80) return unit === 0x20 || (unit >= 0x09 && unit <= 0x0d)
  return unit === 0x85 || unit === 0xa0 || unit === 0x1680 || (unit >= 0x2000 && unit <= 0x200a)
    || unit === 0x2028 || unit === 0x2029 || unit === 0x202f || unit === 0x205f || unit === 0x3000
}

export function trimEnd(value: string) {
  let end = value.length
  while (end > 0 && isWhitespace(value.charCodeAt(end - 1))) end--
  return value.slice(0, end)
}

export function trim(value: string) {
  let start = 0
  while (start < value.length && isWhitespace(value.charCodeAt(start))) start++
  return trimEnd(value.slice(start))
}

export const asciiLowercase = (value: string) => value.replace(/[A-Z]+/g, (letters) => letters.toLowerCase())

/** Rust `eq_ignore_ascii_case` against a lowercase ASCII `expected`. */
export const isAsciiCase = (value: string, expected: string) => value.length === expected.length && asciiLowercase(value) === expected

// Code unit order differs from code point order only between a surrogate and a unit
// from U+E000; this moves surrogates above every other BMP unit.
const codePointRank = (unit: number) => unit >= 0xd800 ? (unit <= 0xdfff ? unit + 0x2000 : unit - 0x800) : unit

/** The Rust `str` (code point) order of two strings. */
export function compareText(left: string, right: string) {
  const length = Math.min(left.length, right.length)
  for (let index = 0; index < length; index++) {
    const unit = left.charCodeAt(index)
    const other = right.charCodeAt(index)
    if (unit !== other) return codePointRank(unit) < codePointRank(other) ? -1 : 1
  }
  return left.length === right.length ? 0 : left.length < right.length ? -1 : 1
}

/** Replaces lone surrogates with U+FFFD, as the UTF-8 boundary of the Rust engine does. */
export function wellFormed(value: string) {
  if (!/[\ud800-\udfff]/.test(value)) return value
  let result = ''
  for (let index = 0; index < value.length; index++) {
    const unit = value.charCodeAt(index)
    if (unit >= 0xd800 && unit <= 0xdbff && index + 1 < value.length) {
      const next = value.charCodeAt(index + 1)
      if (next >= 0xdc00 && next <= 0xdfff) {
        result += value[index] + value[++index]
        continue
      }
    }
    result += unit >= 0xd800 && unit <= 0xdfff ? '�' : value[index]
  }
  return result
}
