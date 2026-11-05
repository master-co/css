import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { locales, languageOf } from '@master/internal-site/common/locales.js'
import { auditTranslations, emptyReviews, headingAnchors } from '@master/internal-site/build/localization.ts'
import { extractSearchNodesFromMarkdown } from '@master/internal-site/utils/search-pages'
import resources, { missingUIKeys } from '../i18n/resources'
import { buildReferenceCatalog, renderDocumentMarkdown, referencePath } from '../reference/build'
import { loadPages, localizedMarkdownLinks } from './generate-llms-txt'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (file: string) => readFile(path.join(root, file), 'utf8')
const fenceBodies = (source: string) => [...source.matchAll(/^\s*```[^\n]*\n([\s\S]*?)^\s*```/gm)].map(match => match[1].replace(/\n {4}/g, '\n'))

test('all published editions have complete source anchors, metadata and local UI copy', async () => {
  const inventory = await resources()
  assert.deepEqual(auditTranslations(inventory, emptyReviews()).filter(issue => issue.reason !== 'unreviewed'), [])
  assert.deepEqual(await missingUIKeys(), { tw: [], ja: [], ko: [], cn: [] })
  for (const resource of inventory.filter(item => item.checkAnchors)) {
    for (const locale of locales.filter(item => item !== 'en')) {
      const body = resource.translations[locale]!
      assert.deepEqual(headingAnchors(body), headingAnchors(resource.source), `${resource.id}:${locale}: stable destinations`)
      assert.deepEqual(fenceBodies(body), fenceBodies(resource.source), `${resource.id}:${locale}: sample code stays canonical`)
    }
  }
})

test('all five editions agree across Markdown, llms, search and structured Reference payloads', async () => {
  const published = new Set<string>(JSON.parse(await read('.pages.json')).map((page: { pathname: string }) => page.pathname))
  let sourceURLs: string[] | undefined
  let sourceReferenceIDs: string[] | undefined
  for (const locale of locales) {
    const prefix = locale === 'en' ? '' : `/${locale}`
    const pages = (await loadPages(path.join(root, 'content'), locale)).filter(page => published.has(page.url.slice(prefix.length)))
    const full = await read(`public${prefix}/llms-full.txt`)
    const index = await read(`public${prefix}/llms.txt`)
    const search = JSON.parse(await read(`public/search/${locale}.json`))
    const urls = pages.map(page => page.url.slice(prefix.length)).sort()
    if (locale === 'en') sourceURLs = urls
    else assert.deepEqual(urls, sourceURLs, `${locale}: same published article identities`)
    for (const page of pages) {
      const markdown = await read(`public${page.url}.md`)
      assert.ok(markdown.includes(page.body.trim()), `${page.url}: exact article body in Markdown`)
      assert.ok(full.includes(page.body.trim()), `${page.url}: exact article body in llms-full`)
      assert.ok(index.includes(page.title), `${page.url}: translated discovery title`)
      const entry = search.find((item: { url: string }) => item.url === page.url)
      assert.ok(entry, `${page.url}: searchable`)
      assert.equal(entry.title, page.title)
      assert.deepEqual(entry.nodes, extractSearchNodesFromMarkdown(page.body), `${page.url}: same language and explanation in search`)
    }
    const catalog = await buildReferenceCatalog(root, locale)
    assert.equal(catalog.locale, locale)
    const ids = catalog.documents.map(doc => doc.id).sort()
    if (locale === 'en') sourceReferenceIDs = ids
    else assert.deepEqual(ids, sourceReferenceIDs, `${locale}: same Reference identities`)
    for (const doc of catalog.documents) {
      const markdown = await read(`public${prefix}/reference/${doc.id}.md`)
      const body = renderDocumentMarkdown(doc, catalog, locale)
      assert.equal(markdown, body, `${locale}/${doc.id}: localized Reference payload`)
      assert.ok(full.includes(body.trim()), `${locale}/${doc.id}: exact Reference in llms-full`)
      const entry = search.find((item: { url: string }) => item.url === referencePath(doc.url, locale))
      assert.ok(entry, `${locale}/${doc.id}: searchable Reference`)
      assert.deepEqual(entry.nodes, [...doc.rows.map(row => ({ id: row.id, tag: 'code', text: `${row.syntax} → ${row.declarations}` })), ...extractSearchNodesFromMarkdown(doc.markdown)])
      assert.equal(doc.language, languageOf(locale))
    }
    for (const entry of search) assert.ok(!/\/drafts?\/|\/blog\/v2(?:\/|$)/.test(entry.url), `${locale}: drafts stay private`)
  }
})

test('reader links preserve locale across sites while inline and fenced sample code remains English', () => {
  const sample = '[Blog](https://master.co/blog/example#part) [Guide](/guide/theme)\n\n`[Code](/guide/theme)`\n\n```html\n<a href="/guide/theme">Example</a>\n```'
  for (const locale of locales.filter(item => item !== 'en')) {
    const result = localizedMarkdownLinks(sample, locale)
    assert.ok(result.includes(`https://master.co/${locale}/blog/example#part`))
    assert.ok(result.includes(`](/${locale}/guide/theme)`))
    assert.ok(result.includes('`[Code](/guide/theme)`'))
    assert.ok(result.includes('<a href="/guide/theme">Example</a>'))
  }
})
