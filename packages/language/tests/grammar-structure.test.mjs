// Node-native grammar integrity tests. These intentionally avoid package
// internals so broken JSON grammar files fail before VS Code packaging.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const packageDir = resolve(here, '..')
const syntaxesDir = resolve(packageDir, 'syntaxes')
const syntaxFiles = readdirSync(syntaxesDir)
    .filter((file) => file.endsWith('.json'))
    .sort()
const grammarFiles = syntaxFiles.filter((file) => file !== 'language-configuration.json')

function readSyntax(file) {
    return JSON.parse(readFileSync(resolve(syntaxesDir, file), 'utf8'))
}

function walk(node, visit, path = []) {
    if (!node || typeof node !== 'object') return
    visit(node, path)
    if (Array.isArray(node)) {
        node.forEach((item, index) => walk(item, visit, [...path, index]))
    } else {
        Object.entries(node).forEach(([key, value]) => walk(value, visit, [...path, key]))
    }
}

function collectLocalIncludes(grammar) {
    const includes = []
    walk(grammar, (node) => {
        if (typeof node.include === 'string' && node.include.startsWith('#')) {
            includes.push(node.include.slice(1))
        }
    })
    return includes
}

function collectReachableRepositoryKeys(grammar) {
    const repository = grammar.repository ?? {}
    const reachable = new Set()
    const pending = []
    for (const include of collectLocalIncludes({ patterns: grammar.patterns ?? [] })) {
        pending.push(include)
    }
    while (pending.length) {
        const key = pending.pop()
        if (!key || reachable.has(key)) continue
        reachable.add(key)
        const entry = repository[key]
        if (!entry) continue
        for (const include of collectLocalIncludes(entry)) {
            pending.push(include)
        }
    }
    return reachable
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

test('all syntax JSON files parse', () => {
    assert.ok(syntaxFiles.length >= 7)
    for (const file of syntaxFiles) {
        assert.doesNotThrow(() => readSyntax(file), file)
    }
})

test('TextMate grammar metadata matches file names', () => {
    const scopeNames = new Set()
    for (const file of grammarFiles) {
        const grammar = readSyntax(file)
        assert.equal(grammar.name, 'master-css', file)
        assert.match(grammar.scopeName, /^source\.master-css(?:\.injection-[a-z]+)?$/, file)
        assert.equal(`${grammar.scopeName.replace(/^source\./, '')}.json`, basename(file), file)
        assert.ok(Array.isArray(grammar.patterns) && grammar.patterns.length > 0, `${file} must expose top-level patterns`)
        assert.equal(scopeNames.has(grammar.scopeName), false, `${grammar.scopeName} is duplicated`)
        scopeNames.add(grammar.scopeName)
        if (file.includes('.injection-')) {
            assert.match(grammar.injectionSelector, /^L:/, `${file} must declare a left injection selector`)
        } else {
            assert.equal(grammar.scopeName, 'source.master-css')
            assert.equal(grammar.injectionSelector, undefined)
        }
    }
})

test('all local #include references resolve', () => {
    for (const file of grammarFiles) {
        const grammar = readSyntax(file)
        const repository = grammar.repository ?? {}
        const missing = collectLocalIncludes(grammar)
            .filter((key) => !repository[key])
            .map((key) => `#${key}`)
        assert.deepEqual([...new Set(missing)], [], file)
    }
})

test('all repository entries are reachable from top-level patterns', () => {
    for (const file of grammarFiles) {
        const grammar = readSyntax(file)
        const repositoryKeys = Object.keys(grammar.repository ?? {})
        const reachableKeys = collectReachableRepositoryKeys(grammar)
        const orphanKeys = repositoryKeys.filter((key) => !reachableKeys.has(key))
        assert.deepEqual(orphanKeys, [], file)
    }
})

test('grammar registration imports every syntax grammar', () => {
    const source = readFileSync(resolve(packageDir, 'src', 'grammars.ts'), 'utf8')
    for (const file of grammarFiles) {
        assert.match(source, new RegExp(`\\.\\.\\/syntaxes\\/${escapeRegExp(file)}`), file)
    }
    assert.match(source, /aliases:\s*declaration\.aliases/)
    assert.match(source, /vscodeEmbeddedLanguages:\s*{\s*'meta\.embedded\.block\.master-css\.class':\s*'master-css'\s*}/s)
})

test('grammar source does not contain known misspelled CSS pseudo selectors', () => {
    const raw = grammarFiles
        .map((file) => readFileSync(resolve(syntaxesDir, file), 'utf8'))
        .join('\n')
    assert.equal(raw.includes('placeholder\\\\-showen'), false)
    assert.equal(raw.includes('first\\\\-selector\\\\-button'), false)
    assert.equal(raw.includes('placeholder\\\\-shown'), true)
    assert.equal(raw.includes('file\\\\-selector-button'), true)
})
