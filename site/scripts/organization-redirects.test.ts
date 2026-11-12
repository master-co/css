import assert from 'node:assert/strict'
import { test } from 'node:test'
import { organizationRedirects, legacyDesignAssets } from './organization-redirects'
import manifest from '@master/internal-site/data/legacy-design-routes.json' with { type: 'json' }
import { legacyDesignRedirects } from '@master/internal-site/build/legacy-design-routes.ts'

test('organization redirects preserve published paths and point all locales to actual Master pages', () => {
    const rules = organizationRedirects(false)
    for (const locale of ['', '/en', '/tw', '/ja', '/ko', '/cn']) {
        const destinationLocale = locale === '/en' ? '' : locale
        assert.ok(rules.includes(`${locale}/brand https://master.co${destinationLocale}/brand/master-css 301`))
        assert.ok(rules.includes(`${locale}/brand.md https://master.co${destinationLocale}/brand/master-css.md 301`))
        assert.ok(rules.includes(`${locale}/blog/master-css-next https://master.co${destinationLocale}/blog/master-css-next 301`))
        assert.ok(rules.includes(`${locale}/design-system/* https://master.co${destinationLocale}/design-system/:splat 301`))
    }
    assert.ok(!rules.some(rule => /\/blog\/(?:\*|v2)/.test(rule)))
    assert.ok(!rules.some(rule => /\/brand\/\*/.test(rule)))
    assert.equal(new Set(rules.map(rule => rule.split(' ')[0])).size, rules.length)
})

test('cutover consumes the shared exact route inventory and emits real gone responses', () => {
    const rules = organizationRedirects(true)
    for (const rule of legacyDesignRedirects(manifest)) assert.ok(rules.includes(rule))
    // Design currently publishes English only: localized incoming URLs must not invent destinations.
    for (const locale of ['', '/en', '/tw', '/ja', '/ko', '/cn']) {
        for (const suffix of ['', '/', '.html', '.md']) {
            const exportPrefix = suffix === '.md' ? '/guidelines' : ''
            const exportSuffix = suffix === '.md' ? '.md' : ''
            assert.ok(rules.includes(`${locale}/design-system${suffix} https://design.master.co${exportPrefix}/principles${exportSuffix} 301`))
            assert.ok(rules.includes(`${locale}/design-system/review/surface${suffix} https://design.master.co${exportPrefix}/foundations/elevation${exportSuffix} 301`))
        }
    }
    assert.ok(!rules.some(rule => rule.includes('/design-system/*') || rule.endsWith(' 410')))
    assert.equal(new Set(rules.map(rule => rule.split(' ')[0])).size, rules.length)
    assert.equal(legacyDesignAssets(false), undefined)
    const assets = legacyDesignAssets(true)!
    assert.match(assets.worker, /status: 410/)
    assert.ok(assets.routes.include.includes('/tw/design-system/*'))
})
