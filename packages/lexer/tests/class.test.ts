import { expect, test } from 'vitest'
import {
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
        { text: '.', type: 'operator', role: 'selector.class', modifiers: ['selector'] },
        { text: 'item', type: 'class', role: 'selector.class', modifiers: ['selector'] }
    ])
})

test.concurrent('tokenizes grouped class shell without parsing class semantics', () => {
    const source = '{fg:red;bg:blue}'
    const tokens = tokenizeMasterCSSGroupedClassToken(source, 0, (token, offset) => [
        { start: offset, end: offset + token.length, type: 'class', role: 'utility.static' }
    ])

    expect(texts(source, tokens ?? [])).toEqual([
        { text: '{', type: 'operator', role: 'block.brace', modifiers: undefined },
        { text: 'fg:red', type: 'class', role: 'utility.static', modifiers: undefined },
        { text: ';', type: 'operator', role: 'declaration.terminator', modifiers: undefined },
        { text: 'bg:blue', type: 'class', role: 'utility.static', modifiers: undefined },
        { text: '}', type: 'operator', role: 'block.brace', modifiers: undefined }
    ])
})
