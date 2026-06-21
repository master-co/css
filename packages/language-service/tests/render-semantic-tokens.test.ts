import { expect, test } from 'vitest'

import CSSLanguageService from '../src/core'
import createDoc from '../src/utils/create-doc'
import { SEMANTIC_TOKEN_MODIFIERS, SEMANTIC_TOKEN_TYPES } from '../src'
import { createPresetPlan } from './helpers/create-preset-plan'

function decodeSemanticTokenRanges(doc: ReturnType<typeof createDoc>, data: number[]) {
    const tokens: { text: string, start: number, end: number, type: string, modifiers: string[] }[] = []
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
            start,
            end,
            type,
            modifiers: SEMANTIC_TOKEN_MODIFIERS.filter((_, index) => modifierBits & (1 << index))
        })
    }
    return tokens
}

function decodeSemanticTokens(doc: ReturnType<typeof createDoc>, data: number[]) {
    return decodeSemanticTokenRanges(doc, data).map(({ text, type, modifiers }) => ({ text, type, modifiers }))
}

function renderTokens(content: string, ext: Parameters<typeof createDoc>[0] = 'tsx', settings?: ConstructorParameters<typeof CSSLanguageService>[0]) {
    const doc = createDoc(ext, content)
    const languageService = new CSSLanguageService({ embeddedSyntaxHighlighting: 'always', ...settings })
    const semanticTokens = languageService.renderSemanticTokens(doc)
    return {
        doc,
        tokens: decodeSemanticTokens(doc, semanticTokens?.data ?? [])
    }
}

function expectToken(tokens: { text: string, type: string, modifiers: string[] }[], text: string, type: string, modifiers: string[] = []) {
    expect(tokens).toContainEqual({ text, type, modifiers })
}

test.concurrent('renders semantic tokens for class attributes', () => {
    const { tokens } = renderTokens(
        '<div className="fg:brand:hover@sm block block:hover block:state-name hidden_div::before:of(.active) m:4x bg:rgb(0|0|0) w:0.625rem::scrollbar btn btn:hover@sm btn_div::before"></div>',
        'tsx',
        {
            plan: createPresetPlan({
                variables: [{ key: 'brand', value: '#123456' }],
                utilities: [
                    {
                        name: 'btn',
                        layer: 'components',
                        rules: [
                            { selector: '&', declarations: { color: 'var(--brand)' } },
                            { selector: '&', declarations: { display: 'block' } }
                        ]
                    }
                ]
            })
        }
    )

    expectToken(tokens, 'fg', 'property')
    expectToken(tokens, ':', 'operator', ['declarationSeparator'])
    expectToken(tokens, 'brand', 'variable')
    expectToken(tokens, 'hover', 'modifier', ['pseudoClass'])
    expectToken(tokens, '@sm', 'keyword', ['query'])
    expectToken(tokens, 'block', 'enumMember')
    expectToken(tokens, 'state-name', 'modifier', ['pseudoClass'])
    expectToken(tokens, 'hidden', 'enumMember')
    expectToken(tokens, '_', 'operator', ['selector', 'selectorCombinator'])
    expectToken(tokens, 'div', 'type', ['selector'])
    expectToken(tokens, '::', 'operator', ['pseudoElement', 'selector', 'pseudoElementDelimiter'])
    expectToken(tokens, 'before', 'modifier', ['pseudoElement'])
    expectToken(tokens, 'of', 'modifier', ['pseudoClass'])
    expectToken(tokens, '.', 'operator', ['selector', 'selectorPunctuation'])
    expectToken(tokens, 'active', 'class', ['selector'])
    expectToken(tokens, '4', 'number')
    expectToken(tokens, 'x', 'enumMember', ['unit'])
    expectToken(tokens, 'rgb', 'function')
    expectToken(tokens, 'scrollbar', 'modifier', ['pseudoElement'])
    expectToken(tokens, 'btn', 'class', ['declaration', 'component'])
    expect(tokens.filter(({ text, type, modifiers }) => text === 'btn' && type === 'class' && modifiers.includes('declaration') && modifiers.includes('component'))).toHaveLength(3)
})

test.concurrent('renders semantic tokens for CSS-like values', () => {
    const { tokens } = renderTokens(
        '<div className="h:$size-sm fg:$color-blue-50/.5 content:x::before bg:rgb(0|0|0) fg:red_:where(a:hover) font:mono_:is(code,pre)@base font:semibold_:headings font:semibold_:is(h1,h2,h3,h4,h5,h6)"></div>',
        'tsx',
        {
            plan: createPresetPlan({
                variables: [
                    { key: 'size-sm', value: 16 },
                    { namespace: 'color', key: 'blue-50', value: 'oklch(60% 0.2 250)' }
                ]
            })
        }
    )

    expectToken(tokens, '$size-sm', 'variable')
    expectToken(tokens, '$color-blue-50', 'variable')
    expectToken(tokens, '/', 'operator', ['valueSeparator'])
    expectToken(tokens, '.5', 'number')
    expectToken(tokens, 'x', 'enumMember')
    expectToken(tokens, '::', 'operator', ['pseudoElement', 'selector', 'pseudoElementDelimiter'])
    expectToken(tokens, 'before', 'modifier', ['pseudoElement'])
    expectToken(tokens, 'rgb', 'function')
    expectToken(tokens, '|', 'operator', ['valueSeparator'])
    expectToken(tokens, '_', 'operator', ['selector', 'selectorCombinator'])
    expectToken(tokens, 'where', 'modifier', ['pseudoClass'])
    expectToken(tokens, '(', 'operator', ['selector', 'selectorPunctuation'])
    expectToken(tokens, 'a', 'type', ['selector'])
    expectToken(tokens, 'hover', 'modifier', ['pseudoClass'])
    expectToken(tokens, ')', 'operator', ['selector', 'selectorPunctuation'])
    expectToken(tokens, 'is', 'modifier', ['pseudoClass'])
    expectToken(tokens, 'code', 'type', ['selector'])
    expectToken(tokens, ',', 'operator', ['selector', 'selectorPunctuation'])
    expectToken(tokens, 'pre', 'type', ['selector'])
    expectToken(tokens, 'headings', 'modifier', ['pseudoClass'])
    expectToken(tokens, 'h1', 'type', ['selector'])
    expectToken(tokens, 'h2', 'type', ['selector'])
    expectToken(tokens, 'h3', 'type', ['selector'])
    expectToken(tokens, 'h4', 'type', ['selector'])
    expectToken(tokens, 'h5', 'type', ['selector'])
    expectToken(tokens, 'h6', 'type', ['selector'])
    expectToken(tokens, '@base', 'keyword', ['query'])
})

test.concurrent('renders semantic tokens for container queries and slash-separated string values', () => {
    const { tokens } = renderTokens(
        '<div className="hidden@container(sm&<=md) container:card/inline-size grid-cols:2@card(3xs) bg-center bg-cover bg:url(/hero.jpg) hidden@media(pointer:coarse) hidden@h>=sm&h<lg"></div>',
        'html'
    )

    expectToken(tokens, 'hidden', 'enumMember')
    expectToken(tokens, '@container', 'keyword', ['query'])
    expectToken(tokens, '(', 'operator', ['query', 'queryPunctuation'])
    expectToken(tokens, 'sm', 'enumMember', ['query'])
    expectToken(tokens, '&', 'operator', ['query', 'queryOperator'])
    expectToken(tokens, '<=', 'operator', ['query', 'queryOperator'])
    expectToken(tokens, 'md', 'enumMember', ['query'])
    expectToken(tokens, ')', 'operator', ['query', 'queryPunctuation'])
    expectToken(tokens, 'container', 'property')
    expectToken(tokens, 'card', 'enumMember')
    expectToken(tokens, '/', 'operator', ['valueSeparator'])
    expectToken(tokens, 'inline-size', 'enumMember')
    expectToken(tokens, 'grid-cols', 'property')
    expectToken(tokens, '2', 'number')
    expectToken(tokens, '@card', 'keyword', ['query'])
    expectToken(tokens, '3', 'number', ['query'])
    expectToken(tokens, 'xs', 'enumMember', ['query', 'unit'])
    expectToken(tokens, 'bg-center', 'enumMember')
    expectToken(tokens, 'bg-cover', 'enumMember')
    expectToken(tokens, 'bg', 'property')
    expectToken(tokens, 'url', 'function')
    expectToken(tokens, '/hero.jpg', 'string')
    expectToken(tokens, '@media', 'keyword', ['query'])
    expectToken(tokens, 'pointer', 'property', ['query'])
    expectToken(tokens, ':', 'operator', ['query', 'queryPunctuation'])
    expectToken(tokens, 'coarse', 'enumMember', ['query'])
    expectToken(tokens, '@h', 'keyword', ['query'])
    expectToken(tokens, '>=', 'operator', ['query', 'queryOperator'])
    expectToken(tokens, 'sm', 'enumMember', ['query'])
    expectToken(tokens, 'h', 'property', ['query'])
    expectToken(tokens, '<', 'operator', ['query', 'queryOperator'])
    expectToken(tokens, 'lg', 'enumMember', ['query'])
    expect(tokens.filter(({ text, type, modifiers }) => text === '/' && type === 'operator' && modifiers.includes('valueSeparator'))).toHaveLength(1)
})

test.concurrent('renders semantic tokens for grouped declarations, strings, units, and important marks', () => {
    const { tokens } = renderTokens(
        '<div class="{fg:red;bg:blue} transform:translate(10x|20px) content:\'a|b\' size:10x fg:red!"></div>',
        'html'
    )

    expectToken(tokens, '{', 'operator', ['blockBrace'])
    expectToken(tokens, ';', 'operator', ['declarationTerminator'])
    expectToken(tokens, '}', 'operator', ['blockBrace'])
    expectToken(tokens, ':', 'operator', ['declarationSeparator'])
    expectToken(tokens, 'fg', 'property')
    expectToken(tokens, 'red', 'enumMember')
    expectToken(tokens, 'bg', 'property')
    expectToken(tokens, 'blue', 'enumMember')
    expectToken(tokens, 'transform', 'property')
    expectToken(tokens, 'translate', 'function')
    expectToken(tokens, '(', 'operator', ['functionPunctuation'])
    expectToken(tokens, '10', 'number')
    expectToken(tokens, 'x', 'enumMember', ['unit'])
    // Master CSS uses `|` as a compact separator in places where native CSS
    // often uses whitespace or commas, so it keeps a distinct value role.
    expectToken(tokens, '|', 'operator', ['valueSeparator'])
    expectToken(tokens, '20', 'number')
    expectToken(tokens, 'px', 'enumMember', ['unit'])
    expectToken(tokens, ')', 'operator', ['functionPunctuation'])
    expectToken(tokens, '\'', 'string', ['quoted'])
    expectToken(tokens, 'a|b', 'string', ['quoted'])
    expectToken(tokens, 'x', 'enumMember', ['unit'])
    expectToken(tokens, '!', 'operator', ['important'])
})

test.concurrent('renders native-aligned semantic tokens for grouped classes with selector suffixes', () => {
    const { tokens } = renderTokens(
        '<div class="{text-align:center;block}>li:hover@sm"></div>',
        'html'
    )

    expectToken(tokens, '{', 'operator', ['blockBrace'])
    expectToken(tokens, 'text-align', 'property')
    expectToken(tokens, ':', 'operator', ['declarationSeparator'])
    expectToken(tokens, 'center', 'enumMember')
    expectToken(tokens, ';', 'operator', ['declarationTerminator'])
    expectToken(tokens, 'block', 'enumMember')
    expectToken(tokens, '}', 'operator', ['blockBrace'])
    expectToken(tokens, '>', 'operator', ['selector', 'selectorCombinator'])
    expectToken(tokens, 'li', 'type', ['selector'])
    expectToken(tokens, ':', 'operator', ['pseudoClass', 'selector', 'pseudoClassDelimiter'])
    expectToken(tokens, 'hover', 'modifier', ['pseudoClass'])
    expectToken(tokens, '@sm', 'keyword', ['query'])
    expect(tokens.some(({ text }) => text.includes('block}>li:hover@sm'))).toBe(false)
})

test.concurrent('renders semantic tokens for CSS directives', () => {
    const { tokens } = renderTokens(`
        @master;
        @reference "./tokens.css";

        @settings {
            root-size: 16;
        }

        @theme dark {
            --color-primary: $color-blue-60/.8;
        }

        @theme {
            @keyframes fade {
                to {
                    opacity: 1;
                }
            }
        }

        @custom-variant @motion-safe { @media (prefers-reduced-motion: no-preference) { @slot; } }
        @custom-variant :interactive { &:is(:hover, :focus-visible) { @slot; } }

        @defaults {
            reset {
                @compose block;
            }
        }

        @components {
            btn {
                @compose inline-flex fg:primary:hover@md;
                @dark {
                    @compose bg:blue;
                }
                @variant @<sm {
                    @compose block;
                }
                @variant ::scrollbar-thumb:hover@dark {
                    @compose fg:primary;
                }
            }
        }

        @utilities {
            content-auto {
                @compose block;
            }

            text-<left|center|right> {
                text-align: --value();
            }

            font:<~font-size|number> {
                font-size: --value();
            }

            bg:<~color|color> {
                background-color: --value();
            }

            text-decoration:<~color|*> {
                text-decoration: --value();
            }

            user-select:<auto|none|text|all> {
                user-select: --value();
            }

            grid-cols:<number> {
                grid-template-columns: repeat(--value(), minmax(0, 1fr));

                @variant @<sm {
                    font-size: --value();
                }

                &:hover {
                    text-align: --value();
                }
            }
        }
    `, 'css')

    expectToken(tokens, '@master', 'keyword', ['directive'])
    expectToken(tokens, ';', 'operator', ['directive', 'directiveTerminator'])
    expectToken(tokens, '@reference', 'keyword', ['directive'])
    expectToken(tokens, '@settings', 'keyword', ['directive'])
    expectToken(tokens, 'root-size', 'property')
    expectToken(tokens, '@theme', 'keyword', ['directive'])
    expectToken(tokens, 'dark', 'enumMember', ['directive'])
    expectToken(tokens, '--color-primary', 'variable')
    expectToken(tokens, '$color-blue-60', 'variable')
    expectToken(tokens, '@custom-variant', 'keyword', ['directive'])
    expectToken(tokens, '@motion-safe', 'keyword', ['query'])
    expectToken(tokens, '@slot', 'keyword', ['directive'])
    expectToken(tokens, 'interactive', 'variable', ['directive', 'query'])
    expect(tokens).not.toContainEqual({ text: '@' + 'animations', type: 'keyword', modifiers: ['directive'] })
    expect(tokens).not.toContainEqual({ text: 'opacity', type: 'variable', modifiers: [] })
    expect(tokens).not.toContainEqual({ text: '@media', type: 'keyword', modifiers: ['query'] })
    expectToken(tokens, '@defaults', 'keyword', ['directive'])
    expectToken(tokens, 'reset', 'class', ['selector'])
    expectToken(tokens, '@components', 'keyword', ['directive'])
    expectToken(tokens, 'btn', 'class', ['selector'])
    expectToken(tokens, '@compose', 'keyword', ['directive'])
    expectToken(tokens, 'fg', 'property')
    expectToken(tokens, 'primary', 'enumMember')
    expectToken(tokens, 'hover', 'modifier', ['pseudoClass'])
    expectToken(tokens, '@md', 'keyword', ['query'])
    expectToken(tokens, '@dark', 'keyword', ['directive'])
    expectToken(tokens, '@variant', 'keyword', ['directive'])
    expectToken(tokens, 'blue', 'enumMember')
    expectToken(tokens, '<', 'operator', ['query', 'queryOperator'])
    expectToken(tokens, 'sm', 'enumMember', ['query'])
    expectToken(tokens, 'block', 'enumMember')
    expectToken(tokens, 'scrollbar-thumb', 'modifier', ['pseudoElement'])
    expectToken(tokens, 'hover', 'modifier', ['pseudoClass'])
    expectToken(tokens, '@dark', 'keyword', ['query'])
    expectToken(tokens, '@utilities', 'keyword', ['directive'])
    expectToken(tokens, 'content-auto', 'class', ['selector'])
    expectToken(tokens, 'text-', 'class', ['selector'])
    expectToken(tokens, '|', 'operator', ['selector', 'selectorPunctuation'])
    expectToken(tokens, 'left', 'enumMember', ['selector'])
    expectToken(tokens, 'center', 'enumMember', ['selector'])
    expectToken(tokens, 'right', 'enumMember', ['selector'])
    expectToken(tokens, '--value', 'function')
    expectToken(tokens, 'font', 'property')
    expectToken(tokens, ':', 'operator', ['declarationSeparator'])
    expectToken(tokens, '<', 'operator', ['directive'])
    expectToken(tokens, '~', 'operator', ['directive'])
    expectToken(tokens, '|', 'operator', ['directive'])
    expectToken(tokens, 'font-size', 'variable', ['directive'])
    expectToken(tokens, 'number', 'enumMember', ['directive'])
    expectToken(tokens, 'color', 'enumMember', ['directive'])
    expectToken(tokens, '*', 'operator', ['directive'])
    expectToken(tokens, 'auto', 'enumMember', ['directive'])
    expectToken(tokens, 'none', 'enumMember', ['directive'])
    expect(tokens).not.toContainEqual({ text: 'text-align', type: 'property', modifiers: [] })
    expect(tokens).not.toContainEqual({ text: 'repeat', type: 'function', modifiers: [] })
})

test.concurrent('renders Master-only declaration tokens inside theme directives', () => {
    const { tokens } = renderTokens(`
        @theme {
            --font-family-serif: var(--font-serif, ui-serif), Georgia, Cambria, "Times New Roman", Times, serif;
            --tracking-tightest: -0.072em;

            @keyframes zoom {
                0% {
                    transform: scale(0);
                    color: $color-red-50;
                }

                to {
                    transform: --value();
                }
            }

            --color-stone-0: oklch(99% 0.0033 72);
        }

        @theme dark {
            --color-canvas: $color-gray-100;
        }

        @theme inline {
            --full: 100%;
        }
    `, 'css')

    expectToken(tokens, '@theme', 'keyword', ['directive'])
    expectToken(tokens, 'dark', 'enumMember', ['directive'])
    expectToken(tokens, 'inline', 'modifier', ['directive'])
    expectToken(tokens, '--font-family-serif', 'variable')
    expectToken(tokens, '--tracking-tightest', 'variable')
    expectToken(tokens, ':', 'operator', ['declarationSeparator'])
    expectToken(tokens, ';', 'operator', ['declarationTerminator'])
    expect(tokens).not.toContainEqual({ text: 'font-serif', type: 'enumMember', modifiers: [] })
    expect(tokens).not.toContainEqual({ text: 'var', type: 'function', modifiers: [] })
    expect(tokens).not.toContainEqual({ text: '-', type: 'operator', modifiers: ['valueOperator'] })
    expect(tokens).not.toContainEqual({ text: '0.072', type: 'number', modifiers: [] })
    expect(tokens).not.toContainEqual({ text: 'em', type: 'enumMember', modifiers: ['unit'] })
    expect(tokens).not.toContainEqual({ text: '@keyframes', type: 'keyword', modifiers: [] })
    expect(tokens).not.toContainEqual({ text: 'oklch', type: 'function', modifiers: [] })
    expect(tokens).not.toContainEqual({ text: '$color-red-50', type: 'variable', modifiers: [] })
    expect(tokens).not.toContainEqual({ text: '--value', type: 'function', modifiers: [] })
    expectToken(tokens, '$color-gray-100', 'variable')
    expectToken(tokens, '--full', 'variable')
    expect(tokens).not.toContainEqual({ text: '100', type: 'number', modifiers: [] })
    expect(tokens).not.toContainEqual({ text: '%', type: 'enumMember', modifiers: ['unit'] })
})

test.concurrent('renders Master-only tokens inside managed definition directives', () => {
    const { tokens } = renderTokens(`
        @defaults {
            reset {
                @light {
                    color: var(--text, black);
                }
            }
        }

        @components {
            btn {
                @compose inline-flex;
                @dark {
                    background-color: oklch(20% 0.03 250);
                }
                @media (width >= 42rem) {
                    .label:hover {
                        transform: scale(1);
                    }
                }
            }

            btn:hover {
                @compose block;
            }
        }

        @utilities {
            font:<~font-size|number> {
                font-size: --value();
                &:hover {
                    text-align: var(--align, center);
                }
            }

            text-<left|right> {
                text-align: --value();
            }
        }
    `, 'css')

    expectToken(tokens, '@defaults', 'keyword', ['directive'])
    expectToken(tokens, 'reset', 'class', ['selector'])
    expectToken(tokens, '@light', 'keyword', ['directive'])
    expectToken(tokens, '@components', 'keyword', ['directive'])
    expectToken(tokens, 'btn', 'class', ['selector'])
    expectToken(tokens, 'btn:hover', 'class', ['selector'])
    expectToken(tokens, '@compose', 'keyword', ['directive'])
    expectToken(tokens, 'inline-flex', 'enumMember')
    expectToken(tokens, '@dark', 'keyword', ['directive'])
    expectToken(tokens, '@utilities', 'keyword', ['directive'])
    expectToken(tokens, 'font', 'property')
    expectToken(tokens, 'font-size', 'variable', ['directive'])
    expectToken(tokens, 'number', 'enumMember', ['directive'])
    expectToken(tokens, '--value', 'function')
    expectToken(tokens, 'text-', 'class', ['selector'])
    expectToken(tokens, 'left', 'enumMember', ['selector'])
    expectToken(tokens, 'right', 'enumMember', ['selector'])
    expect(tokens).not.toContainEqual({ text: '@media', type: 'keyword', modifiers: [] })
    expect(tokens).not.toContainEqual({ text: 'label', type: 'class', modifiers: ['selector'] })
    expect(tokens).not.toContainEqual({ text: 'hover', type: 'modifier', modifiers: ['pseudoClass'] })
    expect(tokens).not.toContainEqual({ text: 'font-size', type: 'property', modifiers: [] })
    expect(tokens).not.toContainEqual({ text: 'var', type: 'function', modifiers: [] })
})

test.concurrent('renders CSS directive ranges with quoted semicolons', () => {
    const { tokens } = renderTokens(`
        @source not "a;b.css";
        @source required "critical.tsx";
        @reference "./a;b.css";
        @safelist "block fg:red";
        @blocklist "debug-*";
        @preserve native;

        .btn {
            @compose fg:red;
        }

        @custom-variant @quoted { @media (x: "a;b") { @slot; } }
    `, 'css')

    expectToken(tokens, '@source', 'keyword', ['directive'])
    expectToken(tokens, 'not', 'modifier', ['directive'])
    expectToken(tokens, 'required', 'modifier', ['directive'])
    expectToken(tokens, ';', 'operator', ['directive', 'directiveTerminator'])
    expectToken(tokens, '@safelist', 'keyword', ['directive'])
    expectToken(tokens, 'block', 'enumMember')
    expectToken(tokens, '@blocklist', 'keyword', ['directive'])
    expectToken(tokens, '@preserve', 'keyword', ['directive'])
    expectToken(tokens, 'native', 'enumMember', ['directive'])
    expectToken(tokens, '@compose', 'keyword', ['directive'])
    expectToken(tokens, 'fg', 'property')
    expectToken(tokens, 'red', 'enumMember')
    expectToken(tokens, '@custom-variant', 'keyword', ['directive'])
    expectToken(tokens, '@quoted', 'keyword', ['query'])
    expectToken(tokens, '@slot', 'keyword', ['directive'])
    expect(tokens).not.toContainEqual({ text: 'debug-*', type: 'string', modifiers: ['quoted'] })
})

test.concurrent('does not tokenize quoted compose preludes as class lists', () => {
    const { tokens } = renderTokens('.btn { @compose "block fg:red"; }', 'css')

    expectToken(tokens, '@compose', 'keyword', ['directive'])
    expect(tokens).not.toContainEqual({ text: 'block', type: 'enumMember', modifiers: [] })
    expect(tokens).not.toContainEqual({ text: 'fg', type: 'property', modifiers: [] })
})

test.concurrent('renders custom variant block semantic tokens for nested at-rules and selectors', () => {
    const { tokens } = renderTokens(`
        @custom-variant @supports-backdrop {
            @supports (backdrop-filter: blur(0)) {
                @slot;
            }
        }
        @custom-variant @card-wide {
            @container card (width >= 42rem) {
                @slot;
            }
        }
        @custom-variant @component {
            @layer components {
                @slot;
            }
        }
        @custom-variant @start {
            @starting-style {
                @slot;
            }
        }
        @custom-variant ::scrollbar {
            &::-webkit-scrollbar:is(.active, #thumb) {
                @slot;
            }
        }
    `, 'css')

    expectToken(tokens, '@custom-variant', 'keyword', ['directive'])
    expectToken(tokens, '@supports-backdrop', 'keyword', ['query'])
    expectToken(tokens, '@card-wide', 'keyword', ['query'])
    expectToken(tokens, '@component', 'keyword', ['query'])
    expectToken(tokens, '@start', 'keyword', ['query'])
    expectToken(tokens, '@slot', 'keyword', ['directive'])
    expectToken(tokens, 'scrollbar', 'variable', ['directive', 'query'])
    expect(tokens).not.toContainEqual({ text: '@supports', type: 'keyword', modifiers: ['query'] })
    expect(tokens).not.toContainEqual({ text: 'active', type: 'class', modifiers: ['selector'] })
})

test.concurrent('renders inline theme modifier semantic tokens', () => {
    const { tokens } = renderTokens('@theme inline { --color-primary: #123; }', 'css')

    expectToken(tokens, '@theme', 'keyword', ['directive'])
    expectToken(tokens, 'inline', 'modifier', ['directive'])
    expectToken(tokens, '--color-primary', 'variable')
})

test.concurrent('renders static theme modifier semantic tokens', () => {
    const { tokens } = renderTokens('@theme static { --color-primary: #123; }', 'css')

    expectToken(tokens, '@theme', 'keyword', ['directive'])
    expectToken(tokens, 'static', 'modifier', ['directive'])
    expectToken(tokens, '--color-primary', 'variable')
})

test.concurrent('does not render non-entry @master at-rules as CSS directives', () => {
    const { tokens } = renderTokens(`
        @master shake;
        @master no-shake;
    `, 'css')

    expect(tokens).not.toContainEqual({ text: '@master', type: 'keyword', modifiers: ['directive'] })
})

test.concurrent('does not render semantic tokens for native CSS-only documents', () => {
    const { tokens } = renderTokens(`
        @charset "utf-8";
        @import url("base.css") layer(theme) supports(display: grid);
        @namespace svg url("http://www.w3.org/2000/svg");
        /* @theme should remain a native comment */

        @font-face {
            font-family: "Inter";
            src: url("/fonts/inter.woff2") format("woff2");
            font-display: swap;
        }

        @property --angle {
            syntax: "<angle>";
            inherits: false;
            initial-value: 0deg;
        }

        @counter-style bullets {
            system: cyclic;
            symbols: "*" "\\2022";
            suffix: " ";
        }

        @font-feature-values Inter {
            @styleset {
                nice: 1;
            }
        }

        @font-palette-values --brand {
            font-family: "Bixa";
            base-palette: 1;
            override-colors: 0 #0f172a;
        }

        @page :first {
            margin: 1cm;
            @top-left {
                content: "Chapter";
            }
        }

        @position-try --bottom {
            inset-area: bottom;
            margin: 1rem;
        }

        @view-transition {
            navigation: auto;
        }

        @scope (.card) to (.content) {
            :scope {
                color: red;
            }
        }

        @starting-style {
            .card {
                opacity: 0;
            }
        }

        @document url("https://example.com/") {
            body {
                color: red;
            }
        }

        @keyframes fade {
            from {
                opacity: 0;
                transform: translateX(0);
            }

            to {
                opacity: 1;
                transform: translateX(var(--distance));
            }
        }

        @layer reset, theme, components;

        @media (width >= 48rem) {
            .card:hover::before {
                --distance: calc(100% - 1rem);
                color: red;
                content: "@utilities";
            }
        }

        @supports (container-type: inline-size) {
            @container card (width > 30rem) {
                @layer components {
                    .card:is(.active, #featured) {
                        animation: fade 1s ease-in-out;
                    }
                }
            }
        }
    `, 'css')

    expect(tokens).toEqual([])
})

test.concurrent('renders CSS document semantic tokens only inside Master directive ranges', () => {
    const nativeBefore = [
        '@font-face {',
        '    font-family: "Inter";',
        '    src: url("/fonts/inter.woff2") format("woff2");',
        '}',
        '@property --angle {',
        '    syntax: "<angle>";',
        '    inherits: false;',
        '    initial-value: 0deg;',
        '}',
        '@keyframes fade {',
        '    from { opacity: 0; transform: translateX(0); }',
        '    to { opacity: 1; transform: translateX(var(--distance)); }',
        '}',
        '@scope (.card) to (.content) {',
        '    :scope { color: red; }',
        '}',
        '.card:hover::before { color: red; }'
    ].join('\n')
    const themeDirective = [
        '@theme {',
        '    --color-primary: $color-blue-60/.8;',
        '}'
    ].join('\n')
    const nativeBetween = [
        '@layer reset, theme, components;',
        '@media (width >= 48rem) {',
        '    .panel { color: red; }',
        '}',
        '@supports (container-type: inline-size) {',
        '    @container card (width > 30rem) {',
        '        @layer components {',
        '            .panel:is(.active, #featured) { animation: fade 1s ease-in-out; }',
        '        }',
        '    }',
        '}'
    ].join('\n')
    const utilitiesDirective = [
        '@utilities {',
        '    text-<left|right> {',
        '        text-align: --value();',
        '    }',
        '}'
    ].join('\n')
    const content = [
        nativeBefore,
        themeDirective,
        nativeBetween,
        utilitiesDirective
    ].join('\n\n')
    const doc = createDoc('css', content)
    const languageService = new CSSLanguageService()
    const semanticTokens = languageService.renderSemanticTokens(doc)
    const tokens = decodeSemanticTokenRanges(doc, semanticTokens?.data ?? [])
    const masterRanges = [themeDirective, utilitiesDirective].map((directive) => {
        const start = content.indexOf(directive)
        return { start, end: start + directive.length }
    })
    const isInsideMasterRange = ({ start, end }: { start: number, end: number }) =>
        masterRanges.some((range) => range.start <= start && end <= range.end)
    const expectNoTokenOverlaps = (text: string, from = 0) => {
        const start = content.indexOf(text, from)
        expect(start).toBeGreaterThanOrEqual(0)
        const end = start + text.length
        expect(tokens.some((token) => token.start < end && token.end > start)).toBe(false)
    }

    expect(tokens.length).toBeGreaterThan(0)
    expect(tokens.every(isInsideMasterRange)).toBe(true)
    expect(tokens.map(({ text }) => text)).toEqual(expect.arrayContaining([
        '@theme',
        '--color-primary',
        '$color-blue-60',
        '@utilities',
        'text-',
        '--value'
    ]))
    expectNoTokenOverlaps('@keyframes')
    expectNoTokenOverlaps('fade')
    expectNoTokenOverlaps('from')
    expectNoTokenOverlaps('to')
    expectNoTokenOverlaps('.card')
    expectNoTokenOverlaps('opacity')
    expectNoTokenOverlaps('translateX')
    expectNoTokenOverlaps('red')
})

test.concurrent('renders CSS directives in SCSS-like sources', () => {
    const { tokens } = renderTokens(`
        $color: red;

        @theme {
            --color-primary: #123;
        }

        .btn {
            @compose block;
        }
    `, 'scss')

    expectToken(tokens, '@theme', 'keyword', ['directive'])
    expectToken(tokens, '--color-primary', 'variable')
    expectToken(tokens, '@compose', 'keyword', ['directive'])
    expectToken(tokens, 'block', 'enumMember')
})

test.concurrent('renders detailed CSS directive semantic tokens for Master syntax only', () => {
    const { tokens } = renderTokens(`
        @source not required "src/**/*.{ts,tsx}";
        @reference "./tokens.css";
        @blocklist "debug-*";
        @safelist "block fg:red:hover@md";

        @theme static brand {
            --color-primary: $color-blue-60/.8;
            --radius-card: 1rem;
        }

        @custom-variant :headings { &:is(h1, h2, h3, h4, h5, h6) { @slot; } }

        @components {
            btn {
                @compose inline-flex align-items:center fg:primary:hover@md;

                @variant @h>=sm&h<lg {
                    @compose block;
                }

                @variant ::scrollbar-thumb:hover@dark {
                    @compose fg:primary;
                }
            }
        }

        @utilities {
            text-decoration:<~color|*> {
                text-decoration: --value();
            }
        }
    `, 'css')

    expectToken(tokens, '@source', 'keyword', ['directive'])
    expectToken(tokens, 'not', 'modifier', ['directive'])
    expectToken(tokens, 'required', 'modifier', ['directive'])
    expectToken(tokens, '@reference', 'keyword', ['directive'])
    expectToken(tokens, '@blocklist', 'keyword', ['directive'])
    expectToken(tokens, '@safelist', 'keyword', ['directive'])
    expectToken(tokens, 'block', 'enumMember')
    expectToken(tokens, 'fg', 'property')
    expectToken(tokens, 'red', 'enumMember')
    expectToken(tokens, 'hover', 'modifier', ['pseudoClass'])
    expectToken(tokens, '@md', 'keyword', ['query'])
    expectToken(tokens, '@theme', 'keyword', ['directive'])
    expectToken(tokens, 'static', 'modifier', ['directive'])
    expectToken(tokens, 'brand', 'enumMember', ['directive'])
    expectToken(tokens, '--color-primary', 'variable')
    expectToken(tokens, '--radius-card', 'variable')
    expectToken(tokens, '$color-blue-60', 'variable')
    expectToken(tokens, '@custom-variant', 'keyword', ['directive'])
    expectToken(tokens, 'headings', 'variable', ['directive', 'query'])
    expectToken(tokens, '@slot', 'keyword', ['directive'])
    expectToken(tokens, '@components', 'keyword', ['directive'])
    expectToken(tokens, 'btn', 'class', ['selector'])
    expectToken(tokens, '@compose', 'keyword', ['directive'])
    expectToken(tokens, 'inline-flex', 'enumMember')
    expectToken(tokens, 'align-items', 'property')
    expectToken(tokens, 'center', 'enumMember')
    expectToken(tokens, 'primary', 'enumMember')
    expectToken(tokens, '@variant', 'keyword', ['directive'])
    expectToken(tokens, '@h', 'keyword', ['query'])
    expectToken(tokens, '>=', 'operator', ['query', 'queryOperator'])
    expectToken(tokens, 'sm', 'enumMember', ['query'])
    expectToken(tokens, '&', 'operator', ['query', 'queryOperator'])
    expectToken(tokens, 'h', 'property', ['query'])
    expectToken(tokens, '<', 'operator', ['query', 'queryOperator'])
    expectToken(tokens, 'lg', 'enumMember', ['query'])
    expectToken(tokens, 'scrollbar-thumb', 'modifier', ['pseudoElement'])
    expectToken(tokens, '@dark', 'keyword', ['query'])
    expectToken(tokens, '@utilities', 'keyword', ['directive'])
    expectToken(tokens, 'text-decoration', 'property')
    expectToken(tokens, 'color', 'variable', ['directive'])
    expectToken(tokens, '*', 'operator', ['directive'])
    expectToken(tokens, '--value', 'function')
    expect(tokens.some(({ text }) => text.includes('src/**/*'))).toBe(false)
    expect(tokens.some(({ text }) => text.includes('tokens.css'))).toBe(false)
    expect(tokens.some(({ text }) => text.includes('debug-'))).toBe(false)
    expect(tokens).not.toContainEqual({ text: 'h1', type: 'type', modifiers: ['selector'] })
})

test.concurrent('renders CSS directives in LESS-like sources', () => {
    const { tokens } = renderTokens(`
        @color: red;

        @theme {
            --color-primary: oklch(99% 0.0033 72);
        }

        @utilities {
            font:<~font-size|number> {
                font-size: --value();

                @light {
                    color: var(--color-primary);
                }
            }
        }
    `, 'less')

    expectToken(tokens, '@theme', 'keyword', ['directive'])
    expectToken(tokens, '--color-primary', 'variable')
    expectToken(tokens, '@utilities', 'keyword', ['directive'])
    expectToken(tokens, 'font', 'property')
    expectToken(tokens, 'font-size', 'variable', ['directive'])
    expectToken(tokens, 'number', 'enumMember', ['directive'])
    expectToken(tokens, '--value', 'function')
    expectToken(tokens, '@light', 'keyword', ['directive'])
    expect(tokens).not.toContainEqual({ text: 'oklch', type: 'function', modifiers: [] })
    expect(tokens).not.toContainEqual({ text: 'var', type: 'function', modifiers: [] })
})

test.concurrent('does not synthesize a closing directive brace for incomplete CSS blocks', () => {
    const { tokens } = renderTokens('@theme { --color-primary: red;', 'css')

    expectToken(tokens, '@theme', 'keyword', ['directive'])
    expectToken(tokens, '--color-primary', 'variable')
    expectToken(tokens, ';', 'operator', ['declarationTerminator'])
    expect(tokens).not.toContainEqual({ text: ';', type: 'operator', modifiers: ['directive', 'directiveTerminator'] })
})

test.concurrent('shares class position detection with semantic token spans', () => {
    const doc = createDoc('tsx', 'const x = clsx("fg:red", condition && `block`)')
    const languageService = new CSSLanguageService()

    expect(languageService.getClassPositions(doc).map((classPosition) => classPosition.token)).toEqual([
        'fg:red',
        'block'
    ])
})

test.concurrent('renders active semantic tokens for the class context at a position', () => {
    const content = '<div className="fg:red block:hover"></div>'
    const doc = createDoc('tsx', content)
    const languageService = new CSSLanguageService()
    const semanticTokens = languageService.renderSemanticTokensAtPosition(doc, doc.positionAt(content.indexOf('block') + 1))
    const tokens = decodeSemanticTokens(doc, semanticTokens?.data ?? [])

    expectToken(tokens, 'fg', 'property')
    expectToken(tokens, 'red', 'enumMember')
    expectToken(tokens, 'block', 'enumMember')
    expectToken(tokens, 'hover', 'modifier', ['pseudoClass'])
})

test.concurrent('renders active semantic tokens for a class context when the cursor is on whitespace', () => {
    const content = '<div className="fg:red block:hover p:md"></div>'
    const doc = createDoc('tsx', content)
    const languageService = new CSSLanguageService()
    const semanticTokens = languageService.renderSemanticTokensAtPosition(doc, doc.positionAt(content.indexOf(' block')))
    const tokens = decodeSemanticTokens(doc, semanticTokens?.data ?? [])

    expectToken(tokens, 'fg', 'property')
    expectToken(tokens, 'red', 'enumMember')
    expectToken(tokens, 'block', 'enumMember')
    expectToken(tokens, 'hover', 'modifier', ['pseudoClass'])
    expectToken(tokens, 'p', 'property')
    expectToken(tokens, 'md', 'enumMember')
})

test.concurrent('renders active semantic tokens only for the current class string context', () => {
    const content = 'const x = clsx("fg:red block", condition && "p:md flex")'
    const doc = createDoc('tsx', content)
    const languageService = new CSSLanguageService()
    const semanticTokens = languageService.renderSemanticTokensAtPosition(doc, doc.positionAt(content.indexOf('flex') + 1))
    const tokens = decodeSemanticTokens(doc, semanticTokens?.data ?? [])

    expectToken(tokens, 'p', 'property')
    expectToken(tokens, 'md', 'enumMember')
    expectToken(tokens, 'flex', 'enumMember')
    expect(tokens.some(({ text }) => text === 'fg' || text === 'red' || text === 'block')).toBe(false)
})

test.concurrent('skips full embedded semantic tokens in active mode', () => {
    const content = '<div className="fg:red block:hover"></div>'
    const doc = createDoc('tsx', content)
    const languageService = new CSSLanguageService({ embeddedSyntaxHighlighting: 'active' })

    expect(languageService.renderSemanticTokens(doc)).toBeUndefined()
})

test.concurrent('renders active semantic tokens for the CSS directive at a position', () => {
    const content = '@theme dark { --color-primary: $color-blue-60/.8; }\n.btn { color: red; }'
    const doc = createDoc('css', content)
    const languageService = new CSSLanguageService()
    const semanticTokens = languageService.renderSemanticTokensAtPosition(doc, doc.positionAt(content.indexOf('dark') + 1))
    const tokens = decodeSemanticTokens(doc, semanticTokens?.data ?? [])

    expectToken(tokens, '@theme', 'keyword', ['directive'])
    expectToken(tokens, 'dark', 'enumMember', ['directive'])
    expectToken(tokens, '--color-primary', 'variable')
    expectToken(tokens, '$color-blue-60', 'variable')
    expect(tokens.some(({ text }) => text === 'btn')).toBe(false)
})

test.concurrent('renders active semantic tokens for custom variant blocks', () => {
    const content = [
        '@custom-variant @motion-safe {',
        '    @media (prefers-reduced-motion: no-preference) {',
        '        @slot;',
        '    }',
        '}',
        '@custom-variant :interactive {',
        '    &:is(:hover, :focus-visible) {',
        '        @slot;',
        '    }',
        '}'
    ].join('\n')
    const doc = createDoc('css', content)
    const languageService = new CSSLanguageService()
    const semanticTokens = languageService.renderSemanticTokensAtPosition(doc, doc.positionAt(content.indexOf('prefers-reduced-motion') + 1))
    const tokens = decodeSemanticTokens(doc, semanticTokens?.data ?? [])

    expectToken(tokens, '@custom-variant', 'keyword', ['directive'])
    expectToken(tokens, '@motion-safe', 'keyword', ['query'])
    expectToken(tokens, '@slot', 'keyword', ['directive'])
    expect(tokens.some(({ text }) => text === 'interactive')).toBe(false)
})

test.concurrent('skips embedded semantic tokens when syntax highlighting is off', () => {
    const content = '<div className="fg:red block:hover"></div>'
    const doc = createDoc('tsx', content)
    const languageService = new CSSLanguageService({ embeddedSyntaxHighlighting: 'off' })

    expect(languageService.renderSemanticTokens(doc)).toBeUndefined()
    expect(languageService.renderSemanticTokensAtPosition(doc, doc.positionAt(content.indexOf('block') + 1))).toBeUndefined()
})

test.concurrent('renders CSS document semantic tokens when syntax highlighting is off', () => {
    const content = '@theme dark { --color-primary: $color-blue-60/.8; }\n.btn { color: red; }'
    const doc = createDoc('css', content)
    const languageService = new CSSLanguageService({ embeddedSyntaxHighlighting: 'off' })
    const semanticTokens = languageService.renderSemanticTokens(doc)
    const tokens = decodeSemanticTokens(doc, semanticTokens?.data ?? [])

    expectToken(tokens, '@theme', 'keyword', ['directive'])
    expectToken(tokens, 'dark', 'enumMember', ['directive'])
    expectToken(tokens, '--color-primary', 'variable')
    expectToken(tokens, '$color-blue-60', 'variable')
    expect(tokens.some(({ text }) => text === 'btn')).toBe(false)
})
