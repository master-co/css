import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'

const publicHead = route => {
  const url = 'https://css.master.co' + route
  const metadata = {
    description: 'A page about Master CSS',
    'og:title': 'Master CSS',
    'og:description': 'A page about Master CSS',
    'og:site_name': 'Master CSS',
    'og:type': 'website',
    'og:locale': 'en_US',
    'og:url': url,
    'og:image': 'https://css.master.co/card.png',
    'twitter:title': 'Master CSS',
    'twitter:description': 'A page about Master CSS',
    'twitter:site': '@mastercorg',
    'twitter:card': 'summary_large_image',
    'twitter:image': 'https://css.master.co/card.png'
  }
  return `<title>Master CSS</title><link rel="canonical" href="${url}">` + Object.entries(metadata).map(([key, value]) =>
    `<meta ${key.startsWith('og:') ? 'property' : 'name'}="${key}" content="${value}">`).join('')
}

const verify = (redirects, link = '/old#section', extraDocuments = {}) => {
  const directory = mkdtempSync(path.join(tmpdir(), 'master-site-release-'))
  try {
    const documents = {
      'index.html': `<html><head>${publicHead('/')}</head><body><script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"Master CSS","url":"https://css.master.co/"}</script><a href="${link}">Read</a><h1 id="section">Ready</h1></body></html>`,
      ...extraDocuments
    }
    for (const [name, html] of Object.entries(documents)) {
      mkdirSync(path.dirname(path.join(directory, name)), { recursive: true })
      writeFileSync(path.join(directory, name), html)
    }
    writeFileSync(path.join(directory, '_redirects'), redirects)
    const entries = Object.keys(documents).filter(name => !name.endsWith('/404.html') && name !== '404.html' && !name.startsWith('examples/'))
      .map(name => `<url><loc>https://css.master.co/${name === 'index.html' ? '' : name.slice(0, -5)}</loc></url>`)
    writeFileSync(path.join(directory, 'sitemap.xml'), `<urlset>${entries.join('')}</urlset>`)
    writeFileSync(path.join(directory, 'robots.txt'), 'Sitemap: https://css.master.co/sitemap.xml\n')
    writeFileSync(path.join(directory, 'card.png'), '')
    for (const name of ['llms.txt', 'llms-full.txt']) writeFileSync(path.join(directory, name), 'https://css.master.co/reference/')
    const report = path.join(directory, 'report.json')
    const result = spawnSync(process.execPath, ['site/scripts/verify-release-site.mjs', '--static-only', '--out', directory, '--report', report], { encoding: 'utf8' })
    return { status: result.status, report: JSON.parse(readFileSync(report, 'utf8')) }
  } finally { rmSync(directory, { recursive: true, force: true }) }
}

test('same-origin redirect chains preserve and validate destination anchors', () => {
  assert.equal(verify('/old /middle 301\n/middle / 302').status, 0)
  const broken = verify('/old /middle 301\n/middle / 302', '/old#missing')
  assert.notEqual(broken.status, 0)
  assert.ok(broken.report.failures.some(({ message }) => message.includes('missing anchor')))
})

test('unused redirect rules cannot conceal missing destinations or cycles', () => {
  for (const redirects of ['/old /missing 301', '/old /middle 301\n/middle /old 302']) {
    const result = verify(redirects, '/')
    assert.notEqual(result.status, 0)
    assert.ok(result.report.failures.some(({ name }) => name === 'redirect destinations'))
  }
})

test('external redirects require HTTPS and remain explicitly unverified live', () => {
  assert.notEqual(verify('/old http://example.com/ 301').status, 0)
  const result = verify('/old https://example.com/ 301')
  assert.equal(result.status, 0)
  assert.equal(result.report.redirects.liveEdgeVerified, false)
  assert.ok(result.report.redirects.externalDestinations.includes('https://example.com/#section'))
})

test('wildcard destinations resolve against the built route inventory', () => {
  assert.equal(verify('/en/* /:splat 301', '/en/#section').status, 0)
  assert.notEqual(verify('/en/* /:splat 301', '/en/missing').status, 0)
})

test('404 pages and embedded examples require noindex and omit canonical URLs', () => {
  const notFound = '<html><head><meta name="robots" content="noindex"></head><body><h1>Not found</h1></body></html>'
  const localized = Object.fromEntries(['404', 'ja/404', 'tw/404', 'ko/404', 'cn/404', 'examples/layout-system'].map(route => [`${route}.html`, notFound]))
  assert.equal(verify('', '/', localized).status, 0)
  for (const route of Object.keys(localized)) {
    const missingNoindex = verify('', '/', { ...localized, [route]: notFound.replace('<meta name="robots" content="noindex">', '') })
    assert.notEqual(missingNoindex.status, 0)
    const withCanonical = verify('', '/', { ...localized, [route]: notFound.replace('</head>', '<link rel="canonical" href="https://css.master.co/404"></head>') })
    assert.notEqual(withCanonical.status, 0)
  }
})

test('a Twitter Card must be in the document head and reference a built image', () => {
  const head = publicHead('/')
  const document = html => ({ 'index.html': `<html>${html}</html>` })
  const misplaced = verify('', '/', document(`<head>${head.replace('<meta name="twitter:card" content="summary_large_image">', '')}</head><body><meta name="twitter:card" content="summary_large_image"></body>`))
  assert.ok(misplaced.report.failures.some(({ message }) => message.includes('one twitter:card tag')))
  const missingImage = verify('', '/', document(`<head>${head.replaceAll('/card.png', '/missing.png')}</head>`))
  assert.ok(missingImage.report.failures.some(({ message }) => message.includes('image exists in the build')))
})

test('all Reference editions require their main styling boundary', () => {
  const routes = ['', '/ja', '/tw', '/ko', '/cn'].flatMap(prefix => [`${prefix}/reference`, `${prefix}/reference/tokens/color`])
  const documents = Object.fromEntries(routes.map(route => [route.slice(1) + '.html', `<html><head>${publicHead(route)}</head><body><main class="ui-docs-main reference-document"><h1>Reference</h1></main></body></html>`]))
  assert.equal(verify('', '/', documents).status, 0)
  for (const route of routes) {
    const file = route.slice(1) + '.html'
    const broken = verify('', '/', { ...documents, [file]: documents[file].replace(' reference-document', '') })
    assert.notEqual(broken.status, 0)
    assert.ok(broken.report.failures.some(({ name, message }) => name === route && message.includes('reference-document')))
  }
  assert.equal(verify('', '/', { 'reference-copy.html': `<html><head>${publicHead('/reference-copy')}</head><body><main>Unrelated page</main></body></html>` }).status, 0)
})
