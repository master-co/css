import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { canonicalizeDefaultLocalePathname, localizePathname } from './i18n-pathname'

const defaults = {
  defaultLocale: 'en',
  locale: 'en',
  locales: ['en', 'tw'],
  localePrefixMode: 'always' as const
}

test('localizePathname prefixes the default locale in always mode', () => {
  assert.equal(localizePathname('/guide', defaults), '/en/guide')
  assert.equal(localizePathname('/guide#x', defaults), '/en/guide#x')
})

test('localizePathname prefixes non-default locales and preserves suffixes', () => {
  assert.equal(localizePathname('/guide?q=1', {
    ...defaults,
    locale: 'tw',
    localePrefixMode: 'canonical'
  }), '/tw/guide?q=1')
})

test('localizePathname leaves already-localized and non-page hrefs unchanged', () => {
  assert.equal(localizePathname('/en/guide', defaults), '/en/guide')
  assert.equal(localizePathname('/api/play', defaults), '/api/play')
  assert.equal(localizePathname('/images/logo.svg', defaults), '/images/logo.svg')
  assert.equal(localizePathname('#heading', defaults), '#heading')
  assert.equal(localizePathname('https://example.test/guide', defaults), 'https://example.test/guide')
})

test('localizePathname respects configured page roots', () => {
  assert.equal(localizePathname('/guide', {
    ...defaults,
    localizablePathnameRoots: ['guide']
  }), '/en/guide')
  assert.equal(localizePathname('/settings', {
    ...defaults,
    localizablePathnameRoots: ['guide']
  }), '/settings')
})

test('canonicalizeDefaultLocalePathname strips only the default locale prefix', () => {
  assert.equal(canonicalizeDefaultLocalePathname('/en/guide', 'en'), '/guide')
  assert.equal(canonicalizeDefaultLocalePathname('/en/guide#x', 'en'), '/guide#x')
  assert.equal(canonicalizeDefaultLocalePathname('/tw/guide', 'en'), '/tw/guide')
})
