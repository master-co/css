import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { beforeAll, expect, test } from 'vitest'
import { INITIAL, Registry, parseRawGrammar } from 'vscode-textmate'
import { createOnigScanner, createOnigString, loadWASM } from 'vscode-oniguruma'
import cssGrammars from '@shikijs/langs/css'
import { MASTER_CSS_TEXTMATE_GRAMMAR } from '../../language/src/shiki'

const require = createRequire(import.meta.url)
const grammarPath = require.resolve('@master/css-language/syntaxes/master-css.tmLanguage.json')
const grammarScope = 'master-css.directive.injection'
const cssGrammarScope = 'source.css'
const grammarSource = readFileSync(grammarPath, 'utf8')
const sharedGrammar = JSON.parse(grammarSource)
const cssGrammar = cssGrammars[cssGrammars.length - 1]

let grammar
let nativeCSSGrammar
let injectedCSSGrammar

const onigLib = Promise.resolve({
    createOnigScanner,
    createOnigString
})

function loadGrammar(scopeName) {
    if (scopeName === grammarScope) return parseRawGrammar(grammarSource, grammarPath)
    if (scopeName === cssGrammarScope) return parseRawGrammar(JSON.stringify(cssGrammar), 'css.tmLanguage.json')
    return null
}

function createRegistry(includeInjection = false) {
    return new Registry({
        onigLib,
        getInjections(scopeName) {
            return includeInjection && scopeName === cssGrammarScope ? [grammarScope] : []
        },
        loadGrammar
    })
}

beforeAll(async () => {
    await loadWASM(readFileSync(require.resolve('vscode-oniguruma/release/onig.wasm')))
    const registry = createRegistry()
    const nativeCSSRegistry = createRegistry()
    const injectedCSSRegistry = createRegistry(true)

    grammar = await registry.loadGrammar(grammarScope)
    nativeCSSGrammar = await nativeCSSRegistry.loadGrammar(cssGrammarScope)
    injectedCSSGrammar = await injectedCSSRegistry.loadGrammar(cssGrammarScope)
})

test('keeps shared grammar asset in sync with the language Shiki registration', () => {
    expect(sharedGrammar).toEqual(MASTER_CSS_TEXTMATE_GRAMMAR)
})

function tokenizeWith(targetGrammar, source) {
    const tokens = []
    let ruleStack = INITIAL
    for (const line of source.split('\n')) {
        const result = targetGrammar.tokenizeLine(line, ruleStack)
        for (const token of result.tokens) {
            tokens.push({
                text: line.slice(token.startIndex, token.endIndex),
                scopes: token.scopes
            })
        }
        ruleStack = result.ruleStack
    }
    return tokens
}

function tokenize(source) {
    return tokenizeWith(grammar, source)
}

function expectScope(tokens, text, scope) {
    expect(tokens).toContainEqual(expect.objectContaining({
        text,
        scopes: expect.arrayContaining([scope])
    }))
}

function expectSomeScope(tokens, text, scope) {
    expect(tokens.some((token) => token.text.includes(text) && token.scopes.includes(scope))).toBe(true)
}

function expectNoSomeScope(tokens, text, scope) {
    expect(tokens.some((token) => token.text.includes(text) && token.scopes.includes(scope))).toBe(false)
}

function expectNoScope(tokens, text, scope) {
    expect(tokens.some((token) => token.text === text && token.scopes.includes(scope))).toBe(false)
}

test('does not change native CSS TextMate scopes when injected', () => {
    const nativeCSS = [
        '@charset "utf-8";',
        '@import url("base.css") layer(theme) supports(display: grid);',
        '@namespace svg url("http://www.w3.org/2000/svg");',
        '/* @theme should stay inside a native comment */',
        '@font-face {',
        '    font-family: "Inter";',
        '    src: url("/fonts/inter.woff2") format("woff2");',
        '    font-display: swap;',
        '}',
        '',
        '@property --angle {',
        '    syntax: "<angle>";',
        '    inherits: false;',
        '    initial-value: 0deg;',
        '}',
        '',
        '@counter-style bullets {',
        '    system: cyclic;',
        '    symbols: "*" "\\\\2022";',
        '    suffix: " ";',
        '}',
        '',
        '@font-feature-values Inter {',
        '    @styleset {',
        '        nice: 1;',
        '    }',
        '}',
        '',
        '@font-palette-values --brand {',
        '    font-family: "Bixa";',
        '    base-palette: 1;',
        '    override-colors: 0 #0f172a;',
        '}',
        '',
        '@page :first {',
        '    margin: 1cm;',
        '    @top-left {',
        '        content: "Chapter";',
        '    }',
        '}',
        '',
        '@position-try --bottom {',
        '    inset-area: bottom;',
        '    margin: 1rem;',
        '}',
        '',
        '@view-transition {',
        '    navigation: auto;',
        '}',
        '',
        '@scope (.card) to (.content) {',
        '    :scope {',
        '        color: red;',
        '    }',
        '}',
        '',
        '@starting-style {',
        '    .card {',
        '        opacity: 0;',
        '    }',
        '}',
        '',
        '@document url("https://example.com/") {',
        '    body {',
        '        color: red;',
        '    }',
        '}',
        '',
        '@keyframes fade {',
        '    from { opacity: 0; transform: translateX(0); }',
        '    50% { opacity: .5; }',
        '    to { opacity: 1; transform: translateX(var(--distance)); }',
        '}',
        '',
        '@layer reset, theme, components;',
        '',
        '@media (width >= 48rem) {',
        '    .card:hover::before, button[aria-expanded="true"] {',
        '        --distance: calc(100% - 1rem);',
        '        color: oklch(99% 0.0033 72);',
        '        content: "@utilities";',
        '    }',
        '}',
        '',
        '@supports (container-type: inline-size) {',
        '    @container card (width > 30rem) {',
        '        @layer components {',
        '            .card:is(.active, #featured) {',
        '                animation: fade 1s ease-in-out;',
        '            }',
        '        }',
        '    }',
        '}'
    ].join('\n')
    const nativeTokens = tokenizeWith(nativeCSSGrammar, nativeCSS)
    const injectedTokens = tokenizeWith(injectedCSSGrammar, nativeCSS)

    expect(nativeTokens).toContainEqual(expect.objectContaining({
        text: 'fade',
        scopes: expect.arrayContaining(['variable.parameter.keyframe-list.css'])
    }))
    expect(nativeTokens).toContainEqual(expect.objectContaining({
        text: 'from',
        scopes: expect.arrayContaining(['entity.other.keyframe-offset.css'])
    }))
    expect(nativeTokens).toContainEqual(expect.objectContaining({
        text: 'to',
        scopes: expect.arrayContaining(['entity.other.keyframe-offset.css'])
    }))
    expect(injectedTokens).toEqual(nativeTokens)
})

test('documents native CSS punctuation scopes used by semantic token mappings', () => {
    const nativeCSS = [
        'main > .card:hover::before, button[aria-expanded="true"] {',
        '    color: red !important;',
        '    transform: translate(10px, 20px);',
        '    content: "a|b";',
        '    --token: var(--brand);',
        '}',
        '@media (pointer: coarse) and (width >= 48rem) {',
        '    .card { margin: 1rem; }',
        '}'
    ].join('\n')
    const tokens = tokenizeWith(nativeCSSGrammar, nativeCSS)

    expectScope(tokens, '{', 'punctuation.section.property-list.begin.bracket.curly.css')
    expectScope(tokens, '}', 'punctuation.section.property-list.end.bracket.curly.css')
    expectScope(tokens, ':', 'punctuation.separator.key-value.css')
    expectScope(tokens, ';', 'punctuation.terminator.rule.css')
    expectScope(tokens, '>', 'keyword.operator.combinator.css')
    expectScope(tokens, '.', 'punctuation.definition.entity.css')
    expectScope(tokens, ':', 'punctuation.definition.entity.css')
    expectScope(tokens, '::', 'punctuation.definition.entity.css')
    expectScope(tokens, ',', 'punctuation.separator.list.comma.css')
    expectScope(tokens, '[', 'punctuation.definition.entity.begin.bracket.square.css')
    expectScope(tokens, ']', 'punctuation.definition.entity.end.bracket.square.css')
    expectScope(tokens, '(', 'punctuation.section.function.begin.bracket.round.css')
    expectScope(tokens, ')', 'punctuation.section.function.end.bracket.round.css')
    expectScope(tokens, '(', 'punctuation.definition.parameters.begin.bracket.round.css')
    expectScope(tokens, ')', 'punctuation.definition.parameters.end.bracket.round.css')
    expectScope(tokens, '>=', 'keyword.operator.comparison.css')
    expectScope(tokens, '!important', 'keyword.other.important.css')
    expectScope(tokens, '"', 'punctuation.definition.string.begin.css')
    expectScope(tokens, '"', 'punctuation.definition.string.end.css')
    expectScope(tokens, '--token', 'variable.css')
})

test('highlights every Master CSS directive keyword', () => {
    const tokens = tokenize(`
        @master;
        @settings {}
        @source not "app.tsx";
        @safelist "block";
        @blocklist "debug-*";
        @preserve native;
        @reference "./tokens.css";
        @theme {}
        @defaults {}
        @components {}
        @utilities {}
        @custom-variant @motion-safe {}
        @compose block;
        @variant @sm {}
        @slot;
        @dark {}
        @light {}
    `)

    for (const directive of [
        'master',
        'settings',
        'source',
        'safelist',
        'blocklist',
        'preserve',
        'reference',
        'theme',
        'defaults',
        'components',
        'utilities',
        'custom-variant',
        'compose',
        'variant',
        'slot',
        'dark',
        'light'
    ]) {
        expectScope(tokens, directive, 'keyword.control.at-rule.master-css')
    }
})

test('highlights directive preludes, strings, class lists, and dynamic patterns', () => {
    const tokens = tokenize(`
        @source not required "src/**/*.{ts,tsx}";
        @reference './tokens.css';
        @blocklist "debug-*";
        @theme inline dark {}
        @preserve native;
        @safelist "block fg:red:hover@md";
        @compose inline-flex fg:primary:hover@md;
        @utilities {
            font:<~font-size|number> {
                font-size: --value();
            }
            text-<left|center|right> {
                text-align: --value();
            }
        }
    `)

    expectScope(tokens, 'not', 'storage.modifier.master-css')
    expectScope(tokens, 'required', 'storage.modifier.master-css')
    expectSomeScope(tokens, 'src', 'string.quoted.double.master-css')
    expectSomeScope(tokens, 'tokens', 'string.quoted.single.master-css')
    expectSomeScope(tokens, 'debug-', 'string.quoted.double.master-css')
    expectNoSomeScope(tokens, 'src', 'entity.other.attribute-name.class.master-css')
    expectNoSomeScope(tokens, 'tokens', 'entity.other.attribute-name.class.master-css')
    expectNoSomeScope(tokens, 'debug-', 'entity.other.attribute-name.class.master-css')
    expectScope(tokens, 'inline', 'storage.modifier.master-css')
    expectScope(tokens, 'dark', 'support.constant.property-value.master-css')
    expectScope(tokens, 'native', 'support.constant.property-value.master-css')
    expectScope(tokens, 'block', 'entity.other.attribute-name.class.master-css')
    expectScope(tokens, 'inline-flex', 'entity.other.attribute-name.class.master-css')
    expectScope(tokens, 'fg', 'support.type.property-name.master-css')
    expectScope(tokens, 'primary', 'support.constant.property-value.master-css')
    expectScope(tokens, 'hover', 'entity.other.attribute-name.pseudo-class.master-css')
    expectScope(tokens, 'md', 'keyword.control.at-rule.master-css.query')
    expectScope(tokens, 'font', 'support.type.property-name.master-css')
    expectScope(tokens, '~', 'keyword.operator.master-css')
    expectScope(tokens, 'font-size', 'variable.parameter.master-css')
    expectScope(tokens, 'number', 'variable.parameter.master-css')
    expectScope(tokens, 'text-', 'entity.other.attribute-name.class.master-css')
    expectScope(tokens, 'left', 'support.constant.property-value.master-css')
    expectScope(tokens, 'center', 'support.constant.property-value.master-css')
    expectScope(tokens, '--value', 'support.function.misc.master-css')
})

test('highlights custom variants, nested selectors, queries, and values', () => {
    const tokens = tokenize(`
        @custom-variant @motion-safe { @media (prefers-reduced-motion: no-preference) { @slot; } }
        @custom-variant ::scrollbar { &::-webkit-scrollbar:is(.active, #thumb) { @slot; } }
        @dark {
            color: oklch(99% 0.0033 72);
            background-color: $color-gray-100;
        }
    `)

    expectScope(tokens, 'custom-variant', 'keyword.control.at-rule.master-css')
    expectScope(tokens, 'motion-safe', 'keyword.control.at-rule.master-css.query')
    expectScope(tokens, 'media', 'keyword.control.at-rule.master-css.query')
    expectScope(tokens, 'slot', 'keyword.control.at-rule.master-css')
    expectScope(tokens, '::', 'punctuation.definition.entity.master-css')
    expectScope(tokens, '&', 'keyword.operator.selector.master-css')
    expectScope(tokens, '.', 'punctuation.definition.entity.master-css')
    expectScope(tokens, 'active', 'entity.other.attribute-name.class.master-css')
    expectScope(tokens, '#', 'punctuation.definition.entity.master-css')
    expectScope(tokens, 'thumb', 'variable.other.master-css')
    expectScope(tokens, '$color-gray-100', 'variable.other.master-css')
    expectNoScope(tokens, 'oklch', 'support.function.misc.master-css')
    expectNoScope(tokens, '99% 0.0033 72', 'constant.numeric.master-css')
})

test('highlights detailed Master directive syntax without misclassifying native pieces', () => {
    const tokens = tokenize(`
        @theme static brand {
            /* Font families */
            --color-primary: $color-blue-60/.8;
            --radius-card: 1rem;
            --tracking-tightest: -0.072em;
        }

        @source not required "src/**/*.{ts,tsx}";
        @reference "./tokens.css";
        @blocklist "debug-*";
        @safelist "dialog-open bg:primary@dark {fg:red;bg:blue}";

        @custom-variant :headings { &:is(h1, h2, h3, h4, h5, h6) { @slot; } }

        @components {
            btn:hover {
                @compose static native inline-flex align-items:center fg:primary:hover@md;
                @variant @h>=sm&h<lg {
                    @compose block;
                }
                @variant ::scrollbar-thumb:hover@dark {
                    @compose fg:primary;
                }
            }
        }

        @utilities {
            content-auto {
                content-visibility: auto;
            }

            text-decoration:<~color|*> {
                text-decoration: --value();
            }
        }
    `)

    expectScope(tokens, 'static', 'storage.modifier.master-css')
    expectScope(tokens, 'brand', 'support.constant.property-value.master-css')
    expectSomeScope(tokens, 'Font families', 'comment.block.css')
    expectScope(tokens, '--color-primary', 'variable.css.custom-property.master-css')
    expectScope(tokens, '$color-blue-60', 'variable.other.master-css')
    expectScope(tokens, '-0.072', 'constant.numeric.css')
    expectScope(tokens, 'em', 'keyword.other.unit.em.css')
    expectScope(tokens, 'dialog-open', 'entity.other.attribute-name.class.master-css')
    expectScope(tokens, 'bg', 'support.type.property-name.master-css')
    expectScope(tokens, 'primary', 'support.constant.property-value.master-css')
    expectScope(tokens, 'dark', 'keyword.control.at-rule.master-css.query')
    expectScope(tokens, 'headings', 'entity.other.attribute-name.pseudo-class.master-css')
    expectScope(tokens, 'h1', 'entity.name.tag.master-css')
    expectScope(tokens, 'btn', 'entity.other.attribute-name.class.master-css')
    expectScope(tokens, 'static', 'entity.other.attribute-name.class.master-css')
    expectScope(tokens, 'native', 'entity.other.attribute-name.class.master-css')
    expectScope(tokens, 'inline-flex', 'entity.other.attribute-name.class.master-css')
    expectScope(tokens, 'align-items', 'support.type.property-name.master-css')
    expectScope(tokens, 'center', 'support.constant.property-value.master-css')
    expectScope(tokens, 'h', 'keyword.control.at-rule.master-css.query')
    expectScope(tokens, 'sm', 'support.constant.property-value.master-css.query')
    expectScope(tokens, 'lg', 'support.constant.property-value.master-css.query')
    expectScope(tokens, 'scrollbar-thumb', 'entity.other.attribute-name.pseudo-class.master-css')
    expectScope(tokens, 'text-decoration', 'support.type.property-name.master-css')
    expectScope(tokens, 'color', 'variable.parameter.master-css')
    expectScope(tokens, '*', 'keyword.operator.master-css')
    expectScope(tokens, '--value', 'support.function.misc.master-css')
    expectNoSomeScope(tokens, 'src', 'entity.other.attribute-name.class.master-css')
    expectNoSomeScope(tokens, 'tokens', 'entity.other.attribute-name.class.master-css')
    expectNoSomeScope(tokens, 'debug-', 'entity.other.attribute-name.class.master-css')
})

test('does not highlight directives inside comments or quoted strings', () => {
    const tokens = tokenizeWith(injectedCSSGrammar, `
        /* @theme {} */
        .btn::before {
            content: "@utilities";
        }
        @theme {}
    `)
    const directiveTokens = tokens.filter((token) => token.scopes.includes('keyword.control.at-rule.master-css'))

    expect(directiveTokens).toEqual([
        expect.objectContaining({ text: 'theme' })
    ])
})
