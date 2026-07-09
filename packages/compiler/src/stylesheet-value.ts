import {
  collectCSSVariableReferences,
  findCSSClosingQuote,
  findCSSCommentEnd,
  readCSSFunction
} from '@master/css-lexer'

const CSS_VARIABLE_ALIAS = /\$(-?[_a-zA-Z0-9-]+)\b/g
const CSS_NUMBER = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/

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

function createStylesheetAlphaColorValue(value: string, alpha: string) {
  return `color-mix(in oklab,${value} ${alpha},transparent)`
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
  return createStylesheetAlphaColorValue(color, normalizeStylesheetAlpha(alpha))
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
