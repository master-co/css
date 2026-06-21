import { expect, test } from 'vitest'

import {
    collectBrowserSemanticTokenItems,
    renderBrowserSemanticTokens
} from '../src/browser'
import { SEMANTIC_TOKEN_MODIFIERS, SEMANTIC_TOKEN_TYPES } from '../src/common'
import { createPresetPlan } from './helpers/create-preset-plan'

const plan = createPresetPlan({
    variables: [{ key: 'brand', value: '#123456' }],
    utilities: [
        {
            name: 'btn',
            layer: 'components',
            rules: [
                { selector: '&', declarations: { display: 'block' } }
            ]
        }
    ]
})

function tokenText(source: string, token: { start: number, end: number }) {
    return source.slice(token.start, token.end)
}

function decodeSingleLineBrowserSemanticTokens(source: string, data: ArrayLike<number>) {
    const tokens: { text: string, type: string, modifiers: string[], modifierBits: number }[] = []
    let character = 0
    for (let i = 0; i < data.length; i += 5) {
        expect(data[i]).toBe(0)
        character += data[i + 1]
        const length = data[i + 2]
        const modifierBits = data[i + 4]
        const start = character
        tokens.push({
            text: source.slice(start, start + length),
            type: SEMANTIC_TOKEN_TYPES[data[i + 3]],
            modifiers: SEMANTIC_TOKEN_MODIFIERS.filter((_, index) => modifierBits & (1 << index)),
            modifierBits
        })
    }
    return tokens
}

test.concurrent('collects browser semantic tokens for HTML class attributes', () => {
    const source = '<div class="text-align:center fg:brand block btn"></div>'
    const tokens = collectBrowserSemanticTokenItems(source, 'html', { plan })
    const mapped = tokens.map((token) => ({
        text: tokenText(source, token),
        type: token.type,
        modifiers: token.modifiers || []
    }))

    expect(mapped).toEqual(expect.arrayContaining([
        { text: 'text-align', type: 'property', modifiers: [] },
        { text: 'center', type: 'enumMember', modifiers: [] },
        { text: 'fg', type: 'property', modifiers: [] },
        { text: 'brand', type: 'variable', modifiers: [] },
        { text: 'block', type: 'enumMember', modifiers: [] },
        { text: 'btn', type: 'class', modifiers: ['declaration', 'component'] }
    ]))
})

test.concurrent('encodes browser role-derived semantic token modifiers', () => {
    const source = '<div class="{fg:red;block}>li:hover@sm"></div>'
    const semanticTokens = renderBrowserSemanticTokens(source, 'html', { plan })
    const tokens = decodeSingleLineBrowserSemanticTokens(source, semanticTokens?.data || [])
    const declarationTerminatorIndex = SEMANTIC_TOKEN_MODIFIERS.indexOf('declarationTerminator')
    const selectorCombinatorIndex = SEMANTIC_TOKEN_MODIFIERS.indexOf('selectorCombinator')

    expect(tokens).toEqual(expect.arrayContaining([
        { text: '{', type: 'operator', modifiers: ['blockBrace'], modifierBits: 1 << SEMANTIC_TOKEN_MODIFIERS.indexOf('blockBrace') },
        { text: ':', type: 'operator', modifiers: ['declarationSeparator'], modifierBits: 1 << SEMANTIC_TOKEN_MODIFIERS.indexOf('declarationSeparator') },
        { text: ';', type: 'operator', modifiers: ['declarationTerminator'], modifierBits: 1 << declarationTerminatorIndex },
        { text: '}', type: 'operator', modifiers: ['blockBrace'], modifierBits: 1 << SEMANTIC_TOKEN_MODIFIERS.indexOf('blockBrace') },
        { text: '>', type: 'operator', modifiers: ['selector', 'selectorCombinator'], modifierBits: (1 << SEMANTIC_TOKEN_MODIFIERS.indexOf('selector')) | (1 << selectorCombinatorIndex) },
        { text: ':', type: 'operator', modifiers: ['pseudoClass', 'selector', 'pseudoClassDelimiter'], modifierBits: (1 << SEMANTIC_TOKEN_MODIFIERS.indexOf('pseudoClass')) | (1 << SEMANTIC_TOKEN_MODIFIERS.indexOf('selector')) | (1 << SEMANTIC_TOKEN_MODIFIERS.indexOf('pseudoClassDelimiter')) }
    ]))
    expect(declarationTerminatorIndex).toBeGreaterThan(SEMANTIC_TOKEN_MODIFIERS.indexOf('unit'))
    expect(selectorCombinatorIndex).toBeGreaterThan(SEMANTIC_TOKEN_MODIFIERS.indexOf('unit'))
})

test.concurrent('collects browser semantic tokens for CSS directives', () => {
    const source = `
        @theme {
            --color-brand: var(--brand, #123);

            @keyframes fade {
                to {
                    opacity: 1;
                }
            }
        }

        @components {
            btn {
                @compose block;
                &:hover {
                    color: var(--brand, red);
                }
            }
        }
    `
    const tokens = collectBrowserSemanticTokenItems(source, 'css', { plan })
    const mapped = tokens.map((token) => ({
        text: tokenText(source, token),
        type: token.type,
        modifiers: token.modifiers || []
    }))

    expect(mapped).toEqual(expect.arrayContaining([
        { text: '@theme', type: 'keyword', modifiers: ['directive'] },
        { text: '--color-brand', type: 'variable', modifiers: [] },
        { text: '@components', type: 'keyword', modifiers: ['directive'] },
        { text: 'btn', type: 'class', modifiers: ['selector'] },
        { text: '@compose', type: 'keyword', modifiers: ['directive'] },
        { text: 'block', type: 'enumMember', modifiers: [] }
    ]))
    expect(mapped).not.toContainEqual({ text: 'var', type: 'function', modifiers: [] })
    expect(mapped).not.toContainEqual({ text: '@keyframes', type: 'keyword', modifiers: [] })
})

test.concurrent('collects browser semantic tokens for managed directives and custom variants', () => {
    const source = `
        @custom-variant @motion-safe {
            @media (prefers-reduced-motion: no-preference) {
                @slot;
            }
        }

        @utilities {
            font:<~font-size|number> {
                font-size: --value();

                @light {
                    color: var(--brand);
                }
            }
        }
    `
    const tokens = collectBrowserSemanticTokenItems(source, 'css', { plan })
    const mapped = tokens.map((token) => ({
        text: tokenText(source, token),
        type: token.type,
        modifiers: token.modifiers || []
    }))

    expect(mapped).toEqual(expect.arrayContaining([
        { text: '@custom-variant', type: 'keyword', modifiers: ['directive'] },
        { text: '@motion-safe', type: 'keyword', modifiers: ['query'] },
        { text: '@slot', type: 'keyword', modifiers: ['directive'] },
        { text: '@utilities', type: 'keyword', modifiers: ['directive'] },
        { text: 'font', type: 'property', modifiers: [] },
        { text: 'font-size', type: 'variable', modifiers: ['directive'] },
        { text: 'number', type: 'enumMember', modifiers: ['directive'] },
        { text: '--value', type: 'function', modifiers: [] },
        { text: '@light', type: 'keyword', modifiers: ['directive'] }
    ]))
    expect(mapped).not.toContainEqual({ text: '@media', type: 'keyword', modifiers: ['query'] })
    expect(mapped).not.toContainEqual({ text: 'font-size', type: 'property', modifiers: [] })
})

test.concurrent('encodes browser semantic tokens', () => {
    const source = '<div class="btn"></div>'
    const semanticTokens = renderBrowserSemanticTokens(source, 'html', { plan })
    const data = [...(semanticTokens?.data || [])]
    const typeIndex = SEMANTIC_TOKEN_TYPES.indexOf('class')
    const declarationIndex = SEMANTIC_TOKEN_MODIFIERS.indexOf('declaration')
    const componentIndex = SEMANTIC_TOKEN_MODIFIERS.indexOf('component')

    expect(data).toHaveLength(5)
    expect(data[3]).toBe(typeIndex)
    expect(data[4]).toBe((1 << declarationIndex) | (1 << componentIndex))
})
