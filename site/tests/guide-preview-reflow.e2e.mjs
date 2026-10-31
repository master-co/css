/** Enlarged text must reflow inside Guide previews, not just the outer article. */
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { chromium, webkit } from '@playwright/test'

const base = process.env.MASTER_SITE_URL ?? 'http://localhost:3000'
const routes = [
  'authoring-packages', 'cascade-layers', 'colors', 'containers', 'corner-radius',
  'elevation', 'flash-of-unstyled-content', 'global-styles', 'installation/lit',
  'migration/css', 'motion', 'route-level-styles', 'sizing', 'spacing', 'syntax-tutorial', 'theme',
  'typography', 'variables-and-modes', 'view-transitions',
]
const browsers = new Map()
before(async () => {
  browsers.set('chromium', await chromium.launch({ channel: process.env.MASTER_CHROMIUM_CHANNEL }))
  browsers.set('webkit', await webkit.launch())
})
after(async () => { for (const browser of browsers.values()) await browser.close() })

for (const engine of ['chromium', 'webkit']) for (const slug of routes) {
  test(`${engine} 320px / 200% text: ${slug} previews reflow`, { timeout: 90000 }, async () => {
    const page = await browsers.get(engine).newPage({ viewport: { width: 320, height: 900 }, colorScheme: 'dark', reducedMotion: 'reduce' })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    try {
      await page.goto(`${base}/guide/${slug}`, { waitUntil: 'networkidle' })
      await page.evaluate(() => document.documentElement.style.fontSize = '32px')
      const iframes = page.locator('main iframe[data-sizing="content"]')
      assert.ok(await iframes.count() > 0, 'the route has a normal-flow preview')
      for (const iframe of await iframes.all()) {
        await iframe.scrollIntoViewIfNeeded()
        await page.waitForFunction(element => element.dataset.ready === 'true', await iframe.elementHandle())
        const frame = await (await iframe.elementHandle()).contentFrame()
        await frame.evaluate(() => document.documentElement.style.fontSize = '32px')
        await frame.evaluate(() => document.fonts.ready)
        await frame.waitForFunction(() => document.documentElement.scrollHeight <= innerHeight + 1)
        const metrics = await frame.evaluate(() => ({
          title: frameElement.title,
          width: innerWidth,
          scroll: document.documentElement.scrollWidth,
        }))
        assert.ok(metrics.scroll <= metrics.width + 1, JSON.stringify(metrics))
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false)
      assert.deepEqual(errors, [])
    } finally { await page.close() }
  })
}
