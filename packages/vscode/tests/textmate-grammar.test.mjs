import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, expect, test } from 'vitest'
import { INITIAL, Registry, parseRawGrammar } from 'vscode-textmate'
import { createOnigScanner, createOnigString, loadWASM } from 'vscode-oniguruma'

const require = createRequire(import.meta.url)
const here = dirname(fileURLToPath(import.meta.url))
const packageDir = resolve(here, '..')
const grammarPath = resolve(packageDir, 'syntaxes', 'master-css.tmLanguage.json')
const grammarScope = 'master-css.directive.injection'
const grammarSource = readFileSync(grammarPath, 'utf8')

let grammar

beforeAll(async () => {
    await loadWASM(readFileSync(require.resolve('vscode-oniguruma/release/onig.wasm')))
    const registry = new Registry({
        onigLib: Promise.resolve({
            createOnigScanner,
            createOnigString
        }),
        loadGrammar(scopeName) {
            if (scopeName !== grammarScope) return null
            return parseRawGrammar(grammarSource, grammarPath)
        }
    })
    grammar = await registry.loadGrammar(grammarScope)
})

function tokenize(source) {
    const tokens = []
    let ruleStack = INITIAL
    for (const line of source.split('\n')) {
        const result = grammar.tokenizeLine(line, ruleStack)
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
        font:<~font-size|number> {
            font-size: --value();
        }
        text-<left|center|right> {
            text-align: --value();
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
    const tokens = tokenize(`
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
