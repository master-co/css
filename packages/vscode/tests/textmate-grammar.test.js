import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { beforeAll, expect, test } from 'vitest'
import { INITIAL, Registry, parseRawGrammar } from 'vscode-textmate'
import { createOnigScanner, createOnigString, loadWASM } from 'vscode-oniguruma'
import cssGrammars from '@shikijs/langs/css'
import { MASTER_CSS_TEXTMATE_GRAMMAR } from '@master/css-language-service/shiki'

const require = createRequire(import.meta.url)
const grammarPath = require.resolve('@master/css-language-service/syntaxes/master-css.tmLanguage.json')
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

test('keeps shared grammar asset in sync with the language Shiki registration', () => {
  expect(sharedGrammar).toEqual(MASTER_CSS_TEXTMATE_GRAMMAR)
})

test('highlights class lists and static mixin parameters', () => {
  const tokens = tokenizeWith(injectedCSSGrammar, `@safelist "fg-red/0.5 fg-blue/.5 center:hover@sm color:red";
@mixin --size(--value <integer>) { width: var(--value); }
.card { @apply --size(3); }`)
  expectScope(tokens, 'fg-red', 'entity.other.attribute-name.class.master-css')
  expectScope(tokens, '/', 'keyword.operator.master-css')
  expectScope(tokens, '0.5', 'constant.numeric.master-css')
  expectScope(tokens, 'hover', 'entity.other.attribute-name.pseudo-class.master-css')
  expectScope(tokens, '@sm', 'keyword.control.at-rule.master-css.query')
  expectScope(tokens, '--size', 'variable.css.custom-property.master-css')
  expectScope(tokens, '--value', 'variable.css.custom-property.master-css')
  expectScope(tokens, '<integer>', 'support.function.misc.master-css')
  expectScope(tokens, '@apply', 'keyword.control.at-rule.master-css')
})

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

test('delegates top-level keyframes and scoped theme declarations to native CSS', () => {
  const tokens = tokenizeWith(injectedCSSGrammar, `@theme { --font-sans: "Inter";  }
@keyframes zoom { 0% { transform: scale(0); } to { transform: none; } }`)
  expectScope(tokens, 'zoom', 'variable.parameter.keyframe-list.css')
  expectScope(tokens, '0%', 'entity.other.keyframe-offset.percentage.css')
  expectScope(tokens, 'to', 'entity.other.keyframe-offset.css')
  expectNoScope(tokens, 'to', 'entity.other.attribute-name.class.master-css')
  expectScope(tokens, 'transform', 'support.type.property-name.css')
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

test('highlights all retained directive keywords', () => {
  const source = `@source not "app.tsx";
@safelist "block";
@blocklist "debug-*";
@preserve native;
@prune native;
@reference "./tokens.css";
@theme { --color: red;  }
@mixin --box { display: block; }
@custom-media --wide (width >= 48rem);
@mixin --hocus { &:hover { @contents; } }
.box { @media (--wide) { display: grid; } }`
  const tokens = tokenizeWith(injectedCSSGrammar, source)
  for (const name of ['source', 'safelist', 'blocklist', 'preserve', 'prune', 'reference', 'theme', 'mixin', 'contents']) {
    expectScope(tokens, `@${name}`, 'keyword.control.at-rule.master-css')
  }
})

test('keeps source and reference paths separate from class lists', () => {
  const tokens = tokenizeWith(injectedCSSGrammar, `@source not "src/**/*.{ts,tsx}";
@reference "./tokens.css";
@blocklist "debug-*";
@safelist "dialog-open block:hover@sm";`)
  expectScope(tokens, 'dialog-open', 'entity.other.attribute-name.class.master-css')
  expectScope(tokens, '@sm', 'keyword.control.at-rule.master-css.query')
  for (const value of ['src', 'tokens', 'debug-']) expectNoSomeScope(tokens, value, 'entity.other.attribute-name.class.master-css')
})

test('highlights explicit custom-variant slots and native wrappers', () => {
  const tokens = tokenizeWith(injectedCSSGrammar, `@mixin --hocus { &:is(:hover,:focus) { @contents; } }
@mixin --card { @apply --hocus { color: red; } @media print { display: block; } }`)
  expectScope(tokens, '--hocus', 'variable.css.custom-property.master-css')
  expectScope(tokens, '@apply', 'keyword.control.at-rule.master-css')
  expectScope(tokens, '@contents', 'keyword.control.at-rule.master-css')
  expectScope(tokens, '--card', 'variable.css.custom-property.master-css')
})

test('colors named conditions and delegates native at-rules', () => {
  const tokens = tokenizeWith(injectedCSSGrammar, `@mixin --card { @media (--wide) { display: block; } }
@mixin --supported { @supports (display: grid) { @contents; } }
@mixin --contained { @container (width > 30rem) { @contents; } }`)
  const query = tokens.find(token => token.text.includes('--wide'))
  expect(query).toBeDefined()
  expect(query.scopes.at(-1)).toBe(tokenizeWith(nativeCSSGrammar, '@media (--wide) {}').find(token => token.text.includes('--wide')).scopes.at(-1))
  for (const [rule, condition] of [['@supports', '(display: grid)'], ['@container', '(width > 30rem)']]) {
    const name = rule.slice(1)
    const native = tokenizeWith(nativeCSSGrammar, `${rule} ${condition} {}`).find(token => token.text === name)
    const nested = tokens.find(token => token.text === name)
    expect(nested?.scopes.at(-1)).toBe(native?.scopes.at(-1))
  }
})

test('removed directives do not receive active directive scopes', () => {
  const tokens = tokenizeWith(injectedCSSGrammar, '@master entry; @settings {} @mode dark {} @utilities {} .x { @compose block; @dark {} @light {} }')
  expect(tokens.filter(token => token.scopes.includes('keyword.control.at-rule.master-css'))).toEqual([])
})

test('leaves removed compose directives to native CSS highlighting', () => {
  const source = '.card { @compose fg-red block:hover@sm; }'
  expect(tokenizeWith(injectedCSSGrammar, source)).toEqual(tokenizeWith(nativeCSSGrammar, source))
})

test('does not highlight directives inside comments or quoted strings', () => {
  const tokens = tokenizeWith(injectedCSSGrammar, '\n    /* @theme {}\n */\n    .btn::before {\n      content: "@utilities";\n    }\n    @theme {}\n\n  ')
  const directiveTokens = tokens.filter((token) => token.scopes.includes('keyword.control.at-rule.master-css'))

  expect(directiveTokens).toEqual([
    expect.objectContaining({ text: '@theme' })
  ])
})
