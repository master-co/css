import assert from 'node:assert/strict'
import { test } from 'node:test'
import { organizationRedirects } from './organization-redirects'

test('organization redirects preserve published paths and point all locales to actual Master pages', () => {
    const rules = organizationRedirects()
    for (const locale of ['', '/en', '/tw']) {
        assert.ok(rules.includes(`${locale}/brand https://master.co/brand/master-css 301`))
        assert.ok(rules.includes(`${locale}/brand.md https://master.co/brand/master-css.md 301`))
        assert.ok(rules.includes(`${locale}/blog/master-css-next https://master.co/blog/master-css-next 301`))
        assert.ok(rules.includes(`${locale}/design-system/* https://master.co/design-system/:splat 301`))
    }
    assert.ok(!rules.some(rule => /\/blog\/(?:\*|v2)/.test(rule)))
    assert.ok(!rules.some(rule => /\/brand\/\*/.test(rule)))
    assert.equal(new Set(rules.map(rule => rule.split(' ')[0])).size, rules.length)
})
