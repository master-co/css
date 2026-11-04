import { afterEach, expect, test, vi } from 'vitest'
import { collectDocsPageCSSSizeSnapshot as collect } from '../docs-page-css-size/shared'

const css = '.x{color:red}'
const page = '<style>.a{color:blue}</style><link rel="stylesheet" href="https://assets.example/style.css">'
afterEach(() => vi.unstubAllGlobals())

const usage = { styleRules: 1, matchedStyleRules: 1, ruleBytes: 1, matchedRuleBytes: 1, tokenRules: 0, domElements: 1 }
// Collection is network-stubbed; selector usage needs a browser and is replaced here.
const collectDocsPageCSSSizeSnapshot = () => collect({
  measureUsage: async (pages) => pages.map(() => usage),
  readBrowserVersion: async () => 'test'
})
const sitemap = '<urlset><url><loc>https://example.test/a</loc></url><url><loc>https://example.test/b</loc></url></urlset>'
const sitemapResponse = () => new Response(sitemap, { headers: { 'content-type': 'application/xml' } })
// Five pages for each of the seven sites, plus every page of the one sitemap.
const pageCount = 37

function stub(asset: () => Response | Promise<Response>, html = page, pageOptions: ResponseInit = {}) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => url.endsWith('/sitemap.xml') ? sitemapResponse() : url.startsWith('https://assets.example/')
    ? asset() : new Response(html, { headers: { 'content-type': 'text/html;charset=utf-8' }, ...pageOptions })))
}

for (const status of [404, 403, 500, 206]) {
  test(`rejects incomplete or failed stylesheet HTTP ${status}`, async () => {
    stub(() => new Response('<h1>Error</h1>', { status, headers: { 'content-type': 'text/css' } }))
    await expect(collectDocsPageCSSSizeSnapshot()).rejects.toThrow(String(status))
  })
}
for (const contentType of ['text/html', 'application/json', '', 'text/plain']) {
  test(`rejects non-CSS response MIME ${contentType || 'missing'}`, async () => {
    stub(() => new Response('<h1>Error</h1>', { headers: contentType ? { 'content-type': contentType } : {} }))
    await expect(collectDocsPageCSSSizeSnapshot()).rejects.toThrow(/text\/css/)
  })
}
for (const status of [404, 500]) {
  test(`rejects failed HTML document HTTP ${status}`, async () => {
    stub(() => new Response(css), page, { status, headers: { 'content-type': 'text/html' } })
    await expect(collectDocsPageCSSSizeSnapshot()).rejects.toThrow(String(status))
  })
}
test('rejects non-HTML document MIME', async () => {
  stub(() => new Response(css), page, { headers: { 'content-type': 'application/json' } })
  await expect(collectDocsPageCSSSizeSnapshot()).rejects.toThrow(/HTML/)
})
test('valid CSS metadata and exact body bytes survive collection', async () => {
  stub(() => new Response(css, { headers: { 'content-type': 'Text/CSS; charset=utf-8' } }))
  const snapshot = await collectDocsPageCSSSizeSnapshot()
  expect(snapshot.pages).toHaveLength(7)
  for (const result of snapshot.pages) {
    expect(result.css.external.rawBytes).toBe(Buffer.byteLength(css))
    expect(result.assets[0]).toMatchObject({ kind: 'external', status: 200, contentType: 'Text/CSS; charset=utf-8' })
    expect(result.sample.pageCount).toBe(5)
    if (result.name === 'Master CSS') expect(result.site).toMatchObject({ pageCount: 2 })
    else expect(result.site).toBeUndefined()
    expect(result.sample.pages.map((page) => page.css.external.rawBytes)).toEqual(Array(5).fill(Buffer.byteLength(css)))
  }
})
test('network rejection includes the failing URL', async () => {
  stub(() => Promise.reject(new Error('connection lost')))
  await expect(collectDocsPageCSSSizeSnapshot()).rejects.toThrow(/https:\/\/assets.example\/style.css.*connection lost/)
})
test('body-read rejection includes the failing URL', async () => {
  stub(() => new Response(new ReadableStream({ start(controller) { controller.error(new Error('truncated body')) } }), { headers: { 'content-type': 'text/css' } }))
  await expect(collectDocsPageCSSSizeSnapshot()).rejects.toThrow(/https:\/\/assets.example\/style.css.*truncated body/)
})
test('one failed stylesheet rejects the complete report rather than publishing a partial total', async () => {
  let finished = 0
  vi.stubGlobal('fetch', async (url: string) => {
    if (url.endsWith('/sitemap.xml')) return sitemapResponse()
    if (url.endsWith('good.css')) {
      await new Promise(resolve => setTimeout(resolve, 15));finished++
      return new Response(css, { headers: { 'content-type': 'text/css' } })
    }
    if (url.endsWith('bad.css')) return new Response('missing', { status: 404 })
    return new Response('<link rel="stylesheet" href="https://assets.example/good.css"><link rel="stylesheet" href="https://assets.example/bad.css">', { headers: { 'content-type': 'text/html' } })
  })
  await expect(collectDocsPageCSSSizeSnapshot()).rejects.toThrow(/bad.css.*404/)
  expect(finished).toBe(pageCount)
})
test('relative stylesheet URLs resolve against the document base', async () => {
  const requested: string[] = []
  vi.stubGlobal('fetch', async (url: string) => {
    if (url.endsWith('/sitemap.xml')) return sitemapResponse()
    requested.push(url)
    if (url.endsWith('.css')) return new Response(css, { headers: { 'content-type': 'text/css' } })
    return new Response('<base href="/"><link rel="stylesheet" href="styles.css">', { headers: { 'content-type': 'text/html' } })
  })
  await collectDocsPageCSSSizeSnapshot()
  expect(requested.filter((url) => url.endsWith('.css')).every((url) => new URL(url).pathname === '/styles.css')).toBe(true)
})
