import { expect, test } from 'vitest'
import { createHighlighter } from 'shiki'
import sharedTextMateGrammar from '../syntaxes/master-css.tmLanguage.json' with { type: 'json' }

import {
    MASTER_CSS_TEXTMATE_GRAMMAR,
    createMasterCSSShikiDecorations,
    getMasterCSSShikiLanguageId,
    isMasterCSSClassListLanguage,
    isMasterCSSShikiSupportedLanguage,
    masterCSSShikiLanguage,
    transformerMasterCSS
} from '../src/shiki'
import type { MasterCSSShikiOptions } from '../src/shiki'
import { createPresetPlan } from './helpers/create-preset-plan'

const plan: MasterCSSShikiOptions['plan'] = createPresetPlan({
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

function scopeToken(scopeName: string, color: string) {
    return [
        {
            content: scopeName,
            offset: 0,
            color,
            explanation: [
                {
                    scopes: [
                        { scopeName }
                    ]
                }
            ]
        }
    ]
}

function semanticScopeStyleTokens() {
    return [
        ...scopeToken('keyword.control.at-rule.master-css', 'keyword'),
        ...scopeToken('support.type.property-name.master-css', 'property'),
        ...scopeToken('support.constant.property-value.master-css', 'value'),
        ...scopeToken('entity.other.attribute-name.class.master-css', 'class'),
        ...scopeToken('storage.modifier.master-css', 'modifier'),
        ...scopeToken('variable.other.master-css', 'variable'),
        ...scopeToken('variable.css', 'variable'),
        ...scopeToken('entity.name.tag.css', 'type'),
        ...scopeToken('entity.other.attribute-name.class.css', 'class'),
        ...scopeToken('entity.other.attribute-name.id.css', 'id'),
        ...scopeToken('entity.other.attribute-name.pseudo-class.css', 'modifier'),
        ...scopeToken('entity.other.attribute-name.pseudo-element.css', 'pseudo-element'),
        ...scopeToken('keyword.operator.css', 'operator'),
        ...scopeToken('keyword.operator.combinator', 'selector-operator'),
        ...scopeToken('keyword.other.important.css', 'important'),
        ...scopeToken('keyword.other.unit.rem.css', 'unit'),
        ...scopeToken('constant.numeric.css', 'number'),
        ...scopeToken('support.function.misc.css', 'function'),
        ...scopeToken('string.quoted.css', 'string')
    ]
}

const shikiProbeTheme = {
    name: 'master-css-probe',
    type: 'dark',
    settings: [
        {
            settings: {
                foreground: '#111111'
            }
        },
        {
            scope: 'comment.block.css',
            settings: {
                foreground: '#6272a4'
            }
        },
        {
            scope: 'keyword.control.at-rule.master-css',
            settings: {
                foreground: '#ff0000'
            }
        },
        {
            scope: 'support.type.property-name.master-css',
            settings: {
                foreground: '#00ff00'
            }
        },
        {
            scope: 'support.constant.property-value.master-css',
            settings: {
                foreground: '#0000ff'
            }
        },
        {
            scope: 'constant.numeric.css',
            settings: {
                foreground: '#ffaa00'
            }
        },
        {
            scope: 'keyword.other.unit',
            settings: {
                foreground: '#00ffaa'
            }
        },
        {
            scope: 'entity.other.attribute-name.class.master-css',
            settings: {
                foreground: '#ff00ff'
            }
        },
        {
            scope: 'variable.other.master-css',
            settings: {
                foreground: '#00ffff'
            }
        }
    ]
} as const

test.concurrent('registers a real Shiki TextMate injection grammar for CSS directives', async () => {
    const highlighter = await createHighlighter({
        themes: [shikiProbeTheme as any],
        langs: ['css', masterCSSShikiLanguage]
    })
    const code = [
        '@theme {',
        '    --color-primary: $color-blue-60;',
        '}',
        '@components {',
        '    btn {',
        '        @compose inline-flex fg:primary:hover@md;',
        '    }',
        '}',
        '@keyframes fade {',
        '    from { opacity: 0; }',
        '    to { opacity: 1; }',
        '}'
    ].join('\n')
    const tokens = highlighter.codeToTokens(code, {
        lang: 'css',
        theme: 'master-css-probe'
    }).tokens.flat()
    const tokenColor = (text: string) => (tokens.find((token) => token.content === text) ?? tokens.find((token) => token.content.includes(text)))?.color?.toLowerCase()

    expect(MASTER_CSS_TEXTMATE_GRAMMAR).toBe(sharedTextMateGrammar)
    expect(masterCSSShikiLanguage.scopeName).toBe(sharedTextMateGrammar.scopeName)
    expect(masterCSSShikiLanguage.injectTo).toEqual([
        'source.css',
        'source.css.scss',
        'source.css.less',
        'source.css.postcss'
    ])
    expect(tokenColor('theme')).toBe('#ff0000')
    expect(tokenColor('components')).toBe('#ff0000')
    expect(tokenColor('compose')).toBe('#ff0000')
    expect(tokenColor('inline-flex')).toBe('#ff00ff')
    expect(tokenColor('fg')).toBe('#00ff00')
    expect(tokenColor('primary')).toBe('#0000ff')
    expect(tokenColor('md')).toBe('#ff0000')
    expect(tokenColor('$color-blue-60')).toBe('#00ffff')
    expect(tokenColor('fade')).toBe('#111111')
    expect(tokenColor('from')).toBe('#111111')
    expect(tokenColor('to')).toBe('#111111')
})

test.concurrent('keeps guide theme snippets correct with TextMate only', async () => {
    const highlighter = await createHighlighter({
        themes: [shikiProbeTheme as any],
        langs: ['css', masterCSSShikiLanguage]
    })
    const code = [
        '@theme light {',
        '    /* Font families */',
        '    --tracking-tightest: -0.072em;',
        '}'
    ].join('\n')
    const tokens = highlighter.codeToTokens(code, {
        lang: 'css',
        theme: 'master-css-probe'
    }).tokens.flat()
    const tokenColor = (text: string) => (tokens.find((token) => token.content === text) ?? tokens.find((token) => token.content.includes(text)))?.color?.toLowerCase()

    expect(tokenColor('theme')).toBe('#ff0000')
    expect(tokenColor('light')).toBe('#0000ff')
    expect(tokenColor('/* Font families */')).toBe('#6272a4')
    expect(tokenColor('-0.072')).toBe('#ffaa00')
    expect(tokenColor('em')).toBe('#00ffaa')
})

test.concurrent('does not attach semantic metadata to guide theme CSS directive syntax', () => {
    const code = [
        '@theme light {',
        '    /* Font families */',
        '    --tracking-tightest: -0.072em;',
        '}'
    ].join('\n')
    const transformer = transformerMasterCSS({ matchCSSSyntaxStyles: false })
    const transformedTokens = transformer.tokens.call({
        source: code,
        options: { lang: 'css' }
    }, [[{ content: code, offset: 0, htmlStyle: { color: 'host' } }]])

    expect(transformedTokens).toBeUndefined()
    expect(createMasterCSSShikiDecorations(code, { lang: 'css' })).toEqual([])
})

test.concurrent('does not resolve guide theme CSS directive syntax through semantic scope styles', () => {
    const code = [
        '@theme light {',
        '    --tracking-tightest: -0.072em;',
        '}'
    ].join('\n')
    const transformer = transformerMasterCSS({ plan })
    const transformedTokens = transformer.tokens.call({
        source: code,
        options: { lang: 'css' },
        codeToTokens: () => ({
            tokens: [semanticScopeStyleTokens()]
        })
    }, [[{ content: code, offset: 0, htmlStyle: { color: 'host' } }]])

    expect(transformedTokens).toBeUndefined()
})

test.concurrent('does not create Master Shiki decorations for native-only CSS', () => {
    const code = [
        '@keyframes fade {',
        '    from { opacity: 0; transform: translateX(0); }',
        '    to { opacity: 1; transform: translateX(var(--distance)); }',
        '}',
        '.card:hover::before {',
        '    --distance: calc(100% - 1rem);',
        '    color: oklch(99% 0.0033 72);',
        '}'
    ].join('\n')

    expect(createMasterCSSShikiDecorations(code, { lang: 'css' })).toEqual([])
})

test.concurrent('normalizes Shiki language ids separately from class-list languages', () => {
    expect(getMasterCSSShikiLanguageId('js')).toBe('javascript')
    expect(getMasterCSSShikiLanguageId('jsx')).toBe('jsx')
    expect(getMasterCSSShikiLanguageId('tsx')).toBe('tsx')
    expect(getMasterCSSShikiLanguageId('angular-html')).toBe('angular-html')
    expect(getMasterCSSShikiLanguageId('md')).toBe('markdown')
    expect(isMasterCSSShikiSupportedLanguage('typescriptreact')).toBe(true)
    expect(isMasterCSSShikiSupportedLanguage('mcss')).toBe(false)
    expect(isMasterCSSClassListLanguage('mcss')).toBe(true)
    expect(isMasterCSSClassListLanguage('master-css')).toBe(true)
})

test.concurrent('creates Shiki decorations from Master CSS semantic tokens', () => {
    const code = '<div className="fg:brand:hover@sm block btn btn:hover@sm btn_div::before"></div>'
    const decorations = createMasterCSSShikiDecorations(code, {
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
            type: 'enumMember',
            modifiers: [],
            classNames: expect.arrayContaining(['mcss-semantic', 'mcss-semantic-enumMember', 'mcss-semantic-role-utility-semantic'])
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

test.concurrent('creates Shiki decorations for CSS directive class-list spans', () => {
    const code = [
        '@safelist "block fg:red";',
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
        '}',
        '@components {',
        '    btn {',
        '        @compose inline-flex fg:brand:hover@sm;',
        '    }',
        '}'
    ].join('\n')
    const decorations = createMasterCSSShikiDecorations(code, {
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
            text: 'block',
            type: 'enumMember',
            modifiers: [],
            classNames: expect.arrayContaining(['mcss-semantic-role-utility-semantic'])
        }),
        expect.objectContaining({
            text: 'fg',
            type: 'property',
            modifiers: [],
            classNames: expect.arrayContaining(['mcss-semantic-role-declaration-property'])
        }),
        expect.objectContaining({
            text: 'red',
            type: 'enumMember',
            modifiers: [],
            classNames: expect.arrayContaining(['mcss-semantic-role-value-keyword'])
        }),
        expect.objectContaining({
            text: 'inline-flex',
            type: 'enumMember',
            modifiers: [],
            classNames: expect.arrayContaining(['mcss-semantic-role-utility-semantic'])
        }),
        expect.objectContaining({
            text: 'brand',
            type: 'variable',
            modifiers: [],
            classNames: expect.arrayContaining(['mcss-semantic-role-value-variable'])
        }),
        expect.objectContaining({
            text: 'hover',
            type: 'modifier',
            modifiers: ['pseudoClass'],
            classNames: expect.arrayContaining(['mcss-semantic-role-selector-pseudoClass-name'])
        }),
        expect.objectContaining({
            text: '@sm',
            type: 'keyword',
            modifiers: ['query'],
            classNames: expect.arrayContaining(['mcss-semantic-role-query-keyword'])
        })
    ]))
    expect(tokens).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ text: 'text-' }),
        expect.objectContaining({ text: 'left' }),
        expect.objectContaining({ text: 'font' }),
        expect.objectContaining({ text: '--value' })
    ]))
})

test.concurrent('creates Shiki decorations for raw Master CSS class lists', () => {
    const code = 'fg:brand:hover@sm {bg:blue;fg:white}'
    const decorations = createMasterCSSShikiDecorations(code, {
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
    const decorations = createMasterCSSShikiDecorations(code, {
        lang: 'html'
    })
    const texts = decorations.map((decoration) => code.slice(decoration.start, decoration.end))

    expect(texts).toContain('blue')
    expect(texts).not.toContain('red')
})

test.concurrent('applies semantic token styles by type and modifier', () => {
    const code = '<div class="block block:hover btn:hover"></div>'
    const decorations = createMasterCSSShikiDecorations(code, {
        lang: 'html',
        plan,
        semanticTokenStyles: {
            enumMember: {
                color: 'var(--mcss-semantic-value)',
                '--shiki-dark': 'var(--mcss-semantic-value-dark)'
            },
            class: {
                color: 'var(--mcss-semantic-class)',
                '--shiki-dark': 'var(--mcss-semantic-class-dark)'
            },
            'class.declaration': {
                'font-weight': '600'
            }
        }
    })
    const enumMemberDecorations = decorations.filter((decoration) => decoration.type === 'enumMember')
    const classDecorations = decorations.filter((decoration) => decoration.type === 'class')
    const blockStyles = enumMemberDecorations
        .filter((decoration) => code.slice(decoration.start, decoration.end) === 'block')
        .map((decoration) => decoration.properties?.style)
    const btnStyle = classDecorations.find((decoration) => code.slice(decoration.start, decoration.end) === 'btn')?.properties?.style

    expect(blockStyles).toEqual([
        'color:var(--mcss-semantic-value);--shiki-dark:var(--mcss-semantic-value-dark)',
        'color:var(--mcss-semantic-value);--shiki-dark:var(--mcss-semantic-value-dark)'
    ])
    expect(btnStyle).toBe('color:var(--mcss-semantic-class);--shiki-dark:var(--mcss-semantic-class-dark);font-weight:600')
})

test.concurrent('applies semantic decorations in the Shiki tokens hook', () => {
    const code = '<div className="btn:hover@sm"></div>'
    const options = {
        lang: 'tsx',
        decorations: [
            { start: 0, end: 0, properties: { class: 'existing-decoration' } }
        ]
    }
    const transformer = transformerMasterCSS({
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

test.concurrent('uses semantic token scope styles for selector semantic tokens', () => {
    const code = '<div class="block>li:hover@md"></div>'
    const options = {
        lang: 'html'
    }
    const transformer = transformerMasterCSS({ plan })
    const transformedTokens = transformer.tokens.call({
        source: code,
        options,
        codeToTokens: () => ({
            tokens: [semanticScopeStyleTokens()]
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
            className: 'mcss-semantic mcss-semantic-enumMember mcss-semantic-role-utility-semantic'
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
            htmlStyle: { color: 'modifier' },
            className: 'mcss-semantic mcss-semantic-operator mcss-semantic-role-selector-pseudoClass-delimiter mcss-semantic-operator-selector mcss-semantic-operator-pseudoClass'
        },
        {
            content: 'hover',
            htmlStyle: { color: 'modifier' },
            className: 'mcss-semantic mcss-semantic-modifier mcss-semantic-role-selector-pseudoClass-name mcss-semantic-modifier-pseudoClass'
        }
    ]))
})

test.concurrent('uses semantic token scope styles for documentation Master CSS tokens', () => {
    const htmlCode = '<section class="bg:blue block grid-cols:2@md fg:primary:hover"></section>'
    const htmlOptions = {
        lang: 'html'
    }
    const cssCode = [
        '@theme {',
        '  --color-primary: #4f46e5;',
        '  --spacing-card: 24;',
        '}',
        '@components {',
        '  card { @compose bg:blue fg:brand:hover; }',
        '}'
    ].join('\n')
    const cssOptions = {
        lang: 'css'
    }
    const transformer = transformerMasterCSS({ plan })
    const syntaxTokens = semanticScopeStyleTokens()
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
            htmlStyle: { color: 'operator' },
            className: 'mcss-semantic mcss-semantic-operator mcss-semantic-role-declaration-separator'
        },
        {
            content: 'blue',
            htmlStyle: { color: 'value' },
            className: 'mcss-semantic mcss-semantic-enumMember mcss-semantic-role-value-keyword'
        },
        {
            content: 'block',
            htmlStyle: { color: 'value' },
            className: 'mcss-semantic mcss-semantic-enumMember mcss-semantic-role-utility-semantic'
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
            content: 'bg',
            htmlStyle: { color: 'property' },
            className: 'mcss-semantic mcss-semantic-property mcss-semantic-role-declaration-property'
        },
        {
            content: 'blue',
            htmlStyle: { color: 'value' },
            className: 'mcss-semantic mcss-semantic-enumMember mcss-semantic-role-value-keyword'
        },
        {
            content: 'brand',
            htmlStyle: { color: 'variable' },
            className: 'mcss-semantic mcss-semantic-variable mcss-semantic-role-value-variable'
        },
        {
            content: 'hover',
            htmlStyle: { color: 'modifier' },
            className: 'mcss-semantic mcss-semantic-modifier mcss-semantic-role-selector-pseudoClass-name mcss-semantic-modifier-pseudoClass'
        }
    ]))
    expect(cssTokens?.some((token) => token.content === '@theme' && token.className)).toBe(false)
    expect(cssTokens?.some((token) => token.content === '--color-primary' && token.className)).toBe(false)
})

test.concurrent('uses semantic token scope styles for CSS directive class-list tokens', () => {
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
    const transformer = transformerMasterCSS()
    const transformedTokens = transformer.tokens.call({
        source: code,
        options: { lang: 'css' },
        codeToTokens: () => ({
            tokens: [semanticScopeStyleTokens()]
        })
    }, [[{ content: code, offset: 0, htmlStyle: { color: 'host' } }]])
    const tokens = transformedTokens?.flat().map((token) => ({
        content: token.content,
        htmlStyle: token.htmlStyle,
        className: token.htmlAttrs?.class
    }))

    expect(tokens).toEqual(expect.arrayContaining([
        {
            content: 'p',
            htmlStyle: { color: 'property' },
            className: 'mcss-semantic mcss-semantic-property mcss-semantic-role-declaration-property'
        },
        {
            content: 'md',
            htmlStyle: { color: 'value' },
            className: 'mcss-semantic mcss-semantic-enumMember mcss-semantic-role-value-keyword'
        },
        {
            content: 'r',
            htmlStyle: { color: 'property' },
            className: 'mcss-semantic mcss-semantic-property mcss-semantic-role-declaration-property'
        },
        {
            content: 'xl',
            htmlStyle: { color: 'value' },
            className: 'mcss-semantic mcss-semantic-enumMember mcss-semantic-role-value-keyword'
        },
        {
            content: 'block',
            htmlStyle: { color: 'value' },
            className: 'mcss-semantic mcss-semantic-enumMember mcss-semantic-role-utility-semantic'
        }
    ]))
    expect(tokens?.some((token) => token.content === '<' && token.className)).toBe(false)
    expect(tokens?.some((token) => token.content === 'sm' && token.className)).toBe(false)
})
