import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'

const verify = (redirects, link = '/old#section', extraDocuments = {}) => {
  const directory = mkdtempSync(path.join(tmpdir(), 'master-site-release-'))
  try {
    writeFileSync(path.join(directory, 'index.html'), `<html><head><link rel="canonical" href="https://css.master.co/"></head><body><a href="${link}">Read</a><h1 id="section">Ready</h1></body></html>`)
    for (const [name, html] of Object.entries(extraDocuments)) {
      mkdirSync(path.dirname(path.join(directory, name)), { recursive: true })
      writeFileSync(path.join(directory, name), html)
    }
    writeFileSync(path.join(directory, '_redirects'), redirects)
    writeFileSync(path.join(directory, 'sitemap.xml'), '<urlset><url><loc>https://css.master.co/</loc></url></urlset>')
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

test('root and all localized 404 pages require noindex and omit canonical URLs', () => {
  const notFound = '<html><head><meta name="robots" content="noindex"></head><body><h1>Not found</h1></body></html>'
  const localized = Object.fromEntries(['404', 'ja/404', 'tw/404', 'ko/404', 'cn/404'].map(route => [`${route}.html`, notFound]))
  assert.equal(verify('', '/', localized).status, 0)
  for (const route of Object.keys(localized)) {
    const missingNoindex = verify('', '/', { ...localized, [route]: notFound.replace('<meta name="robots" content="noindex">', '') })
    assert.notEqual(missingNoindex.status, 0)
    const withCanonical = verify('', '/', { ...localized, [route]: notFound.replace('</head>', '<link rel="canonical" href="https://css.master.co/404"></head>') })
    assert.notEqual(withCanonical.status, 0)
  }
})
