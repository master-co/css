import { expect, test } from 'vitest'

import {
    createMasterCSSShikiSemanticTokenDecorations,
    transformerMasterCSSSemanticTokens,
    type MasterCSSShikiCodeToHastOptions
} from '../src/shiki'
import type { Settings } from '../src/settings'
import { createPresetPlan } from './helpers/create-preset-plan'

const plan: Settings['plan'] = createPresetPlan({
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

function syntaxToken(content: string, color: string) {
    return {
        content,
        offset: 0,
        htmlStyle: { color }
    }
}

function nativeCSSSyntaxTokens() {
    return [
        syntaxToken('.x', 'class'),
        syntaxToken(',', 'selector-operator'),
        syntaxToken('div', 'type'),
        syntaxToken('>', 'selector-operator'),
        syntaxToken('li', 'type'),
        syntaxToken(':', 'pseudo-operator'),
        syntaxToken('hover', 'modifier'),
        syntaxToken(':', 'pseudo-element-operator'),
        syntaxToken('before', 'pseudo-element'),
        syntaxToken('{', 'punctuation'),
        syntaxToken('color', 'property'),
        syntaxToken(':', 'declaration-operator'),
        syntaxToken('red', 'value'),
        syntaxToken('!important', 'important'),
        syntaxToken(';', 'punctuation'),
        syntaxToken('width', 'property'),
        syntaxToken(':', 'declaration-operator'),
        syntaxToken('1.5', 'number'),
        syntaxToken('rem', 'unit'),
        syntaxToken(';', 'punctuation'),
        syntaxToken('background', 'property'),
        syntaxToken(':', 'declaration-operator'),
        syntaxToken('rgb', 'function'),
        syntaxToken('(', 'punctuation'),
        syntaxToken('0', 'number'),
        syntaxToken('/', 'separator'),
        syntaxToken('.5', 'number'),
        syntaxToken(')', 'punctuation'),
        syntaxToken(';', 'punctuation'),
        syntaxToken('content', 'property'),
        syntaxToken(':', 'declaration-operator'),
        syntaxToken('"', 'string-quote'),
        syntaxToken('x', 'string'),
        syntaxToken('"', 'string-quote'),
        syntaxToken(';', 'punctuation'),
        syntaxToken('transform', 'property'),
        syntaxToken(':', 'declaration-operator'),
        syntaxToken('translate', 'function'),
        syntaxToken('(', 'punctuation'),
        syntaxToken('10', 'number'),
        syntaxToken('px', 'unit'),
        syntaxToken(',', 'separator'),
        syntaxToken('20', 'number'),
        syntaxToken('px', 'unit'),
        syntaxToken(')', 'punctuation'),
        syntaxToken('}', 'punctuation'),
        syntaxToken('@media', 'keyword'),
        syntaxToken('(', 'punctuation'),
        syntaxToken('width', 'property'),
        syntaxToken('>=', 'query-operator'),
        syntaxToken('1', 'number'),
        syntaxToken('px', 'unit'),
        syntaxToken(')', 'punctuation'),
        syntaxToken('{', 'punctuation'),
        syntaxToken('.y', 'class'),
        syntaxToken('--token', 'variable')
    ]
}

test.concurrent('creates Shiki decorations from Master CSS semantic tokens', () => {
    const code = '<div className="fg:brand:hover@sm block btn btn:hover@sm btn_div::before"></div>'
    const decorations = createMasterCSSShikiSemanticTokenDecorations(code, {
        lang: 'tsx',
        plan
    })
    const tokens = decorations.map((decoration) => ({
        text: code.slice(decoration.start, decoration.end),
        type: decoration.type,
        modifiers: decoration.modifiers,
        classNames: decoration.properties?.class
    }))

    expect(tokens).toEqual(expect.arrayContaining([
        expect.objectContaining({
            text: 'fg',
            type: 'property',
            modifiers: [],
            classNames: expect.arrayContaining(['mcss-semantic', 'mcss-semantic-property', 'mcss-semantic-role-declaration-property'])
        }),
        expect.objectContaining({
            text: 'brand',
            type: 'variable',
            modifiers: [],
            classNames: expect.arrayContaining(['mcss-semantic', 'mcss-semantic-variable', 'mcss-semantic-role-value-variable'])
        }),
        expect.objectContaining({
            text: 'block',
            type: 'class',
            modifiers: [],
            classNames: expect.arrayContaining(['mcss-semantic', 'mcss-semantic-class', 'mcss-semantic-role-utility-static'])
        }),
        expect.objectContaining({
            text: 'btn',
            type: 'class',
            modifiers: ['declaration', 'component'],
            classNames: expect.arrayContaining(['mcss-semantic', 'mcss-semantic-class', 'mcss-semantic-role-utility-component', 'mcss-semantic-class-declaration', 'mcss-semantic-class-component'])
        }),
        expect.objectContaining({
            text: 'div',
            type: 'type',
            modifiers: ['selector'],
            classNames: expect.arrayContaining(['mcss-semantic', 'mcss-semantic-type', 'mcss-semantic-role-selector-type', 'mcss-semantic-type-selector'])
        }),
        expect.objectContaining({
            text: 'before',
            type: 'modifier',
            modifiers: ['pseudoElement'],
            classNames: expect.arrayContaining(['mcss-semantic', 'mcss-semantic-modifier', 'mcss-semantic-role-selector-pseudoElement-name', 'mcss-semantic-modifier-pseudoElement'])
        }),
        expect.objectContaining({
            text: '@sm',
            type: 'keyword',
            modifiers: ['query'],
            classNames: expect.arrayContaining(['mcss-semantic', 'mcss-semantic-keyword', 'mcss-semantic-role-query-keyword', 'mcss-semantic-keyword-query'])
        })
    ]))
    expect(tokens.filter(({ text, type, modifiers }) => text === 'btn' && type === 'class' && modifiers.includes('declaration') && modifiers.includes('component'))).toHaveLength(3)
})

test.concurrent('creates Shiki decorations for managed definition syntax', () => {
    const code = [
        '@utilities {',
        '    text-<left|center|right> {',
        '        text-align: --value();',
        '    }',
        '',
        '    font:<~font-size|number> {',
        '        font-size: --value();',
        '    }',
        '',
        '    grid-cols:<number> {',
        '        grid-template-columns: repeat(--value(), minmax(0, 1fr));',
        '    }',
        '}'
    ].join('\n')
    const decorations = createMasterCSSShikiSemanticTokenDecorations(code, {
        lang: 'css',
        plan
    })
    const tokens = decorations.map((decoration) => ({
        text: code.slice(decoration.start, decoration.end),
        type: decoration.type,
        modifiers: decoration.modifiers,
        classNames: decoration.properties?.class
    }))

    expect(tokens).toEqual(expect.arrayContaining([
        expect.objectContaining({
            text: 'text-',
            type: 'class',
            modifiers: ['selector'],
            classNames: expect.arrayContaining(['mcss-semantic-role-selector-class'])
        }),
        expect.objectContaining({
            text: '|',
            type: 'operator',
            modifiers: ['selector'],
            classNames: expect.arrayContaining(['mcss-semantic-role-selector-punctuation'])
        }),
        expect.objectContaining({
            text: 'left',
            type: 'enumMember',
            modifiers: ['selector'],
            classNames: expect.arrayContaining(['mcss-semantic-role-selector-class'])
        }),
        expect.objectContaining({
            text: 'font',
            type: 'property',
            modifiers: [],
            classNames: expect.arrayContaining(['mcss-semantic-role-declaration-property'])
        }),
        expect.objectContaining({
            text: '~',
            type: 'operator',
            modifiers: ['directive'],
            classNames: expect.arrayContaining(['mcss-semantic-role-directive-parameter'])
        }),
        expect.objectContaining({
            text: 'font-size',
            type: 'variable',
            modifiers: ['directive'],
            classNames: expect.arrayContaining(['mcss-semantic-role-directive-parameter'])
        }),
        expect.objectContaining({
            text: 'number',
            type: 'enumMember',
            modifiers: ['directive'],
            classNames: expect.arrayContaining(['mcss-semantic-role-directive-parameter'])
        }),
        expect.objectContaining({
            text: 'grid-template-columns',
            type: 'property',
            modifiers: [],
            classNames: expect.arrayContaining(['mcss-semantic-role-declaration-property'])
        }),
        expect.objectContaining({
            text: '--value',
            type: 'function',
            modifiers: [],
            classNames: expect.arrayContaining(['mcss-semantic-role-value-function-name'])
        })
    ]))
})

test.concurrent('creates Shiki decorations for raw Master CSS class lists', () => {
    const code = 'fg:brand:hover@sm {bg:blue;fg:white}'
    const decorations = createMasterCSSShikiSemanticTokenDecorations(code, {
        lang: 'mcss',
        classList: true,
        plan
    })
    const tokens = decorations.map((decoration) => ({
        text: code.slice(decoration.start, decoration.end),
        type: decoration.type,
        modifiers: decoration.modifiers
    }))

    expect(tokens).toEqual(expect.arrayContaining([
        { text: 'fg', type: 'property', modifiers: [] },
        { text: 'brand', type: 'variable', modifiers: [] },
        { text: 'hover', type: 'modifier', modifiers: ['pseudoClass'] },
        { text: '@sm', type: 'keyword', modifiers: ['query'] },
        { text: '{', type: 'operator', modifiers: [] },
        { text: ';', type: 'operator', modifiers: [] },
        { text: '}', type: 'operator', modifiers: [] }
    ]))
})

test.concurrent('skips semantic token decorations inside host comments', () => {
    const code = '<!-- <div class="fg:red"></div> -->\n<div class="fg:blue"></div>'
    const decorations = createMasterCSSShikiSemanticTokenDecorations(code, {
        lang: 'html'
    })
    const texts = decorations.map((decoration) => code.slice(decoration.start, decoration.end))

    expect(texts).toContain('blue')
    expect(texts).not.toContain('red')
})

test.concurrent('applies semantic token styles by type and modifier', () => {
    const code = '<div class="block block:hover btn:hover"></div>'
    const decorations = createMasterCSSShikiSemanticTokenDecorations(code, {
        lang: 'html',
        plan,
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
        plan,
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
                class: 'master-css-token master-css-token-class master-css-token-role-utility-component master-css-token-class-declaration master-css-token-class-component'
            },
            htmlStyle: {
                'font-weight': '600'
            }
        }),
        expect.objectContaining({
            content: 'hover',
            htmlAttrs: {
                class: 'master-css-token master-css-token-modifier master-css-token-role-selector-pseudoClass-name master-css-token-modifier-pseudoClass'
            },
            htmlStyle: {}
        })
    ]))
})

test.concurrent('uses native CSS syntax styles for selector semantic tokens', () => {
    const code = '<div class="block>li:hover@md"></div>'
    const options: MasterCSSShikiCodeToHastOptions = {
        lang: 'html'
    }
    const transformer = transformerMasterCSSSemanticTokens()
    const transformedTokens = transformer.tokens.call({
        source: code,
        options,
        codeToTokens: () => ({
            tokens: [nativeCSSSyntaxTokens()]
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
            htmlStyle: { color: 'value' },
            className: 'mcss-semantic mcss-semantic-class mcss-semantic-role-utility-static'
        },
        {
            content: '>',
            htmlStyle: { color: 'selector-operator' },
            className: 'mcss-semantic mcss-semantic-operator mcss-semantic-role-selector-combinator mcss-semantic-operator-selector'
        },
        {
            content: 'li',
            htmlStyle: { color: 'type' },
            className: 'mcss-semantic mcss-semantic-type mcss-semantic-role-selector-type mcss-semantic-type-selector'
        },
        {
            content: ':',
            htmlStyle: { color: 'pseudo-operator' },
            className: 'mcss-semantic mcss-semantic-operator mcss-semantic-role-selector-pseudoClass-delimiter mcss-semantic-operator-selector mcss-semantic-operator-pseudoClass'
        },
        {
            content: 'hover',
            htmlStyle: { color: 'modifier' },
            className: 'mcss-semantic mcss-semantic-modifier mcss-semantic-role-selector-pseudoClass-name mcss-semantic-modifier-pseudoClass'
        }
    ]))
})

test.concurrent('uses native CSS syntax styles for documentation Master CSS tokens', () => {
    const htmlCode = '<section class="bg:surface block grid-cols:2@md fg:primary:hover"></section>'
    const htmlOptions: MasterCSSShikiCodeToHastOptions = {
        lang: 'html'
    }
    const cssCode = [
        '@theme {',
        '  --color-primary: #4f46e5;',
        '  --spacing-card: 24;',
        '}'
    ].join('\n')
    const cssOptions: MasterCSSShikiCodeToHastOptions = {
        lang: 'css'
    }
    const transformer = transformerMasterCSSSemanticTokens()
    const syntaxTokens = nativeCSSSyntaxTokens()
    const htmlTransformedTokens = transformer.tokens.call({
        source: htmlCode,
        options: htmlOptions,
        codeToTokens: () => ({
            tokens: [syntaxTokens]
        })
    }, [[{ content: htmlCode, offset: 0, htmlStyle: { color: 'host' } }]])
    const cssTransformedTokens = transformer.tokens.call({
        source: cssCode,
        options: cssOptions,
        codeToTokens: () => ({
            tokens: [syntaxTokens]
        })
    }, [[{ content: cssCode, offset: 0, htmlStyle: { color: 'host' } }]])
    const htmlTokens = htmlTransformedTokens?.flat().map((token) => ({
        content: token.content,
        htmlStyle: token.htmlStyle,
        className: token.htmlAttrs?.class
    }))
    const cssTokens = cssTransformedTokens?.flat().map((token) => ({
        content: token.content,
        htmlStyle: token.htmlStyle,
        className: token.htmlAttrs?.class
    }))

    expect(htmlTokens).toEqual(expect.arrayContaining([
        {
            content: 'bg',
            htmlStyle: { color: 'property' },
            className: 'mcss-semantic mcss-semantic-property mcss-semantic-role-declaration-property'
        },
        {
            content: ':',
            htmlStyle: { color: 'declaration-operator' },
            className: 'mcss-semantic mcss-semantic-operator mcss-semantic-role-declaration-separator'
        },
        {
            content: 'surface',
            htmlStyle: { color: 'value' },
            className: 'mcss-semantic mcss-semantic-enumMember mcss-semantic-role-value-keyword'
        },
        {
            content: 'block',
            htmlStyle: { color: 'value' },
            className: 'mcss-semantic mcss-semantic-class mcss-semantic-role-utility-static'
        },
        {
            content: '2',
            htmlStyle: { color: 'number' },
            className: 'mcss-semantic mcss-semantic-number mcss-semantic-role-value-number'
        },
        {
            content: '@md',
            htmlStyle: { color: 'keyword' },
            className: 'mcss-semantic mcss-semantic-keyword mcss-semantic-role-query-keyword mcss-semantic-keyword-query'
        },
        {
            content: 'hover',
            htmlStyle: { color: 'modifier' },
            className: 'mcss-semantic mcss-semantic-modifier mcss-semantic-role-selector-pseudoClass-name mcss-semantic-modifier-pseudoClass'
        }
    ]))
    expect(cssTokens).toEqual(expect.arrayContaining([
        {
            content: '@theme',
            htmlStyle: { color: 'keyword' },
            className: 'mcss-semantic mcss-semantic-keyword mcss-semantic-role-directive-keyword mcss-semantic-keyword-directive'
        },
        {
            content: '--color-primary',
            htmlStyle: { color: 'variable' },
            className: 'mcss-semantic mcss-semantic-variable mcss-semantic-role-theme-variable'
        },
        {
            content: '#4f46e5',
            htmlStyle: { color: 'value' },
            className: 'mcss-semantic mcss-semantic-enumMember mcss-semantic-role-value-color'
        },
        {
            content: '24',
            htmlStyle: { color: 'number' },
            className: 'mcss-semantic mcss-semantic-number mcss-semantic-role-value-number'
        }
    ]))
})

test.concurrent('uses native CSS punctuation style for Master directive terminators', () => {
    const code = [
        '@custom-variant @motion-safe { @media (prefers-reduced-motion: no-preference) { @slot; } }',
        '@components {',
        '    card {',
        '        @compose p:md r:xl;',
        '        @variant @<sm {',
        '            @compose block;',
        '        }',
        '    }',
        '}'
    ].join('\n')
    const transformer = transformerMasterCSSSemanticTokens()
    const transformedTokens = transformer.tokens.call({
        source: code,
        options: { lang: 'css' },
        codeToTokens: () => ({
            tokens: [nativeCSSSyntaxTokens()]
        })
    }, [[{ content: code, offset: 0, htmlStyle: { color: 'host' } }]])
    const tokens = transformedTokens?.flat().map((token) => ({
        content: token.content,
        htmlStyle: token.htmlStyle,
        className: token.htmlAttrs?.class
    }))

    expect(tokens).toEqual(expect.arrayContaining([
        {
            content: ';',
            htmlStyle: { color: 'punctuation' },
            className: 'mcss-semantic mcss-semantic-operator mcss-semantic-role-directive-terminator mcss-semantic-operator-directive'
        },
        {
            content: '<',
            htmlStyle: { color: 'query-operator' },
            className: 'mcss-semantic mcss-semantic-operator mcss-semantic-role-query-operator mcss-semantic-operator-query'
        },
        {
            content: 'sm',
            htmlStyle: { color: 'value' },
            className: 'mcss-semantic mcss-semantic-enumMember mcss-semantic-role-query-value mcss-semantic-enumMember-query'
        }
    ]))
})
