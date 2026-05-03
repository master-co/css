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
        '<div className="fg:brand:hover@sm block m:4x bg:rgb(0|0|0) btn"></div>',
        'tsx',
        {
            config: {
                variables: {
                    brand: '#123456'
                },
                components: {
                    btn: 'fg:brand block'
                }
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
        { text: '4x', type: 'number', modifiers: [] },
        { text: 'rgb', type: 'function', modifiers: [] },
        { text: 'btn', type: 'class', modifiers: ['declaration'] }
    ]))
})

test.concurrent('renders semantic tokens for master-css documents', () => {
    const { tokens } = renderTokens('fg:brand block', 'mcss', {
        config: {
            variables: {
                brand: '#123456'
            }
        }
    })

    expect(tokens).toEqual(expect.arrayContaining([
        { text: 'fg', type: 'property', modifiers: [] },
        { text: 'brand', type: 'variable', modifiers: [] },
        { text: 'block', type: 'class', modifiers: [] }
    ]))
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
