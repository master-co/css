import { expect, test } from 'vitest'

import {
    createMasterCSSShikiSemanticTokenDecorations,
    transformerMasterCSSSemanticTokens,
    type MasterCSSShikiCodeToHastOptions
} from '../src/shiki'
import type { Settings } from '../src/settings'

const config: Settings['config'] = {
    variables: [{ key: 'brand', value: '#123456' }],
    utilities: [
        {
            name: 'btn',
            type: -4,
            layer: 'main',
            rules: [
                { selector: '&', declarations: { display: 'block' } }
            ]
        }
    ]
}

test.concurrent('creates Shiki decorations from Master CSS semantic tokens', () => {
    const code = '<div className="fg:brand:hover@sm block btn btn:hover@sm btn_div::before"></div>'
    const decorations = createMasterCSSShikiSemanticTokenDecorations(code, {
        lang: 'tsx',
        config
    })
    const tokens = decorations.map((decoration) => ({
        text: code.slice(decoration.start, decoration.end),
        type: decoration.type,
        modifiers: decoration.modifiers,
        classNames: decoration.properties?.class
    }))

    expect(tokens).toEqual(expect.arrayContaining([
        {
            text: 'fg',
            type: 'property',
            modifiers: [],
            classNames: ['mcss-semantic', 'mcss-semantic-property']
        },
        {
            text: 'brand',
            type: 'variable',
            modifiers: [],
            classNames: ['mcss-semantic', 'mcss-semantic-variable']
        },
        {
            text: 'block',
            type: 'class',
            modifiers: [],
            classNames: ['mcss-semantic', 'mcss-semantic-class']
        },
        {
            text: 'btn',
            type: 'class',
            modifiers: ['declaration'],
            classNames: ['mcss-semantic', 'mcss-semantic-class', 'mcss-semantic-class-declaration']
        },
        {
            text: 'div',
            type: 'type',
            modifiers: [],
            classNames: ['mcss-semantic', 'mcss-semantic-type']
        },
        {
            text: 'before',
            type: 'modifier',
            modifiers: [],
            classNames: ['mcss-semantic', 'mcss-semantic-modifier']
        },
        {
            text: '@sm',
            type: 'keyword',
            modifiers: [],
            classNames: ['mcss-semantic', 'mcss-semantic-keyword']
        }
    ]))
    expect(tokens.filter(({ text, type, modifiers }) => text === 'btn' && type === 'class' && modifiers.includes('declaration'))).toHaveLength(3)
})

test.concurrent('applies semantic token styles by type and modifier', () => {
    const code = 'block block:hover btn:hover'
    const decorations = createMasterCSSShikiSemanticTokenDecorations(code, {
        lang: 'mcss',
        config,
        semanticTokenStyles: {
            class: {
                color: 'var(--mcss-semantic-class)',
                '--shiki-dark': 'var(--mcss-semantic-class-dark)'
            },
            'class.declaration': {
                'font-weight': '600'
            }
        }
    })
    const classDecorations = decorations.filter((decoration) => decoration.type === 'class')
    const blockStyles = classDecorations
        .filter((decoration) => code.slice(decoration.start, decoration.end) === 'block')
        .map((decoration) => decoration.properties?.style)
    const btnStyle = classDecorations.find((decoration) => code.slice(decoration.start, decoration.end) === 'btn')?.properties?.style

    expect(blockStyles).toEqual([
        'color:var(--mcss-semantic-class);--shiki-dark:var(--mcss-semantic-class-dark)',
        'color:var(--mcss-semantic-class);--shiki-dark:var(--mcss-semantic-class-dark)'
    ])
    expect(btnStyle).toBe('color:var(--mcss-semantic-class);--shiki-dark:var(--mcss-semantic-class-dark);font-weight:600')
})

test.concurrent('applies semantic decorations in the Shiki tokens hook', () => {
    const code = '<div className="btn:hover@sm"></div>'
    const options: MasterCSSShikiCodeToHastOptions = {
        lang: 'tsx',
        decorations: [
            { start: 0, end: 0, properties: { class: 'existing-decoration' } }
        ]
    }
    const transformer = transformerMasterCSSSemanticTokens({
        config,
        classPrefix: 'master-css-token',
        dataAttributes: false,
        semanticTokenStyles: {
            'class.declaration': {
                'font-weight': '600'
            }
        }
    })

    const transformedTokens = transformer.tokens.call({ source: code, options }, [[{ content: code, offset: 0 }]])
    const semanticTokens = transformedTokens?.flat().filter((token) => token.htmlAttrs?.class)

    expect(options.decorations?.[0]?.properties?.class).toBe('existing-decoration')
    expect(options.decorations).toHaveLength(1)
    expect(semanticTokens).toEqual(expect.arrayContaining([
        expect.objectContaining({
            content: 'btn',
            htmlAttrs: {
                class: 'master-css-token master-css-token-class master-css-token-class-declaration'
            },
            htmlStyle: {
                'font-weight': '600'
            }
        }),
        expect.objectContaining({
            content: 'hover',
            htmlAttrs: {
                class: 'master-css-token master-css-token-modifier'
            },
            htmlStyle: {}
        })
    ]))
})

test.concurrent('uses native CSS syntax styles for selector semantic tokens', () => {
    const code = 'block>li:hover@md'
    const options: MasterCSSShikiCodeToHastOptions = {
        lang: 'mcss'
    }
    const transformer = transformerMasterCSSSemanticTokens()
    const transformedTokens = transformer.tokens.call({
        source: code,
        options,
        codeToTokens: () => ({
            tokens: [[
                { content: 'div', offset: 0, htmlStyle: { color: 'type' } },
                { content: '>', offset: 3, htmlStyle: { color: 'selector-operator' } },
                { content: 'li', offset: 4, htmlStyle: { color: 'type' } },
                { content: ':', offset: 6, htmlStyle: { color: 'pseudo-operator' } },
                { content: 'hover', offset: 7, htmlStyle: { color: 'modifier' } }
            ]]
        })
    }, [[{ content: code, offset: 0, htmlStyle: { color: 'key' } }]])
    const tokens = transformedTokens?.flat().map((token) => ({
        content: token.content,
        htmlStyle: token.htmlStyle,
        className: token.htmlAttrs?.class
    }))

    expect(tokens).toEqual(expect.arrayContaining([
        {
            content: 'block',
            htmlStyle: { color: 'key' },
            className: 'mcss-semantic mcss-semantic-class'
        },
        {
            content: '>',
            htmlStyle: { color: 'selector-operator' },
            className: 'mcss-semantic mcss-semantic-operator'
        },
        {
            content: 'li',
            htmlStyle: { color: 'type' },
            className: 'mcss-semantic mcss-semantic-type'
        },
        {
            content: ':',
            htmlStyle: { color: 'pseudo-operator' },
            className: 'mcss-semantic mcss-semantic-operator'
        },
        {
            content: 'hover',
            htmlStyle: { color: 'modifier' },
            className: 'mcss-semantic mcss-semantic-modifier'
        }
    ]))
})
