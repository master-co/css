/** Normal-flow comparisons include native margins and enlarged text. */
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { chromium, webkit } from '@playwright/test'

const base = process.env.MASTER_SITE_URL ?? 'http://localhost:3000'
const browsers = new Map()
before(async () => {
  browsers.set('chromium', await chromium.launch({ channel: process.env.MASTER_CHROMIUM_CHANNEL }))
  browsers.set('webkit', await webkit.launch())
})
after(async () => { for (const browser of browsers.values()) await browser.close() })

async function settled(frame) {
  await frame.waitForFunction(() => document.documentElement.scrollHeight <= innerHeight + 1)
  return frame.evaluate(() => ({
    height: innerHeight,
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
    text: document.body.textContent.trim(),
    padding: getComputedStyle(document.querySelector('article')).padding,
    overflow: [...document.querySelectorAll('h2,p')].filter(element => element.scrollWidth > element.clientWidth + 1).map(element => element.textContent),
  }))
}

for (const engine of ['chromium', 'webkit']) for (const width of [320, 1280]) {
  test(`${engine} ${width}: comparison grows and shrinks with text and native margins`, async () => {
    const page = await browsers.get(engine).newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
    try {
      await page.goto(base + '/guide/flash-of-unstyled-content', { waitUntil: 'networkidle' })
      const iframes = page.locator('[data-first-paint] iframe')
      const frames = []
      for (const iframe of await iframes.all()) {
        await iframe.scrollIntoViewIfNeeded()
        await page.waitForFunction(element => element.dataset.ready === 'true', await iframe.elementHandle())
        frames.push(await (await iframe.elementHandle()).contentFrame())
      }
      assert.equal(frames.length, 2)
      const initial = await Promise.all(frames.map(settled))
      assert.equal(initial[0].text, initial[1].text)
      assert.equal(initial[0].padding, '0px')
      assert.notEqual(initial[1].padding, '0px')
      await page.evaluate(() => document.documentElement.style.fontSize = '32px')
      for (const frame of frames) await frame.evaluate(() => document.documentElement.style.fontSize = '32px')
      for (const frame of frames) {
        const enlarged = await settled(frame)
        assert.ok(enlarged.scroll <= enlarged.width + 1)
        assert.deepEqual(enlarged.overflow, [])
      }
      // A margin-only change leaves the body box's size unchanged.
      await frames[0].evaluate(() => document.body.style.marginBottom = '80px')
      const withMargin = await settled(frames[0])
      await frames[0].evaluate(() => document.body.style.marginBottom = '8px')
      await frames[0].waitForFunction(height => innerHeight < height - 30, withMargin.height)
      await settled(frames[0])
      await page.evaluate(() => document.documentElement.style.fontSize = '')
      for (let index = 0; index < frames.length; index++) {
        await frames[index].evaluate(() => document.documentElement.style.fontSize = '')
        await frames[index].waitForFunction(height => Math.abs(innerHeight - height) <= 1, initial[index].height)
      }
    } finally { await page.close() }
  })
}
