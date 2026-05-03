// Shiki uses the same TextMate grammar shape consumed by VS Code. These smoke
// tests catch regex and injection regressions that pure JSON checks cannot.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHighlighter } from 'shiki'

const here = dirname(fileURLToPath(import.meta.url))
const packageDir = resolve(here, '..')
const syntaxesDir = resolve(packageDir, 'syntaxes')
const theme = 'vitesse-light'

function readGrammar(file) {
    return JSON.parse(readFileSync(resolve(syntaxesDir, file), 'utf8'))
}

function clone(value) {
    return JSON.parse(JSON.stringify(value))
}

function scopesOf(token) {
    return (token.explanation ?? []).flatMap((explanation) =>
        explanation.scopes.map((scope) => scope.scopeName)
    )
}

function tokensFor(highlighter, code, lang) {
    return highlighter.codeToTokens(code, {
        lang,
        theme,
        includeExplanation: true
    }).tokens.flat()
}

function assertTokenScope(tokens, content, scope) {
    assert.ok(
        tokens.some((token) => token.content === content && scopesOf(token).includes(scope)),
        `Expected token ${JSON.stringify(content)} to include ${scope}. Actual tokens:\n` +
        tokens.map((token) => `${JSON.stringify(token.content)} ${scopesOf(token).join(' ')}`).join('\n')
    )
}

function assertNoTokenScope(tokens, content, scope) {
    assert.equal(
        tokens.some((token) => token.content === content && scopesOf(token).includes(scope)),
        false,
        `Did not expect token ${JSON.stringify(content)} to include ${scope}`
    )
}

const coreGrammar = readGrammar('master-css.json')
const coreHighlighter = await createHighlighter({
    themes: [theme],
    langs: [coreGrammar]
})

const jsInjection = clone(readGrammar('master-css.injection-js.json'))
jsInjection.injectTo = ['source.js']
const reactInjection = clone(readGrammar('master-css.injection-react.json'))
reactInjection.injectTo = ['source.tsx']
const embeddedHighlighter = await createHighlighter({
    themes: [theme],
    langs: [
        'js',
        'tsx',
        coreGrammar,
        jsInjection,
        reactInjection
    ]
})

test('core grammar highlights Master CSS declaration, selector, and at tokens', () => {
    const tokens = tokensFor(coreHighlighter, 'fg:red:hover@sm', 'master-css')
    assertTokenScope(tokens, 'fg', 'support.type.property-name.css')
    assertTokenScope(tokens, ':', 'punctuation.separator.key-value.css')
    assertTokenScope(tokens, 'red', 'support.constant.property-value.css')
    assertTokenScope(tokens, 'hover', 'entity.other.attribute-name.pseudo-class.css')
    assertTokenScope(tokens, '@sm', 'keyword.control.at-rule')
})

test('core grammar highlights grouped declarations and separators', () => {
    const tokens = tokensFor(coreHighlighter, '{fg:red;bg:blue}', 'master-css')
    assertTokenScope(tokens, '{', 'punctuation.section.property-list.begin')
    assertTokenScope(tokens, 'fg', 'support.type.property-name.css')
    assertTokenScope(tokens, ';', 'master-css.class.split')
    assertTokenScope(tokens, 'bg', 'support.type.property-name.css')
    assertTokenScope(tokens, '}', 'punctuation.section.property-list.end')
})

test('core grammar highlights functions, numeric values, units, and value separators', () => {
    const tokens = tokensFor(coreHighlighter, 'translate(10x|20px)', 'master-css')
    assertTokenScope(tokens, 'translate', 'support.function.misc.css')
    assertTokenScope(tokens, '10', 'constant.numeric.css')
    assertTokenScope(tokens, 'x', 'keyword.other.unit')
    assertTokenScope(tokens, '|', 'comment.block')
    assertTokenScope(tokens, '20', 'constant.numeric.css')
    assertTokenScope(tokens, 'px', 'keyword.other.unit')
})

test('core grammar highlights real pseudo classes instead of stale misspellings', () => {
    const tokens = tokensFor(coreHighlighter, 'fg:red:placeholder-shown', 'master-css')
    assertTokenScope(tokens, 'placeholder-shown', 'entity.other.attribute-name.pseudo-class.css')
    assertNoTokenScope(tokens, 'placeholder-showen', 'entity.other.attribute-name.pseudo-class.css')
})

test('core grammar highlights file selector button pseudo element', () => {
    const tokens = tokensFor(coreHighlighter, 'fg:red::file-selector-button', 'master-css')
    assertTokenScope(tokens, '::', 'entity.other.attribute-name.pseudo-element.css')
    assertTokenScope(tokens, 'file-selector-button', 'entity.other.attribute-name.pseudo-element.css')
})

test('JS injection highlights configured class function strings only', () => {
    const highlighted = tokensFor(embeddedHighlighter, 'const x = clsx(\'fg:red hover\')', 'js')
    assertTokenScope(highlighted, 'fg', 'support.type.property-name.css')
    assertTokenScope(highlighted, 'red', 'support.constant.property-value.css')

    const plain = tokensFor(embeddedHighlighter, 'const plain = \'fg:red\'', 'js')
    assertNoTokenScope(plain, 'fg:red', 'support.type.property-name.css')
})

test('JS injection highlights DOM classList mutations', () => {
    const tokens = tokensFor(embeddedHighlighter, 'document.body.classList.add(\'fg:red\')', 'js')
    assertTokenScope(tokens, 'add', 'entity.name.function')
    assertTokenScope(tokens, 'fg', 'support.type.property-name.css')
    assertTokenScope(tokens, 'red', 'support.constant.property-value.css')
})

test('JS injection highlights tagged class templates', () => {
    const tokens = tokensFor(embeddedHighlighter, 'const x = clsx`fg:red`', 'js')
    assertTokenScope(tokens, 'clsx', 'entity.name.function')
    assertTokenScope(tokens, 'fg', 'support.type.property-name.css')
    assertTokenScope(tokens, 'red', 'support.constant.property-value.css')
})

test('React injection preserves quote scopes and highlights class attributes', () => {
    const single = tokensFor(embeddedHighlighter, '<div className=\'fg:red\'></div>', 'tsx')
    assertTokenScope(single, '\'', 'string.quoted.single.html')
    assertTokenScope(single, 'fg', 'support.type.property-name.css')

    const double = tokensFor(embeddedHighlighter, '<div className="fg:red"></div>', 'tsx')
    assertTokenScope(double, '"', 'string.quoted.double.html')
    assertTokenScope(double, 'red', 'support.constant.property-value.css')
})

test('React injection highlights class function calls inside attribute bindings', () => {
    const tokens = tokensFor(embeddedHighlighter, '<div className={clsx(\'fg:red\')}></div>', 'tsx')
    assertTokenScope(tokens, 'fg', 'support.type.property-name.css')
    assertTokenScope(tokens, 'red', 'support.constant.property-value.css')
})
