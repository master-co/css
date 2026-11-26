import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { legacyDocsDestinations, legacyDocsRedirects } from './legacy-docs-redirects'

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../out')

test('v1 concept pages move to their v2 successor in the same language', () => {
    const rules = legacyDocsRedirects()
    assert.ok(rules.includes('/docs/setup /guide/installation 301'))
    assert.ok(rules.includes('/en/docs/setup/nextjs/ /guide/installation/nextjs 301'))
    assert.ok(rules.includes('/tw/docs/reusing-design.html /tw/guide/reusing-styles 301'))
    assert.equal(new Set(rules.map(rule => rule.split(' ')[0])).size, rules.length)
})

test('retired v1 property pages are not redirected to unrelated pages', () => {
    const sources = legacyDocsRedirects().map(rule => rule.split(' ')[0])
    assert.ok(!sources.some(source => source.includes('*')))
    for (const property of ['text-align', 'display', 'margin', 'dynamic-assignment', 'functions']) {
        assert.ok(!sources.includes(`/docs/${property}`))
    }
})

test('every destination is a built v2 page in each redirected language', { skip: !existsSync(out) && 'site/out is not built' }, () => {
    for (const destination of new Set(Object.values(legacyDocsDestinations))) {
        for (const locale of ['', '/tw']) assert.ok(existsSync(path.join(out, `${locale}${destination}.html`)), `missing ${locale}${destination}`)
    }
})
