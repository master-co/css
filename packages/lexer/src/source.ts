export interface SourceRange {
  start: number
  end: number
}

export interface SourceLocation {
  line: number
  column: number
}

export interface CSSStatementEnd {
  end: number
  reason: 'semicolon' | 'block' | 'eof'
  delimiterRange?: SourceRange
}

export function escapeRegExp(source: string) {
  return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function cssEscape(value: string) {
  if (typeof CSS !== 'undefined') return CSS.escape(value)
  if (arguments.length == 0) {
    throw new TypeError('`CSS.escape` requires an argument.')
  }
  const string = String(value)
  const length = string.length
  let index = -1
  let result = ''
  let codeUnit
  const firstCodeUnit = string.charCodeAt(0)

  if (
    length == 1 &&
    firstCodeUnit == 0x002D
  ) {
    return '\\' + string
  }

  while (++index < length) {
    codeUnit = string.charCodeAt(index)

    if (codeUnit == 0x0000) {
      result += '\uFFFD'
      continue
    }

    if (
      (codeUnit >= 0x0001 && codeUnit <= 0x001F) || codeUnit == 0x007F ||
      (index == 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
      (
        index == 1 &&
        codeUnit >= 0x0030 && codeUnit <= 0x0039 &&
        firstCodeUnit == 0x002D
      )
    ) {
      result += '\\' + codeUnit.toString(16) + ' '
      continue
    }

    if (
      codeUnit >= 0x0080 ||
      codeUnit == 0x002D ||
      codeUnit == 0x005F ||
      codeUnit >= 0x0030 && codeUnit <= 0x0039 ||
      codeUnit >= 0x0041 && codeUnit <= 0x005A ||
      codeUnit >= 0x0061 && codeUnit <= 0x007A
    ) {
      result += string.charAt(index)
      continue
    }

    result += '\\' + string.charAt(index)
  }
  return result
}

export function isCSSIdentChar(char: string | undefined) {
  return Boolean(char && /[-_a-zA-Z0-9]/.test(char))
}

export function isCSSIdentStart(char: string | undefined) {
  return Boolean(char && /[_a-zA-Z-]/.test(char))
}

export function skipCSSWhitespace(source: string, index: number) {
  while (/\s/.test(source[index] || '')) index++
  return index
}

export function readCSSIdent(source: string, index: number) {
  const start = index
  while (isCSSIdentChar(source[index])) index++
  return {
    start,
    end: index,
    value: source.slice(start, index)
  }
}

export function createSourceLocationResolver(source: string) {
  const lineStarts = [0]
  for (let index = 0; index < source.length; index++) {
    if (source[index] === '\n') {
      lineStarts.push(index + 1)
    }
  }

  return (loc: SourceLocation | undefined) => {
    if (!loc) return -1
    const lineStart = lineStarts[loc.line]
    if (lineStart === undefined) return -1
    return lineStart + Math.max(0, loc.column - 1)
  }
}

export function findCSSStatementEnd(source: string, start: number): CSSStatementEnd {
  let quote = ''
  let comment = false
  let depth = 0
  for (let index = start; index < source.length; index++) {
    const char = source[index]
    const next = source[index + 1]
    if (comment) {
      if (char === '*' && next === '/') {
        comment = false
        index++
      }
      continue
    }
    if (quote) {
      if (char === '\\') {
        index++
      } else if (char === quote) {
        quote = ''
      }
      continue
    }
    if (char === '/' && next === '*') {
      comment = true
      index++
      continue
    }
    if (char === '"' || char === '\'') {
      quote = char
      continue
    }
    if (char === '(' || char === '[') {
      depth++
      continue
    }
    if (char === ')' || char === ']') {
      depth = Math.max(0, depth - 1)
      continue
    }
    if (depth === 0 && char === ';') {
      return {
        end: index + 1,
        reason: 'semicolon',
        delimiterRange: { start: index, end: index + 1 }
      }
    }
    if (depth === 0 && char === '{') {
      return {
        end: index,
        reason: 'block',
        delimiterRange: { start: index, end: index + 1 }
      }
    }
  }
  return {
    end: source.length,
    reason: 'eof'
  }
}

export function findCSSClosingQuote(source: string, start: number, quote: string, limit = source.length) {
  for (let index = start + 1; index < limit; index++) {
    if (source[index] === '\\') {
      index++
      continue
    }
    if (source[index] === quote) return index
  }
  return Math.max(start, limit - 1)
}

export function findCSSBlockEnd(source: string, open: number) {
  if (source[open] !== '{') return -1
  let quote = ''
  let comment = false
  let depth = 0
  for (let index = open; index < source.length; index++) {
    const char = source[index]
    const next = source[index + 1]
    if (comment) {
      if (char === '*' && next === '/') {
        comment = false
        index++
      }
      continue
    }
    if (quote) {
      if (char === '\\') {
        index++
      } else if (char === quote) {
        quote = ''
      }
      continue
    }
    if (char === '/' && next === '*') {
      comment = true
      index++
      continue
    }
    if (char === '"' || char === '\'') {
      quote = char
      continue
    }
    if (char === '{') {
      depth++
      continue
    }
    if (char === '}') {
      depth--
      if (depth === 0) return index
    }
  }
  return -1
}

export function removeSourceRanges(source: string, ranges: SourceRange[]) {
  if (!ranges.length) return source
  let output = ''
  let offset = 0
  for (const range of ranges) {
    output += source.slice(offset, range.start)
    offset = range.end
  }
  return output + source.slice(offset)
}

export function replaceSourceRanges(source: string, ranges: (SourceRange & { replacement: string })[]) {
  if (!ranges.length) return source
  let output = ''
  let offset = 0
  for (const range of ranges) {
    output += source.slice(offset, range.start)
    output += range.replacement
    offset = range.end
  }
  return output + source.slice(offset)
}
