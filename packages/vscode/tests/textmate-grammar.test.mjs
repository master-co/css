import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, expect, test } from 'vitest'
import { INITIAL, Registry, parseRawGrammar } from 'vscode-textmate'
import { createOnigScanner, createOnigString, loadWASM } from 'vscode-oniguruma'
import cssGrammars from '@shikijs/langs/css'

const require = createRequire(import.meta.url)
const here = dirname(fileURLToPath(import.meta.url))
const packageDir = resolve(here, '..')
const grammarPath = resolve(packageDir, 'syntaxes', 'master-css.tmLanguage.json')
const grammarScope = 'master-css.directive.injection'
const cssGrammarScope = 'source.css'
const grammarSource = readFileSync(grammarPath, 'utf8')
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

function expectNoScope(tokens, text, scope) {
    expect(tokens.some((token) => token.text === text && token.scopes.includes(scope))).toBe(false)
}

test('does not change native CSS TextMate scopes when injected', () => {
    const nativeCSS = [
        '/* @theme should stay inside a native comment */',
        '@keyframes fade {',
        '    from { opacity: 0; transform: translateX(0); }',
        '    50% { opacity: .5; }',
        '    to { opacity: 1; transform: translateX(var(--distance)); }',
        '}',
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
    expectScope(tokens, 'inline', 'storage.modifier.master-css')
    expectScope(tokens, 'native', 'support.constant.property-value.master-css')
    expectScope(tokens, 'block', 'entity.other.attribute-name.class.master-css')
    expectScope(tokens, 'fg', 'support.type.property-name.master-css')
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
