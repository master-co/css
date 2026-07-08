import { pushHighlightToken, type HighlightTokenItem } from '../highlight'
import { tokenizeDeclarations } from './native'
import {
  findCSSBlockEnd,
  findCSSClosingQuote,
  findCSSStatementEnd,
  isCSSIdentStart,
  readCSSIdent,
  skipCSSWhitespace
} from '@master/css-lexer'

export const MANAGED_DEFINITION_DIRECTIVES = new Set(['defaults', 'components', 'utilities'])

function isManagedPatternValueChar(char: string | undefined) {
  return Boolean(char && /[-_a-zA-Z0-9]/.test(char))
}

function readManagedPatternValue(source: string, index: number) {
  const start = index
  while (isManagedPatternValueChar(source[index])) index++
  return {
    start,
    end: index,
    value: source.slice(start, index)
  }
}

function tokenizeManagedPlainEntryName(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
  const nameStart = skipCSSWhitespace(source, start)
  const nameEnd = trimEnd(source, nameStart, end)
  if (nameEnd > nameStart) {
    pushHighlightToken(tokens, nameStart, nameEnd - nameStart, 'class', 'selector.class', ['selector'])
  }
}

function trimEnd(source: string, start: number, end: number) {
  while (end > start && /\s/.test(source[end - 1] || '')) end--
  return end
}

function tokenizeManagedEnumPatternName(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
  const pattern = source.slice(start, end)
  const open = pattern.indexOf('<')
  const close = pattern.lastIndexOf('>')
  if (open === -1 || close === -1 || close < open) {
    tokenizeManagedPlainEntryName(source, start, end, tokens)
    return
  }
  const prefixStart = skipCSSWhitespace(source, start)
  const openOffset = start + open
  if (openOffset > prefixStart) {
    pushHighlightToken(tokens, prefixStart, openOffset - prefixStart, 'class', 'selector.class', ['selector'])
  }
  pushHighlightToken(tokens, openOffset, 1, 'operator', 'selector.punctuation', ['selector'])
  for (let cursor = openOffset + 1; cursor < start + close;) {
    cursor = skipCSSWhitespace(source, cursor)
    const char = source[cursor]
    if (char === '|') {
      pushHighlightToken(tokens, cursor, 1, 'operator', 'selector.punctuation', ['selector'])
      cursor++
      continue
    }
    const value = readManagedPatternValue(source, cursor)
    if (value.value) {
      pushHighlightToken(tokens, value.start, value.value.length, 'enumMember', 'selector.class', ['selector'])
      cursor = value.end
      continue
    }
    cursor++
  }
  pushHighlightToken(tokens, start + close, 1, 'operator', 'selector.punctuation', ['selector'])
}

function tokenizeManagedDynamicPatternName(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
  const pattern = source.slice(start, end)
  const open = pattern.indexOf('<')
  const close = pattern.lastIndexOf('>')
  if (open === -1 || close === -1 || close < open) {
    tokenizeManagedPlainEntryName(source, start, end, tokens)
    return
  }

  const keyStart = skipCSSWhitespace(source, start)
  const openOffset = start + open
  const closeOffset = start + close
  const colonOffset = source.lastIndexOf(':', openOffset)
  if (colonOffset <= keyStart) {
    tokenizeManagedEnumPatternName(source, start, end, tokens)
    return
  }

  pushHighlightToken(tokens, keyStart, colonOffset - keyStart, 'property', 'declaration.property')
  pushHighlightToken(tokens, colonOffset, 1, 'operator', 'declaration.separator')
  pushHighlightToken(tokens, openOffset, 1, 'operator', 'directive.parameter', ['directive'])

  for (let cursor = openOffset + 1; cursor < closeOffset;) {
    cursor = skipCSSWhitespace(source, cursor)
    const char = source[cursor]
    if (char === '|' || char === '~' || char === '=' || char === '*') {
      pushHighlightToken(tokens, cursor, 1, 'operator', 'directive.parameter', ['directive'])
      cursor++
      if (char === '~' || char === '=') {
        const namespace = readManagedPatternValue(source, cursor)
        if (namespace.value) {
          pushHighlightToken(tokens, namespace.start, namespace.value.length, 'variable', 'directive.parameter', ['directive'])
          cursor = namespace.end
        }
      }
      continue
    }
    const value = readManagedPatternValue(source, cursor)
    if (value.value) {
      pushHighlightToken(tokens, value.start, value.value.length, 'enumMember', 'directive.parameter', ['directive'])
      cursor = value.end
      continue
    }
    cursor++
  }

  pushHighlightToken(tokens, closeOffset, 1, 'operator', 'directive.parameter', ['directive'])
}

function tokenizeManagedEntryName(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
  const name = source.slice(start, end)
  if (name.includes('<') || name.includes('>')) {
    if (name.slice(0, name.indexOf('<')).includes(':')) {
      tokenizeManagedDynamicPatternName(source, start, end, tokens)
    } else {
      tokenizeManagedEnumPatternName(source, start, end, tokens)
    }
    return
  }

  tokenizeManagedPlainEntryName(source, start, end, tokens)
}

function tokenizeManagedEntryBody(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
  for (let index = start; index < end; index++) {
    const char = source[index]
    const next = source[index + 1]
    if (/\s/.test(char)) continue
    if (char === '/' && next === '*') {
      const close = source.indexOf('*/', index + 2)
      index = close === -1 ? end : close + 1
      continue
    }
    if (char === '"' || char === '\'') {
      index = findCSSClosingQuote(source, index, char, end)
      continue
    }

    const statementEnd = findCSSStatementEnd(source, index)
    if (statementEnd.end > end) break

    if (char === '@') {
      if (statementEnd.reason === 'block' && statementEnd.delimiterRange) {
        const blockStart = statementEnd.delimiterRange.start
        const blockEnd = findCSSBlockEnd(source, blockStart)
        const contentEnd = blockEnd === -1 ? end : Math.min(blockEnd, end)
        tokenizeManagedEntryBody(source, blockStart + 1, contentEnd, tokens)
        index = blockEnd === -1 ? end : blockEnd
        continue
      }
      index = Math.max(index, Math.min(statementEnd.end, end) - 1)
      continue
    }

    if (statementEnd.reason === 'block' && statementEnd.delimiterRange) {
      const blockStart = statementEnd.delimiterRange.start
      const blockEnd = findCSSBlockEnd(source, blockStart)
      const contentEnd = blockEnd === -1 ? end : Math.min(blockEnd, end)
      tokenizeManagedEntryBody(source, blockStart + 1, contentEnd, tokens)
      index = blockEnd === -1 ? end : blockEnd
      continue
    }

    tokenizeDeclarations(source, index, Math.min(statementEnd.end, end), tokens)
    index = Math.max(index, Math.min(statementEnd.end, end) - 1)
  }
}

export function tokenizeManagedDefinitionBlock(source: string, start: number, end: number, tokens: HighlightTokenItem[]) {
  for (let index = start; index < end; index++) {
    const char = source[index]
    const next = source[index + 1]
    if (char === '/' && next === '*') {
      const close = source.indexOf('*/', index + 2)
      index = close === -1 ? end : close + 1
      continue
    }
    if (char === '"' || char === '\'') {
      index = findCSSClosingQuote(source, index, char, end)
      continue
    }
    if (char === '@') {
      const atName = readCSSIdent(source, index + 1)
      const statementEnd = findCSSStatementEnd(source, atName.end)
      if (statementEnd.reason === 'block') {
        const blockStart = statementEnd.end
        const blockEnd = findCSSBlockEnd(source, blockStart)
        if (blockEnd === -1) {
          tokenizeManagedDefinitionBlock(source, blockStart + 1, end, tokens)
          break
        }
        tokenizeManagedDefinitionBlock(source, blockStart + 1, blockEnd, tokens)
        index = blockEnd
      } else {
        index = statementEnd.end - 1
      }
      continue
    }
    if (isCSSIdentStart(char)) {
      const ident = readCSSIdent(source, index)
      const statementEnd = findCSSStatementEnd(source, index)
      const blockStart = statementEnd.reason === 'block' ? statementEnd.delimiterRange?.start : -1
      if (blockStart !== undefined && blockStart !== -1) {
        let nameEnd = blockStart
        while (nameEnd > ident.start && /\s/.test(source[nameEnd - 1] || '')) nameEnd--
        tokenizeManagedEntryName(source, ident.start, nameEnd, tokens)
        const blockEnd = findCSSBlockEnd(source, blockStart)
        tokenizeManagedEntryBody(source, blockStart + 1, blockEnd === -1 ? end : Math.min(blockEnd, end), tokens)
        index = blockEnd === -1 ? end : blockEnd
        continue
      }
      const blockStartAfterIdent = skipCSSWhitespace(source, ident.end)
      if (source[blockStartAfterIdent] === '{') {
        tokenizeManagedEntryName(source, ident.start, ident.end, tokens)
        const blockEnd = findCSSBlockEnd(source, blockStartAfterIdent)
        tokenizeManagedEntryBody(source, blockStartAfterIdent + 1, blockEnd === -1 ? end : Math.min(blockEnd, end), tokens)
        index = blockEnd === -1 ? end : blockEnd
        continue
      }
      index = ident.end - 1
    }
  }
}
