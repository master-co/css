import assert from 'node:assert/strict'
import { test } from 'node:test'
import { legacySyntaxDestination, legacySyntaxPages, type LegacySyntaxSlug } from './legacy-syntax'

test('old syntax entrypoints and all fragments resolve deterministically in every locale', () => {
  for (const [slug, page] of Object.entries(legacySyntaxPages)) {
    for (const locale of ['', 'en', 'tw']) {
      const prefix = locale ? `/${locale}` : ''
      for (const hash of ['', '#unknown', '#%invalid', '#write-one-declaration', '#__proto__']) {
        assert.equal(legacySyntaxDestination(slug as LegacySyntaxSlug, hash, locale), prefix + page.tutorial)
      }
      for (const [anchor, target] of Object.entries(page.anchors)) {
        assert.equal(legacySyntaxDestination(slug as LegacySyntaxSlug, `#${anchor}`, locale), prefix + target)
        assert.equal(legacySyntaxDestination(slug as LegacySyntaxSlug, `#${encodeURIComponent(anchor)}`, locale), prefix + target)
      }
    }
  }
})
