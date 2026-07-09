import { findCSSClosingQuote, isCSSIdentChar } from './source'

export interface CSSFunctionToken {
  body: string
  end: number
  text: string
}

export function findCSSCommentEnd(source: string, start: number, limit = source.length) {
  const end = source.indexOf('*/', start + 2)
  return end === -1 || end + 2 > limit ? limit : end + 2
}

export function findCSSFunctionEnd(source: string, openIndex: number, limit = source.length) {
  let depth = 1
  for (let index = openIndex + 1; index < limit; index++) {
    const char = source[index]
    if (char === '"' || char === '\'') {
      index = findCSSClosingQuote(source, index, char, limit)
      continue
    }
    if (char === '/' && source[index + 1] === '*') {
      index = findCSSCommentEnd(source, index, limit) - 1
      continue
    }
    if (char === '(') {
      depth++
      continue
    }
    if (char === ')') {
      depth--
      if (depth === 0) return index + 1
    }
  }
}

export function readCSSFunction(source: string, start: number, name: string, limit = source.length): CSSFunctionToken | undefined {
  if (isCSSIdentChar(source[start - 1])) return
  if (source.slice(start, start + name.length).toLowerCase() !== name) return
  const openIndex = start + name.length
  if (source[openIndex] !== '(') return
  const end = findCSSFunctionEnd(source, openIndex, limit)
  if (!end) {
    throw new Error(`Invalid ${name}() function: missing closing ")"`)
  }
  return {
    body: source.slice(openIndex + 1, end - 1),
    end,
    text: source.slice(start, end)
  }
}

export function collectCSSVariableReferences(source: string) {
  const references = new Set<string>()
  for (let index = 0; index < source.length;) {
    const char = source[index]
    if (char === '"' || char === '\'') {
      index = findCSSClosingQuote(source, index, char) + 1
      continue
    }
    if (char === '/' && source[index + 1] === '*') {
      index = findCSSCommentEnd(source, index)
      continue
    }
    const variableFunction = readCSSFunction(source, index, 'var')
    if (variableFunction) {
      let cursor = index + 4
      while (source[cursor] === ' ') cursor++
      if (source.slice(cursor, cursor + 2) === '--') {
        cursor += 2
        const nameStart = cursor
        while (/[_a-zA-Z0-9-]/.test(source[cursor] || '')) cursor++
        const name = source.slice(nameStart, cursor)
        if (name) references.add(name)
      }
    }
    index++
  }
  return references
}

export function replaceCSSVariableReferences(source: string, replacer: (name: string, text: string) => string | undefined) {
  let result = ''
  let quote = ''

  for (let index = 0; index < source.length;) {
    const char = source[index]

    if (quote) {
      result += char
      if (char === '\\') {
        result += source[index + 1] || ''
        index += 2
        continue
      }
      if (char === quote) quote = ''
      index++
      continue
    }

    if (char === '/' && source[index + 1] === '*') {
      const end = findCSSCommentEnd(source, index)
      result += source.slice(index, end)
      index = end
      continue
    }

    if (char === '"' || char === '\'') {
      quote = char
      result += char
      index++
      continue
    }

    if (source.slice(index, index + 4).toLowerCase() === 'var(') {
      let cursor = index + 4
      while (source[cursor] === ' ') cursor++
      if (source.slice(cursor, cursor + 2) !== '--') {
        result += char
        index++
        continue
      }
      cursor += 2
      const nameStart = cursor
      while (/[_a-zA-Z0-9-]/.test(source[cursor] || '')) cursor++
      const name = source.slice(nameStart, cursor)
      if (!name) {
        result += char
        index++
        continue
      }

      let depth = 1
      let innerQuote = ''
      let closeIndex = -1
      for (let nextIndex = cursor; nextIndex < source.length; nextIndex++) {
        const nextChar = source[nextIndex]
        if (innerQuote) {
          if (nextChar === '\\') {
            nextIndex++
            continue
          }
          if (nextChar === innerQuote) innerQuote = ''
          continue
        }
        if (nextChar === '"' || nextChar === '\'') {
          innerQuote = nextChar
          continue
        }
        if (nextChar === '/' && source[nextIndex + 1] === '*') {
          nextIndex = findCSSCommentEnd(source, nextIndex) - 1
          continue
        }
        if (nextChar === '(') {
          depth++
          continue
        }
        if (nextChar === ')') {
          depth--
          if (depth === 0) {
            closeIndex = nextIndex
            break
          }
        }
      }

      if (closeIndex === -1) {
        result += source.slice(index)
        break
      }

      const text = source.slice(index, closeIndex + 1)
      result += replacer(name, text) ?? text
      index = closeIndex + 1
      continue
    }

    result += char
    index++
  }

  return result
}
