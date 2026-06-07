import { expect, test } from 'vitest'

import CSSLanguageService from '../src/core'
import createDoc from '../src/utils/create-doc'
import { SEMANTIC_TOKEN_MODIFIERS, SEMANTIC_TOKEN_TYPES } from '../src'

function decodeSemanticTokens(doc: ReturnType<typeof createDoc>, data: number[]) {
    const tokens: { text: string, type: string, modifiers: string[] }[] = []
    let line = 0
    let character = 0
    for (let i = 0; i < data.length; i += 5) {
        const deltaLine = data[i]
        const deltaStart = data[i + 1]
        line += deltaLine
        character = deltaLine === 0 ? character + deltaStart : deltaStart
        const length = data[i + 2]
        const type = SEMANTIC_TOKEN_TYPES[data[i + 3]]
        const modifierBits = data[i + 4]
        const start = doc.offsetAt({ line, character })
        const end = doc.offsetAt({ line, character: character + length })
        tokens.push({
            text: doc.getText().slice(start, end),
            type,
            modifiers: SEMANTIC_TOKEN_MODIFIERS.filter((_, index) => modifierBits & (1 << index))
        })
    }
    return tokens
}

function renderTokens(content: string, ext: Parameters<typeof createDoc>[0] = 'tsx', settings?: ConstructorParameters<typeof CSSLanguageService>[0]) {
    const doc = createDoc(ext, content)
    const languageService = new CSSLanguageService(settings)
    const semanticTokens = languageService.renderSemanticTokens(doc)
    return {
        doc,
        tokens: decodeSemanticTokens(doc, semanticTokens?.data ?? [])
    }
}

test.concurrent('renders semantic tokens for class attributes', () => {
    const { tokens } = renderTokens(
        '<div className="fg:brand:hover@sm block block:hover block:state-name hidden_div::before:of(.active) m:4x bg:rgb(0|0|0) w:10::scrollbar btn btn:hover@sm btn_div::before"></div>',
        'tsx',
        {
            config: {
                variables: [{ key: 'brand', value: '#123456' }],
                utilities: [
                    {
                        name: 'btn',
                        type: -4,
                        layer: 'components',
                        rules: [
                            { selector: '&', declarations: { color: 'var(--brand)' } },
                            { selector: '&', declarations: { display: 'block' } }
                        ]
                    }
                ]
            }
        }
    )

    expect(tokens).toEqual(expect.arrayContaining([
        { text: 'fg', type: 'property', modifiers: [] },
        { text: ':', type: 'operator', modifiers: [] },
        { text: 'brand', type: 'variable', modifiers: [] },
        { text: 'hover', type: 'modifier', modifiers: [] },
        { text: '@sm', type: 'keyword', modifiers: [] },
        { text: 'block', type: 'class', modifiers: [] },
        { text: ':', type: 'operator', modifiers: [] },
        { text: 'state-name', type: 'modifier', modifiers: [] },
        { text: 'hidden', type: 'class', modifiers: [] },
        { text: '_', type: 'operator', modifiers: [] },
        { text: 'div', type: 'type', modifiers: [] },
        { text: '::', type: 'operator', modifiers: [] },
        { text: 'before', type: 'modifier', modifiers: [] },
        { text: 'of', type: 'modifier', modifiers: [] },
        { text: '.', type: 'operator', modifiers: [] },
        { text: 'active', type: 'class', modifiers: [] },
        { text: '4x', type: 'number', modifiers: [] },
        { text: 'rgb', type: 'function', modifiers: [] },
        { text: '::', type: 'operator', modifiers: [] },
        { text: 'scrollbar', type: 'modifier', modifiers: [] },
        { text: 'btn', type: 'class', modifiers: ['declaration'] }
    ]))
    expect(tokens.filter(({ text, type, modifiers }) => text === 'btn' && type === 'class' && modifiers.includes('declaration'))).toHaveLength(3)
})

test.concurrent('renders semantic tokens for master-css documents', () => {
    const { tokens } = renderTokens('fg:brand block', 'mcss', {
        config: {
            variables: [{ key: 'brand', value: '#123456' }]
        }
    })

    expect(tokens).toEqual(expect.arrayContaining([
        { text: 'fg', type: 'property', modifiers: [] },
        { text: 'brand', type: 'variable', modifiers: [] },
        { text: 'block', type: 'class', modifiers: [] }
    ]))
})

test.concurrent('renders semantic tokens for CSS-like values', () => {
    const { tokens } = renderTokens(
        '<div className="h:$size-sm fg:$color-blue-50/.5 content:x::before bg:rgb(0|0|0) fg:red_:where(a:hover) font:mono_:is(code,pre)@base font:semibold_:headings font:semibold_:is(h1,h2,h3,h4,h5,h6)"></div>',
        'tsx',
        {
            config: {
                variables: [
                    { key: 'size-sm', value: 16 },
                    { namespace: 'color', key: 'blue-50', value: 'oklch(60% 0.2 250)' }
                ]
            }
        }
    )

    expect(tokens).toEqual(expect.arrayContaining([
        { text: '$size-sm', type: 'variable', modifiers: [] },
        { text: '$color-blue-50', type: 'variable', modifiers: [] },
        { text: '/', type: 'operator', modifiers: [] },
        { text: '.5', type: 'number', modifiers: [] },
        { text: 'x', type: 'string', modifiers: [] },
        { text: '::', type: 'operator', modifiers: [] },
        { text: 'before', type: 'modifier', modifiers: [] },
        { text: 'rgb', type: 'function', modifiers: [] },
        { text: '|', type: 'operator', modifiers: [] },
        { text: '_', type: 'operator', modifiers: [] },
        { text: 'where', type: 'modifier', modifiers: [] },
        { text: '(', type: 'operator', modifiers: [] },
        { text: 'a', type: 'type', modifiers: [] },
        { text: 'hover', type: 'modifier', modifiers: [] },
        { text: ')', type: 'operator', modifiers: [] },
        { text: 'is', type: 'modifier', modifiers: [] },
        { text: 'code', type: 'type', modifiers: [] },
        { text: ',', type: 'operator', modifiers: [] },
        { text: 'pre', type: 'type', modifiers: [] },
        { text: 'headings', type: 'modifier', modifiers: [] },
        { text: 'h1', type: 'type', modifiers: [] },
        { text: 'h2', type: 'type', modifiers: [] },
        { text: 'h3', type: 'type', modifiers: [] },
        { text: 'h4', type: 'type', modifiers: [] },
        { text: 'h5', type: 'type', modifiers: [] },
        { text: 'h6', type: 'type', modifiers: [] },
        { text: '@base', type: 'keyword', modifiers: [] }
    ]))
})

test.concurrent('renders semantic tokens for container queries and slash-separated string values', () => {
    const { tokens } = renderTokens(
        '<div className="hidden@container(sm&<=md) container:card/inline-size grid-cols:2@card(3xs) bg:center/cover bg:url(/hero.jpg) hidden@media(pointer:coarse) hidden@h>=sm&h<lg"></div>',
        'html'
    )

    expect(tokens).toEqual(expect.arrayContaining([
        { text: 'hidden', type: 'class', modifiers: [] },
        { text: '@container', type: 'keyword', modifiers: [] },
        { text: '(', type: 'operator', modifiers: [] },
        { text: 'sm', type: 'string', modifiers: [] },
        { text: '&', type: 'operator', modifiers: [] },
        { text: '<=', type: 'operator', modifiers: [] },
        { text: 'md', type: 'string', modifiers: [] },
        { text: ')', type: 'operator', modifiers: [] },
        { text: 'container', type: 'property', modifiers: [] },
        { text: 'card', type: 'string', modifiers: [] },
        { text: '/', type: 'operator', modifiers: [] },
        { text: 'inline-size', type: 'string', modifiers: [] },
        { text: 'grid-cols', type: 'property', modifiers: [] },
        { text: '2', type: 'number', modifiers: [] },
        { text: '@card', type: 'keyword', modifiers: [] },
        { text: '3xs', type: 'string', modifiers: [] },
        { text: 'bg', type: 'property', modifiers: [] },
        { text: 'center', type: 'string', modifiers: [] },
        { text: 'cover', type: 'string', modifiers: [] },
        { text: 'url', type: 'function', modifiers: [] },
        { text: '/hero.jpg', type: 'string', modifiers: [] },
        { text: '@media', type: 'keyword', modifiers: [] },
        { text: 'pointer', type: 'property', modifiers: [] },
        { text: 'coarse', type: 'string', modifiers: [] },
        { text: '@h', type: 'keyword', modifiers: [] },
        { text: '>=', type: 'operator', modifiers: [] },
        { text: 'h', type: 'property', modifiers: [] },
        { text: '<', type: 'operator', modifiers: [] },
        { text: 'lg', type: 'string', modifiers: [] }
    ]))
    expect(tokens.filter(({ text, type }) => text === '/' && type === 'operator')).toHaveLength(2)
})

test.concurrent('returns no semantic tokens when disabled', () => {
    const doc = createDoc('tsx', '<div className="fg:red"></div>')
    const languageService = new CSSLanguageService({
        renderSemanticTokens: false
    })

    expect(languageService.renderSemanticTokens(doc)).toBeUndefined()
})

test.concurrent('shares class position detection with semantic token spans', () => {
    const doc = createDoc('tsx', 'const x = clsx("fg:red", condition && `block`)')
    const languageService = new CSSLanguageService()

    expect(languageService.getClassPositions(doc).map((classPosition) => classPosition.token)).toEqual([
        'fg:red',
        'block'
    ])
})
