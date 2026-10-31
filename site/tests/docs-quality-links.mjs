/** Validate the reviewed corpus against the complete production output.
 * Run after site build: node site/tests/docs-quality-links.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const site = new URL('../', import.meta.url).pathname
const out = path.join(site, 'out')
const ledger = JSON.parse(fs.readFileSync(path.join(site, 'tests/docs-quality-review.json')))
const catalog = JSON.parse(fs.readFileSync(path.join(site, '.generated/reference.json')))
const decode = text => text.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
const outputFile = pathname => [pathname, pathname + '.html', path.join(pathname, 'index.html')]
  .map(file => path.join(out, file)).find(file => fs.existsSync(file) && fs.statSync(file).isFile())
const ids = new Map()
const pageIDs = file => {
  if (!ids.has(file)) ids.set(file, new Set([...fs.readFileSync(file, 'utf8').matchAll(/\bid="([^"]+)"/g)].map(match => decode(match[1]))))
  return ids.get(file)
}
let links = 0
for (const row of ledger.pages) for (const prefix of ['', '/tw']) {
  const route = prefix + row.url
  const file = outputFile(route)
  assert.ok(file, route)
  for (const match of fs.readFileSync(file, 'utf8').matchAll(/href="([^"]+)"/g)) {
    const href = decode(match[1])
    if (!href || /^(https?:|mailto:|tel:|javascript:|data:|\/\/)/.test(href)) continue
    const url = new URL(href, 'https://docs.invalid' + route)
    if (url.hostname !== 'docs.invalid') continue
    links++
    const destination = outputFile(decodeURIComponent(url.pathname))
    assert.ok(destination, `${route}: ${href}`)
    if (url.hash && destination.endsWith('.html')) assert.ok(pageIDs(destination).has(decodeURIComponent(url.hash.slice(1))), `${route}: ${href}`)
  }
}

const sitemapFiles = fs.readdirSync(out).filter(file => /^sitemap.*\.xml$/.test(file))
assert.ok(sitemapFiles.length, 'production sitemap')
const sitemaps = sitemapFiles.map(file => fs.readFileSync(path.join(out, file), 'utf8')).join('\n')
const portable = ['llms.txt', 'llms-full.txt', 'search/en.json', 'search/tw.json']
  .map(file => fs.readFileSync(path.join(out, file), 'utf8')).join('\n')
for (const route of [...ledger.retired, ...ledger.previouslyRetired]) for (const prefix of ['', '/tw']) {
  assert.equal(outputFile(prefix + route), undefined, `retired HTML: ${prefix}${route}`)
  assert.equal(outputFile(prefix + route + '.md'), undefined, `retired Markdown: ${prefix}${route}`)
  assert.ok(!sitemaps.includes(prefix + route + '<') && !sitemaps.includes(prefix + route + '.html<'), `retired sitemap: ${route}`)
  assert.ok(!portable.includes(prefix + route), `retired search/llms: ${route}`)
}
let identifiers = 0
for (const prefix of ['', '/tw']) {
  const search = JSON.parse(fs.readFileSync(path.join(out, `search/${prefix ? 'tw' : 'en'}.json`)))
  for (const doc of catalog.documents) {
    assert.ok(outputFile(prefix + doc.url + '.md'), `${doc.id}: portable Markdown`)
    const record = search.find(row => row.url === prefix + doc.url)
    assert.ok(record, `${doc.id}: search destination`)
    for (const alias of doc.aliases) {
      const entry = record.identifiers.find(entry => entry.text === alias)
      assert.ok(entry, `${doc.id}: ${alias}`)
      if (doc.identifierAnchors?.[alias]) assert.ok(pageIDs(outputFile(prefix + doc.url)).has(entry.id), `${doc.id}: ${alias} anchor`)
      identifiers++
    }
  }
}
const result = { pages: ledger.pages.length, locales: 2, links, identifiers, retired: ledger.retired.length, previouslyRetired: ledger.previouslyRetired.length, errors: [] }
const resultDir = path.join(site, 'test-results/docs-quality-production')
fs.mkdirSync(resultDir, { recursive: true })
fs.writeFileSync(path.join(resultDir, 'links.json'), JSON.stringify(result, null, 2) + '\n')
console.log(result)
