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
            type: -4,
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

test.concurrent('collects browser semantic tokens for HTML class attributes', () => {
    const source = '<div class="fg:brand block btn"></div>'
    const tokens = collectBrowserSemanticTokenItems(source, 'html', { plan })
    const mapped = tokens.map((token) => ({
        text: tokenText(source, token),
        type: token.type,
        modifiers: token.modifiers || []
    }))

    expect(mapped).toEqual(expect.arrayContaining([
        { text: 'fg', type: 'property', modifiers: [] },
        { text: 'brand', type: 'variable', modifiers: [] },
        { text: 'block', type: 'class', modifiers: [] },
        { text: 'btn', type: 'class', modifiers: ['declaration', 'component'] }
    ]))
})

test.concurrent('collects browser semantic tokens for CSS directives', () => {
    const source = `
        @theme {
            --color-brand: #123;
        }

        @components {
            btn {
                @compose block;
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
        { text: '@compose', type: 'keyword', modifiers: ['directive'] },
        { text: 'block', type: 'class', modifiers: [] }
    ]))
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
