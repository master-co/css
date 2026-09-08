import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

assert(process.cwd().includes('master-css-bh-isolated-'))
const { collectDocsPageCSSSizeSnapshot } = await import(pathToFileURL(resolve('docs-page-css-size/shared.ts')).href)
const css = '.probe{color:rgb(255,0,0)}'
const errorHTML = '<!doctype html><title>Missing stylesheet</title><p>' + 'not CSS '.repeat(128) + '</p>'
let status = 200
const server = createServer((request, response) => {
  if (request.url === '/style.css') {
    response.writeHead(status, { 'content-type': status === 200 ? 'text/css' : 'text/html' })
    response.end(status === 200 ? css : errorHTML)
  } else {
    response.writeHead(200, { 'content-type': 'text/html' })
    response.end('<!doctype html><link rel="stylesheet" href="/style.css"><p class="probe">control</p>')
  }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`
const originalFetch = globalThis.fetch
// Keep checked-in input unchanged: map its public page requests to this actual HTTP fixture.
globalThis.fetch = (input, init) => originalFetch(String(input).startsWith(origin) ? input : `${origin}/page`, init)
const repo = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(resolve(repo, 'package.json'))
const { chromium } = require('@playwright/test')
const browser = await chromium.launch()
const rows = []
try {
  const page = await browser.newPage()
  for (status of [200, 404]) {
    const snapshot = await collectDocsPageCSSSizeSnapshot()
    assert.equal(snapshot.pages.length, 8)
    await page.goto(`${origin}/page?status=${status}`)
    const browserState = await page.evaluate(() => ({
      color: getComputedStyle(document.querySelector('.probe')).color,
      stylesheets: document.styleSheets.length,
      cssRules: Array.from(document.styleSheets).reduce((n, sheet) => n + sheet.cssRules.length, 0)
    }))
    const first = snapshot.pages[0]
    assert.equal(first.assets.length, 1)
    assert.equal(first.css.external.rawBytes, Buffer.byteLength(status === 200 ? css : errorHTML))
    assert(snapshot.pages.every(p => p.css.external.rawBytes === first.css.external.rawBytes))
    assert.equal(browserState.color, status === 200 ? 'rgb(255, 0, 0)' : 'rgb(0, 0, 0)')
    assert.equal(browserState.cssRules, status === 200 ? 1 : 0)
    rows.push({ status, collectorResolved: true, pages: snapshot.pages.length,
      reported: first.css, asset: first.assets[0], browserState })
  }
  status = 500
  let rejected = ''
  try { await collectDocsPageCSSSizeSnapshot() } catch (error) { rejected = error.message }
  assert.match(rejected, /500/)
  const result = { browser: { name: 'chromium', version: browser.version() }, rows,
    status500Rejected: rejected, publicPageInputsRemappedToLocalHTTP: true }
  writeFileSync(fileURLToPath(new URL('../evidence/0071-http-controls.json', import.meta.url)), JSON.stringify(result, null, 2))
  console.log(JSON.stringify(result))
} finally {
  globalThis.fetch = originalFetch
  await browser.close()
  server.closeAllConnections()
  await new Promise(resolve => server.close(resolve))
}
