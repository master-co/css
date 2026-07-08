import { expect, test } from 'vitest'
import {
  collectMasterCSSClassListTokenRanges,
  parseMasterCSSClassList,
  tokenizeMasterCSSAtQuery,
  tokenizeMasterCSSGroupedClassToken,
  tokenizeMasterCSSState,
  tokenizeMasterCSSValue,
  type MasterCSSLexicalTokenItem
} from '../src'

function texts(source: string, tokens: MasterCSSLexicalTokenItem[]) {
  return tokens.map((token) => ({
    text: source.slice(token.start, token.end),
    type: token.type,
    role: token.role,
    modifiers: token.modifiers
  }))
}

test.concurrent('parses class lists with ASCII whitespace ranges', () => {
  expect(parseMasterCSSClassList('  block\tfg:red\nm:1x ', { preserveSpaces: true })).toEqual([
    { type: 'space', start: 0, end: 2, raw: '  ', token: '  ' },
    { type: 'class', start: 2, end: 7, raw: 'block', token: 'block' },
    { type: 'space', start: 7, end: 8, raw: '\t', token: '\t' },
    { type: 'class', start: 8, end: 14, raw: 'fg:red', token: 'fg:red' },
    { type: 'space', start: 14, end: 15, raw: '\n', token: '\n' },
    { type: 'class', start: 15, end: 19, raw: 'm:1x', token: 'm:1x' },
    { type: 'space', start: 19, end: 20, raw: ' ', token: ' ' }
  ])
})

test.concurrent('does not split class lists on full-width whitespace', () => {
  expect(parseMasterCSSClassList('block\u3000fg:red')).toEqual([
    { type: 'class', start: 0, end: 12, raw: 'block\u3000fg:red', token: 'block\u3000fg:red' }
  ])
})

test.concurrent('parses empty class positions for cursor contexts', () => {
  expect(parseMasterCSSClassList('a  b ', { includeEmpty: true }).filter((item) => item.type === 'class')).toEqual([
    { type: 'class', start: 0, end: 1, raw: 'a', token: 'a' },
    { type: 'class', start: 1, end: 1, raw: '', token: '' },
    { type: 'class', start: 2, end: 2, raw: '', token: '' },
    { type: 'class', start: 3, end: 4, raw: 'b', token: 'b' },
    { type: 'class', start: 4, end: 4, raw: '', token: '' },
    { type: 'class', start: 5, end: 5, raw: '', token: '' }
  ])
})

test.concurrent('unescapes configured quote characters in class list tokens', () => {
  expect(parseMasterCSSClassList("content:\\'\\' block", { unescape: '\'' })).toEqual([
    { type: 'class', start: 0, end: 12, raw: "content:\\'\\'", token: 'content:\'\'' },
    { type: 'class', start: 13, end: 18, raw: 'block', token: 'block' }
  ])
  expect(parseMasterCSSClassList('content:\\`\\`', { unescape: '`' })[0]).toEqual({
    type: 'class',
    start: 0,
    end: 12,
    raw: 'content:\\`\\`',
    token: 'content:``'
  })
})

test.concurrent('collects class list token ranges through the shared parser', () => {
  expect(collectMasterCSSClassListTokenRanges(' block  fg:red\u3000m:1x ')).toEqual([
    { start: 1, end: 6, token: 'block' },
    { start: 8, end: 19, token: 'fg:red\u3000m:1x' }
  ])
})

test.concurrent('tokenizes values without depending on core utilities', () => {
  const source = '12px/$space url("/a;b.png")!'
  expect(texts(source, tokenizeMasterCSSValue(source, 0, {
    isKnownVariable: (name) => name === '$space'
  }))).toEqual([
    { text: '12', type: 'number', role: 'value.number', modifiers: undefined },
    { text: 'px', type: 'enumMember', role: 'value.unit', modifiers: ['unit'] },
    { text: '/', type: 'operator', role: 'value.separator', modifiers: undefined },
    { text: '$space', type: 'variable', role: 'value.variable', modifiers: undefined },
    { text: 'url', type: 'function', role: 'value.function.name', modifiers: undefined },
    { text: '(', type: 'operator', role: 'value.function.punctuation', modifiers: undefined },
    { text: '"', type: 'string', role: 'value.string.quote', modifiers: ['quoted'] },
    { text: '/a;b.png', type: 'string', role: 'value.string', modifiers: ['quoted'] },
    { text: '"', type: 'string', role: 'value.string.quote', modifiers: ['quoted'] },
    { text: ')', type: 'operator', role: 'value.function.punctuation', modifiers: undefined },
    { text: '!', type: 'operator', role: 'value.important', modifiers: ['important'] }
  ])
})

test.concurrent('tokenizes managed value placeholders as CSS functions', () => {
  const source = '--value() calc(--value() * -1)'
  expect(texts(source, tokenizeMasterCSSValue(source, 0))).toEqual([
    { text: '--value', type: 'function', role: 'value.function.name', modifiers: undefined },
    { text: '(', type: 'operator', role: 'value.function.punctuation', modifiers: undefined },
    { text: ')', type: 'operator', role: 'value.function.punctuation', modifiers: undefined },
    { text: 'calc', type: 'function', role: 'value.function.name', modifiers: undefined },
    { text: '(', type: 'operator', role: 'value.function.punctuation', modifiers: undefined },
    { text: '--value', type: 'function', role: 'value.function.name', modifiers: undefined },
    { text: '(', type: 'operator', role: 'value.function.punctuation', modifiers: undefined },
    { text: ')', type: 'operator', role: 'value.function.punctuation', modifiers: undefined },
    { text: '*', type: 'operator', role: 'value.operator', modifiers: undefined },
    { text: '-', type: 'operator', role: 'value.operator', modifiers: undefined },
    { text: '1', type: 'number', role: 'value.number', modifiers: undefined },
    { text: ')', type: 'operator', role: 'value.function.punctuation', modifiers: undefined }
  ])
})

test.concurrent('tokenizes at queries and selector state', () => {
  const source = '@sm>=640:hover>.item'
  expect(texts(source, [
    ...tokenizeMasterCSSAtQuery(source.slice(0, 8), 0),
    ...tokenizeMasterCSSState(source, 8, 0)
  ])).toEqual([
    { text: '@sm', type: 'keyword', role: 'query.keyword', modifiers: ['query'] },
    { text: '>=', type: 'operator', role: 'query.operator', modifiers: ['query'] },
    { text: '640', type: 'number', role: 'query.number', modifiers: ['query'] },
    { text: ':', type: 'operator', role: 'selector.pseudoClass.delimiter', modifiers: ['selector', 'pseudoClass'] },
    { text: 'hover', type: 'modifier', role: 'selector.pseudoClass.name', modifiers: ['pseudoClass'] },
    { text: '>', type: 'operator', role: 'selector.combinator', modifiers: ['selector'] },
    { text: '.', type: 'operator', role: 'selector.punctuation', modifiers: ['selector'] },
    { text: 'item', type: 'class', role: 'selector.class', modifiers: ['selector'] }
  ])
})

test.concurrent('tokenizes native-like query and selector punctuation roles', () => {
  const source = '@media(pointer:coarse),screen_:is(.active,#target,button)'
  const stateStart = source.indexOf('_')
  expect(texts(source, [
    ...tokenizeMasterCSSAtQuery(source.slice(0, stateStart), 0),
    ...tokenizeMasterCSSState(source, stateStart, 0)
  ])).toEqual([
    { text: '@media', type: 'keyword', role: 'query.keyword', modifiers: ['query'] },
    { text: '(', type: 'operator', role: 'query.punctuation', modifiers: ['query'] },
    { text: 'pointer', type: 'property', role: 'query.feature', modifiers: ['query'] },
    { text: ':', type: 'operator', role: 'query.punctuation', modifiers: ['query'] },
    { text: 'coarse', type: 'enumMember', role: 'query.value', modifiers: ['query'] },
    { text: ')', type: 'operator', role: 'query.punctuation', modifiers: ['query'] },
    { text: ',', type: 'operator', role: 'query.punctuation', modifiers: ['query'] },
    { text: 'screen', type: 'enumMember', role: 'query.value', modifiers: ['query'] },
    { text: '_', type: 'operator', role: 'selector.combinator', modifiers: ['selector'] },
    { text: ':', type: 'operator', role: 'selector.pseudoClass.delimiter', modifiers: ['selector', 'pseudoClass'] },
    { text: 'is', type: 'modifier', role: 'selector.pseudoClass.name', modifiers: ['pseudoClass'] },
    { text: '(', type: 'operator', role: 'selector.punctuation', modifiers: ['selector'] },
    { text: '.', type: 'operator', role: 'selector.punctuation', modifiers: ['selector'] },
    { text: 'active', type: 'class', role: 'selector.class', modifiers: ['selector'] },
    { text: ',', type: 'operator', role: 'selector.punctuation', modifiers: ['selector'] },
    { text: '#', type: 'operator', role: 'selector.punctuation', modifiers: ['selector'] },
    { text: 'target', type: 'variable', role: 'selector.id', modifiers: ['selector'] },
    { text: ',', type: 'operator', role: 'selector.punctuation', modifiers: ['selector'] },
    { text: 'button', type: 'type', role: 'selector.type', modifiers: ['selector'] },
    { text: ')', type: 'operator', role: 'selector.punctuation', modifiers: ['selector'] }
  ])
})

test.concurrent('tokenizes named query ranges with matching endpoint values', () => {
  const source = '@sm&<=md'
  expect(texts(source, tokenizeMasterCSSAtQuery(source, 0))).toEqual([
    { text: '@', type: 'keyword', role: 'query.keyword', modifiers: ['query'] },
    { text: 'sm', type: 'enumMember', role: 'query.value', modifiers: ['query'] },
    { text: '&', type: 'operator', role: 'query.operator', modifiers: ['query'] },
    { text: '<=', type: 'operator', role: 'query.operator', modifiers: ['query'] },
    { text: 'md', type: 'enumMember', role: 'query.value', modifiers: ['query'] }
  ])
})

test.concurrent('tokenizes grouped class shell without parsing class semantics', () => {
  const source = '{fg:red;bg:blue}'
  const tokens = tokenizeMasterCSSGroupedClassToken(source, 0, (token, offset) => [
    { start: offset, end: offset + token.length, type: 'class', role: 'utility.semantic' }
  ])

  expect(texts(source, tokens ?? [])).toEqual([
    { text: '{', type: 'operator', role: 'block.brace', modifiers: undefined },
    { text: 'fg:red', type: 'class', role: 'utility.semantic', modifiers: undefined },
    { text: ';', type: 'operator', role: 'declaration.terminator', modifiers: undefined },
    { text: 'bg:blue', type: 'class', role: 'utility.semantic', modifiers: undefined },
    { text: '}', type: 'operator', role: 'block.brace', modifiers: undefined }
  ])
})

test.concurrent('tokenizes grouped class suffix as selector and query state', () => {
  const source = '{fg:red;block}>li:hover@sm'
  const tokens = tokenizeMasterCSSGroupedClassToken(source, 0, (token, offset) => [
    { start: offset, end: offset + token.length, type: 'class', role: 'utility.semantic' }
  ])

  expect(texts(source, tokens ?? [])).toEqual([
    { text: '{', type: 'operator', role: 'block.brace', modifiers: undefined },
    { text: 'fg:red', type: 'class', role: 'utility.semantic', modifiers: undefined },
    { text: ';', type: 'operator', role: 'declaration.terminator', modifiers: undefined },
    { text: 'block', type: 'class', role: 'utility.semantic', modifiers: undefined },
    { text: '}', type: 'operator', role: 'block.brace', modifiers: undefined },
    { text: '>', type: 'operator', role: 'selector.combinator', modifiers: ['selector'] },
    { text: 'li', type: 'type', role: 'selector.type', modifiers: ['selector'] },
    { text: ':', type: 'operator', role: 'selector.pseudoClass.delimiter', modifiers: ['selector', 'pseudoClass'] },
    { text: 'hover', type: 'modifier', role: 'selector.pseudoClass.name', modifiers: ['pseudoClass'] },
    { text: '@sm', type: 'keyword', role: 'query.keyword', modifiers: ['query'] }
  ])
})

test.concurrent('tokenizes grouped class query suffix', () => {
  const source = '{block}@sm'
  const tokens = tokenizeMasterCSSGroupedClassToken(source, 0, (token, offset) => [
    { start: offset, end: offset + token.length, type: 'class', role: 'utility.semantic' }
  ])

  expect(texts(source, tokens ?? [])).toEqual([
    { text: '{', type: 'operator', role: 'block.brace', modifiers: undefined },
    { text: 'block', type: 'class', role: 'utility.semantic', modifiers: undefined },
    { text: '}', type: 'operator', role: 'block.brace', modifiers: undefined },
    { text: '@sm', type: 'keyword', role: 'query.keyword', modifiers: ['query'] }
  ])
})

test.concurrent('preserves grouped class recovery without closing braces', () => {
  const source = '{fg:red;bg:blue'
  const tokens = tokenizeMasterCSSGroupedClassToken(source, 0, (token, offset) => [
    { start: offset, end: offset + token.length, type: 'class', role: 'utility.semantic' }
  ])

  expect(texts(source, tokens ?? [])).toEqual([
    { text: '{', type: 'operator', role: 'block.brace', modifiers: undefined },
    { text: 'fg:red', type: 'class', role: 'utility.semantic', modifiers: undefined },
    { text: ';', type: 'operator', role: 'declaration.terminator', modifiers: undefined },
    { text: 'bg:blue', type: 'class', role: 'utility.semantic', modifiers: undefined }
  ])
})

test.concurrent('preserves brace-less grouped declarations', () => {
  const source = 'fg:red;bg:blue'
  const tokens = tokenizeMasterCSSGroupedClassToken(source, 0, (token, offset) => [
    { start: offset, end: offset + token.length, type: 'class', role: 'utility.semantic' }
  ])

  expect(texts(source, tokens ?? [])).toEqual([
    { text: 'fg:red', type: 'class', role: 'utility.semantic', modifiers: undefined },
    { text: ';', type: 'operator', role: 'declaration.terminator', modifiers: undefined },
    { text: 'bg:blue', type: 'class', role: 'utility.semantic', modifiers: undefined }
  ])
})
