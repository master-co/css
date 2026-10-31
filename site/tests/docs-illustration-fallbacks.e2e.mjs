/** MASTER_SITE_URL=http://127.0.0.1:3001 node --test site/tests/docs-illustration-fallbacks.e2e.mjs */
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { chromium } from '@playwright/test'

const base = process.env.MASTER_SITE_URL ?? 'http://127.0.0.1:3001'
const routes = ['/guide/rendering-modes', '/guide/scanning-and-pruning#prune-native-css', '/guide/route-level-styles', '/blog/master-css-next']
let browser
before(async () => { browser = await chromium.launch() })
after(async () => { await browser.close() })

for (const route of routes) for (const scheme of ['light', 'dark']) test(`${route}: ${scheme} artwork and keyboard text without JavaScript`, async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, colorScheme: scheme, reducedMotion: 'reduce', javaScriptEnabled: false })
  try {
    const page = await context.newPage()
    assert.equal((await page.goto(base + route, { waitUntil: 'networkidle' })).status(), 200)
    const figures = page.locator('.doc-illustration')
    assert.ok(await figures.count() > 0)
    for (const figure of await figures.all()) {
      await figure.scrollIntoViewIfNeeded()
      const art = figure.locator('.doc-illustration-art')
      const figureBox = await figure.boundingBox()
      const artBox = await art.boundingBox()
      assert.ok(Math.abs(artBox.width - figureBox.width) <= 1, 'artwork fills the figure width')
      assert.ok(Math.abs(artBox.x - figureBox.x) <= 1, 'artwork starts at the figure edge')
      const visible = await art.locator('img').evaluateAll(images => images.filter(image => getComputedStyle(image).display !== 'none').map(image => image.className))
      assert.equal(visible.length, 1)
      assert.ok(visible[0].includes(`doc-illustration-${scheme}`))
      const imageBox = await art.locator(`.doc-illustration-${scheme}`).boundingBox()
      assert.ok(Math.abs(imageBox.width - artBox.width) <= 1, 'image fills the artwork width')
      const description = figure.locator('details')
      const summary = description.locator('summary')
      await summary.focus()
      await summary.press('Enter')
      assert.ok(await description.getAttribute('open') !== null)
      assert.ok(await description.locator('li').count() > 0)
    }
  } finally { await context.close() }
})
