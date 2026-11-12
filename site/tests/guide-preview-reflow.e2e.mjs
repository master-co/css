/** Enlarged text must reflow inside Guide previews, not just the outer article. */
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { chromium, webkit, firefox } from '@playwright/test'

const base = process.env.MASTER_SITE_URL ?? 'http://localhost:3000'
// Layout System is left out: its only preview is viewport-sized (data-sizing="viewport").
const routes = [
  'authoring-packages', 'cascade-layers', 'colors', 'global-styles', 'installation/lit',
  'migration/css', 'responsive-design', 'route-level-styles', 'syntax-tutorial', 'theme',
  'typography', 'view-transitions',
]
const browsers = new Map()
const engines = process.env.MASTER_SITE_BROWSER ? [process.env.MASTER_SITE_BROWSER] : ['chromium', 'webkit']
before(async () => {
  for (const engine of engines) browsers.set(engine, await ({ chromium, webkit, firefox })[engine].launch(engine === 'chromium' ? { channel: process.env.MASTER_CHROMIUM_CHANNEL } : {}))
})
after(async () => { for (const browser of browsers.values()) await browser.close() })

for (const engine of engines) for (const slug of routes) {
  test(`${engine} 320px / 200% text: ${slug} previews reflow`, { timeout: 90000 }, async () => {
    const page = await browsers.get(engine).newPage({ viewport: { width: 320, height: 900 }, colorScheme: 'dark', reducedMotion: 'reduce' })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    try {
      await page.goto(`${base}/guide/${slug}`, { waitUntil: 'networkidle' })
      await page.evaluate(() => document.documentElement.style.fontSize = '32px')
      if (slug === 'view-transitions') {
        // A capture needs a stable viewport. Long text scrolls inside it rather than resizing the capture.
        const fixed = page.locator('main iframe[data-sizing="viewport"]')
        assert.equal(await fixed.count(), 1, 'article transitions use one deliberate fixed viewport')
        await fixed.scrollIntoViewIfNeeded()
        await page.waitForFunction(element => element.dataset.ready === 'true', await fixed.elementHandle())
        const frame = await (await fixed.elementHandle()).contentFrame()
        await frame.evaluate(() => document.documentElement.style.fontSize = '32px')
        await frame.evaluate(() => document.fonts.ready)
        const height = (await fixed.boundingBox()).height
        assert.equal(height, 640, 'the configured capture viewport stays fixed at enlarged text')
        for (const fallback of ['reduced', 'unavailable']) {
          await page.emulateMedia({ reducedMotion: fallback === 'reduced' ? 'reduce' : 'no-preference' })
          await frame.evaluate(mode => {
            document.startViewTransition = mode === 'unavailable' ? undefined : () => { throw new Error('Reduced motion must bypass capture') }
          }, fallback)
          const read = frame.getByRole('button', { name: 'Read Designing transitions that preserve context' })
          await read.scrollIntoViewIfNeeded()
          await read.focus()
          await read.press('Enter')
          await frame.waitForFunction(() => document.activeElement?.tagName === 'H1')
          assert.equal(await frame.locator('[data-article-detail]:not([hidden])').count(), 1)
          await frame.getByRole('button', { name: 'Back to collection' }).click()
          await frame.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Read Designing transitions that preserve context')
          assert.equal((await fixed.boundingBox()).height, height, 'view changes do not resize the capture viewport')
          const metrics = await frame.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, height: innerHeight, content: document.documentElement.scrollHeight, top: scrollY }))
          assert.ok(metrics.scroll <= metrics.width + 1, JSON.stringify(metrics))
          assert.ok(metrics.content > metrics.height && metrics.top > 0, 'enlarged content remains reachable through internal scrolling')
        }
        assert.deepEqual(errors, [])
        return
      }
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
