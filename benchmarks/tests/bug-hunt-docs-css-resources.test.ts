import { afterEach, expect, test, vi } from 'vitest'
import { collectDocsPageCSSSizeSnapshot } from '../docs-page-css-size/shared'

const css = '.x{color:red}'
const page = '<style>.a{color:blue}</style><link rel="stylesheet" href="https://assets.example/style.css">'
afterEach(() => vi.unstubAllGlobals())

function stub(asset: () => Response | Promise<Response>, html = page, pageOptions: ResponseInit = {}) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => url.startsWith('https://assets.example/')
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
  expect(snapshot.pages).toHaveLength(8)
  for (const result of snapshot.pages) {
    expect(result.css.external.rawBytes).toBe(Buffer.byteLength(css))
    expect(result.assets[0]).toMatchObject({ kind: 'external', status: 200, contentType: 'Text/CSS; charset=utf-8' })
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
    if (url.endsWith('good.css')) {
      await new Promise(resolve => setTimeout(resolve, 15));finished++
      return new Response(css, { headers: { 'content-type': 'text/css' } })
    }
    if (url.endsWith('bad.css')) return new Response('missing', { status: 404 })
    return new Response('<link rel="stylesheet" href="https://assets.example/good.css"><link rel="stylesheet" href="https://assets.example/bad.css">', { headers: { 'content-type': 'text/html' } })
  })
  await expect(collectDocsPageCSSSizeSnapshot()).rejects.toThrow(/bad.css.*404/)
  expect(finished).toBe(8)
})
