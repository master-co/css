/** Execute the Guide's actual code, without the React demo or documentation shell.
 * node --test site/tests/view-transition-snippets.e2e.mjs
 * MASTER_TRANSITION_BROWSER=webkit selects the second engine.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { before, after, test } from 'node:test'
import { chromium, webkit } from '@playwright/test'
import { createEngineSync } from '@master/css/node'
import manifest from '@master/css-preset/default-manifest.json' with { type: 'json' }

const article = readFileSync(new URL('../content/guide/view-transitions/content.mdx', import.meta.url), 'utf8')
const fences = new Map([...article.matchAll(/```\w+ name=([^\n]+)\n([\s\S]*?)```/g)].map(match => [match[1], match[2]]))
const required = name => { assert.ok(fences.has(name), name); return fences.get(name) }
const markup = required('article-list.html')
const engine = createEngineSync({ manifest })
engine.ensureClassRules([...markup.matchAll(/class="([^"]+)"/g)].flatMap(match => match[1].split(/\s+/)))
const css = engine.snapshot().text
engine.dispose()
const image = readFileSync(new URL('@master/internal-site/examples/images/article-aurora.jpg', import.meta.url))
let browser, server, base

before(async () => {
  server = createServer((request, response) => {
    if (request.url === '/images/article-aurora.jpg') { response.setHeader('Content-Type', 'image/jpeg'); response.end(image); return }
    const same = request.url === '/same'
    const detail = request.url === '/articles/aurora/'
    response.setHeader('Content-Type', 'text/html')
    response.end(`<!doctype html><html><head><style>${same ? css + required('article-transitions.css') : required('page-transitions.css')}</style></head><body>${same ? markup : required(detail ? 'article.html' : 'collection.html')}${same ? `<script type="module">${required('article-transitions.js')}</script>` : ''}</body></html>`)
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${server.address().port}`
  browser = await ({ chromium, webkit })[process.env.MASTER_TRANSITION_BROWSER ?? 'chromium'].launch()
})
after(async () => { await browser?.close(); await new Promise(resolve => server?.close(resolve)) })

for (const mode of ['native', 'reduced', 'unavailable', 'broken-image']) test(`published same-document code: ${mode}`, async () => {
  const page = await browser.newPage({ reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference' })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(mode => {
    window.starts = 0
    const start = document.startViewTransition?.bind(document)
    document.startViewTransition = mode === 'unavailable' ? undefined : (...args) => { window.starts++; return start(...args) }
  }, mode)
  if (mode === 'broken-image') await page.route('**/*.jpg', route => route.abort())
  try {
    await page.goto(`${base}/same`)
    await page.getByRole('button', { name: 'Read article' }).click()
    await page.waitForFunction(() => document.activeElement?.tagName === 'H1')
    assert.equal(await page.locator('h1').count(), 1)
    await page.getByRole('button', { name: 'Back to collection' }).click()
    await page.waitForFunction(() => document.activeElement?.hasAttribute('data-read-more'))
    assert.equal(await page.locator('h2').count(), 1)
    assert.equal(await page.evaluate(() => window.starts), ['reduced', 'unavailable'].includes(mode) ? 0 : 2)
    assert.deepEqual(errors, [])
  } finally { await page.close() }
})

test('published callback reports an update failure without retrying it', async () => {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  try {
    await page.goto(`${base}/same`)
    await page.evaluate(() => {
      window.replacements = 0
      document.querySelector('[data-articles]').replaceChildren = () => {
        window.replacements++
        throw new Error('Test update failure')
      }
    })
    await page.getByRole('button', { name: 'Read article' }).click()
    await page.waitForFunction(() => window.replacements === 1)
    await page.waitForTimeout(300)
    assert.equal(await page.evaluate(() => window.replacements), 1)
    assert.deepEqual(errors, ['Test update failure'])
    assert.equal(await page.locator('h2').count(), 1)
  } finally { await page.close() }
})

for (const motion of ['no-preference', 'reduce']) test(`published cross-document recipe: ${motion}`, async () => {
  const page = await browser.newPage({ reducedMotion: motion })
  await page.addInitScript(() => {
    window.revealed = false
    window.navigationTransition = false
    addEventListener('pagereveal', event => {
      window.revealed = true
      window.navigationTransition = !!event.viewTransition
      event.viewTransition?.ready.then(() => { window.navigationReady = true }, error => { window.navigationError = error.name })
    })
  })
  try {
    await page.goto(`${base}/articles/`)
    await page.locator('img').evaluate(img => img.decode())
    await page.waitForTimeout(100)
    await page.locator('a').click()
    await page.waitForURL('**/articles/aurora/')
    await page.waitForFunction(() => window.revealed)
    assert.equal(await page.getByRole('heading', { name: 'The Aurora article' }).count(), 1)
    if (motion === 'reduce') assert.equal(await page.evaluate(() => window.navigationTransition), false)
    else {
      await page.waitForFunction(() => window.navigationReady || window.navigationError)
      assert.equal(await page.evaluate(() => window.navigationReady), true)
    }
    await page.getByRole('link', { name: 'Back to collection' }).click()
    await page.waitForURL('**/articles/')
    assert.equal(await page.locator('a[href="/articles/aurora/"]').count(), 1)
  } finally { await page.close() }
})
