// Node-native test (run with `node --test packages/language/tests/language-configuration.test.mjs`).
// Kept dependency-free so it can run without the package-level vitest setup.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const lcPath = resolve(here, '..', 'syntaxes', 'language-configuration.json')
const declPath = resolve(here, '..', 'src', 'declaration.ts')

test('language-configuration.json parses as JSON', () => {
    const raw = readFileSync(lcPath, 'utf8')
    assert.doesNotThrow(() => JSON.parse(raw))
})

test('language-configuration exposes line + block comments', () => {
    const lc = JSON.parse(readFileSync(lcPath, 'utf8'))
    assert.equal(lc.comments.lineComment, '//', 'lineComment must be // so VS Code can toggle comments inside meta.embedded.block.master-css.class regions of TS/JS host files (issue #361)')
    assert.deepEqual(lc.comments.blockComment, ['/*', '*/'])
})

test('language-configuration declares brackets + auto-closing pairs', () => {
    const lc = JSON.parse(readFileSync(lcPath, 'utf8'))
    assert.ok(Array.isArray(lc.brackets) && lc.brackets.length >= 3)
    assert.ok(Array.isArray(lc.autoClosingPairs) && lc.autoClosingPairs.length >= 3)
    assert.ok(Array.isArray(lc.surroundingPairs) && lc.surroundingPairs.length >= 3)
})

test('declaration.ts references the language-configuration', () => {
    const decl = readFileSync(declPath, 'utf8')
    assert.match(decl, /configuration:\s*['"]\.\/syntaxes\/language-configuration\.json['"]/)
})
