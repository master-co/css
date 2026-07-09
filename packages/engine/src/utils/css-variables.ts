import type { Variable } from '@master/css-schema/css-syntax'

export const CSS_VARIABLE_REFERENCE = /var\(\s*--([_a-zA-Z0-9-]+)\b/g
const CSS_VARIABLE_ALIAS = /\$(-?[_a-zA-Z0-9-]+)\b/g
const CSS_NUMBER = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/

function isCSSIdentifierChar(value: string | undefined) {
  return value !== undefined && /[-_a-zA-Z0-9]/.test(value)
}

function findCSSClosingQuote(value: string, start: number, quote: string) {
  for (let index = start + 1; index < value.length; index++) {
    const char = value[index]
    if (char === '\\') {
      index++
      continue
    }
    if (char === quote) return index
  }
  return value.length - 1
}

function findCSSCommentEnd(value: string, start: number) {
  const end = value.indexOf('*/', start + 2)
  return end === -1 ? value.length : end + 2
}

function findCSSFunctionEnd(value: string, openIndex: number) {
  let depth = 1
  for (let index = openIndex + 1; index < value.length; index++) {
    const char = value[index]
    if (char === '"' || char === '\'') {
      index = findCSSClosingQuote(value, index, char)
      continue
    }
    if (char === '/' && value[index + 1] === '*') {
      index = findCSSCommentEnd(value, index) - 1
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

function readCSSFunction(value: string, start: number, name: string) {
  if (isCSSIdentifierChar(value[start - 1])) return
  if (value.slice(start, start + name.length).toLowerCase() !== name) return
  const openIndex = start + name.length
  if (value[openIndex] !== '(') return
  const end = findCSSFunctionEnd(value, openIndex)
  if (!end) {
    throw new Error(`Invalid ${name}() function: missing closing ")"`)
  }
  return {
    body: value.slice(openIndex + 1, end - 1),
    end,
    text: value.slice(start, end)
  }
}

function collectUnquotedMatches(value: string, pattern: RegExp) {
  const matches: RegExpMatchArray[] = []
  for (let index = 0; index < value.length;) {
    const char = value[index]
    if (char === '"' || char === '\'') {
      index = findCSSClosingQuote(value, index, char) + 1
      continue
    }
    if (char === '/' && value[index + 1] === '*') {
      index = findCSSCommentEnd(value, index)
      continue
    }
    pattern.lastIndex = index
    const match = pattern.exec(value)
    if (!match || match.index !== index) {
      index++
      continue
    }
    matches.push(match)
    index = pattern.lastIndex
  }
  return matches
}

function collectCSSVariableAliases(value: string) {
  return collectUnquotedMatches(value, CSS_VARIABLE_ALIAS)
    .filter((match) => value[match.index! - 1] !== '\\')
}

function findTopLevelAlphaSeparator(value: string) {
  let separatorIndex = -1
  let depth = 0
  for (let index = 0; index < value.length; index++) {
    const char = value[index]
    if (char === '"' || char === '\'') {
      index = findCSSClosingQuote(value, index, char)
      continue
    }
    if (char === '/' && value[index + 1] === '*') {
      index = findCSSCommentEnd(value, index) - 1
      continue
    }
    if (char === '(') {
      depth++
      continue
    }
    if (char === ')') {
      if (depth > 0) depth--
      continue
    }
    if (char === '/' && depth === 0) {
      if (separatorIndex !== -1) return
      separatorIndex = index
    }
  }
  return separatorIndex
}

function isWholeCSSFunction(value: string, name: string) {
  const trimmed = value.trim()
  const fn = readCSSFunction(trimmed, 0, name)
  return Boolean(fn && fn.end === trimmed.length)
}

function formatAlphaPercentage(value: number) {
  return String(Object.is(value, -0) ? 0 : value).replace(/^(-?)0\./, '$1.') + '%'
}

function normalizeStylesheetAlpha(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error('Invalid --alpha() function: alpha value cannot be empty')
  }

  if (CSS_NUMBER.test(trimmed)) {
    const alpha = Number(trimmed)
    if (alpha < 0 || alpha > 1) {
      throw new Error(`Invalid --alpha() function: numeric alpha must be between 0 and 1: ${trimmed}`)
    }
    return formatAlphaPercentage(alpha * 100)
  }

  if (trimmed.endsWith('%') && CSS_NUMBER.test(trimmed.slice(0, -1))) {
    const percentage = Number(trimmed.slice(0, -1))
    if (percentage < 0 || percentage > 100) {
      throw new Error(`Invalid --alpha() function: percentage alpha must be between 0% and 100%: ${trimmed}`)
    }
    return formatAlphaPercentage(percentage)
  }

  if (isWholeCSSFunction(trimmed, 'var') || isWholeCSSFunction(trimmed, 'calc')) {
    return trimmed
  }

  throw new Error(`Invalid --alpha() function: unsupported alpha value "${trimmed}"`)
}

function normalizeAlphaFunction(body: string) {
  const separatorIndex = findTopLevelAlphaSeparator(body)
  if (separatorIndex === undefined || separatorIndex === -1) {
    throw new Error('Invalid --alpha() function: expected "<color> / <alpha>"')
  }
  const color = body.slice(0, separatorIndex).trim()
  const alpha = body.slice(separatorIndex + 1).trim()
  if (!color) {
    throw new Error('Invalid --alpha() function: color value cannot be empty')
  }
  return createAlphaColorValue(color, normalizeStylesheetAlpha(alpha))
}

export function normalizeStylesheetValue(value: string | number, options: { replacePipes?: boolean } = {}) {
  if (typeof value === 'number') {
    return { value: String(value), dependencies: new Set<string>() }
  }

  const aliases = collectCSSVariableAliases(value)
  if (aliases.length) {
    const alias = aliases[0][1]
    throw new Error(`Stylesheet values use native CSS variable references. Replace "$${alias}" with "var(--${alias})".`)
  }

  let result = ''
  for (let index = 0; index < value.length;) {
    const char = value[index]
    if (char === '"' || char === '\'') {
      const end = findCSSClosingQuote(value, index, char) + 1
      result += value.slice(index, end)
      index = end
      continue
    }
    if (char === '/' && value[index + 1] === '*') {
      const end = findCSSCommentEnd(value, index)
      result += value.slice(index, end)
      index = end
      continue
    }
    if (value.startsWith('--alpha(', index)) {
      const alphaFunction = readCSSFunction(value, index, '--alpha')
      if (alphaFunction) {
        result += normalizeAlphaFunction(alphaFunction.body)
        index = alphaFunction.end
        continue
      }
    }
    if (options.replacePipes && char === '|') {
      result += ' '
      index++
      continue
    }
    result += char
    index++
  }

  return {
    value: result,
    dependencies: collectCSSVariableReferences(result)
  }
}

export function createCSSVariableReference(name: string, alpha?: number, fallback?: string) {
  const reference = `var(--${name}${fallback ? ',' + fallback : ''})`
  return alpha !== undefined
    ? createAlphaColorValue(reference, alpha)
    : reference
}

export function createAlphaColorValue(value: string, alpha: number | string) {
  const alphaValue = typeof alpha === 'number'
    ? formatAlphaPercentage(Number(alpha) * 100)
    : alpha
  return `color-mix(in oklab,${value} ${alphaValue},transparent)`
}

export function createNumberVariableReference(variable: Variable, unit: string, rootSize = 16) {
  void unit
  void rootSize
  return createCSSVariableReference(variable.name)
}

export function createNegativeNumberVariableReference(variable: Variable, unit: string, rootSize = 16) {
  const reference = createCSSVariableReference(variable.name)
  void variable
  void unit
  void rootSize
  return `calc(${reference} * -1)`
}

export function collectCSSVariableReferences(value: string) {
  const references = new Set<string>()
  for (let index = 0; index < value.length;) {
    const char = value[index]
    if (char === '"' || char === '\'') {
      index = findCSSClosingQuote(value, index, char) + 1
      continue
    }
    if (char === '/' && value[index + 1] === '*') {
      index = findCSSCommentEnd(value, index)
      continue
    }
    const variableFunction = readCSSFunction(value, index, 'var')
    if (variableFunction) {
      let cursor = index + 4
      while (value[cursor] === ' ') cursor++
      if (value.slice(cursor, cursor + 2) === '--') {
        cursor += 2
        const nameStart = cursor
        while (/[_a-zA-Z0-9-]/.test(value[cursor] || '')) cursor++
        const name = value.slice(nameStart, cursor)
        if (name) references.add(name)
      }
    }
    index++
  }
  return references
}

export function replaceCSSVariableReferences(value: string, replacer: (name: string, text: string) => string | undefined) {
  let result = ''
  let quote = ''

  for (let i = 0; i < value.length;) {
    const char = value[i]

    if (quote) {
      result += char
      if (char === '\\') {
        result += value[i + 1] || ''
        i += 2
        continue
      }
      if (char === quote) quote = ''
      i++
      continue
    }

    if (char === '/' && value[i + 1] === '*') {
      const end = findCSSCommentEnd(value, i)
      result += value.slice(i, end)
      i = end
      continue
    }

    if (char === '"' || char === '\'') {
      quote = char
      result += char
      i++
      continue
    }

    if (value.slice(i, i + 4).toLowerCase() === 'var(') {
      let cursor = i + 4
      while (value[cursor] === ' ') cursor++
      if (value.slice(cursor, cursor + 2) !== '--') {
        result += char
        i++
        continue
      }
      cursor += 2
      const nameStart = cursor
      while (/[_a-zA-Z0-9-]/.test(value[cursor] || '')) cursor++
      const name = value.slice(nameStart, cursor)
      if (!name) {
        result += char
        i++
        continue
      }

      let depth = 1
      let innerQuote = ''
      let closeIndex = -1
      for (let j = cursor; j < value.length; j++) {
        const nextChar = value[j]
        if (innerQuote) {
          if (nextChar === '\\') {
            j++
            continue
          }
          if (nextChar === innerQuote) innerQuote = ''
          continue
        }
        if (nextChar === '"' || nextChar === '\'') {
          innerQuote = nextChar
          continue
        }
        if (nextChar === '/' && value[j + 1] === '*') {
          j = findCSSCommentEnd(value, j) - 1
          continue
        }
        if (nextChar === '(') {
          depth++
          continue
        }
        if (nextChar === ')') {
          depth--
          if (depth === 0) {
            closeIndex = j
            break
          }
        }
      }

      if (closeIndex === -1) {
        result += value.slice(i)
        break
      }

      const text = value.slice(i, closeIndex + 1)
      result += replacer(name, text) ?? text
      i = closeIndex + 1
      continue
    }

    result += char
    i++
  }

  return result
}

export function normalizeVariableValue(value: string | number) {
  return normalizeStylesheetValue(value, { replacePipes: true })
}
