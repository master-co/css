/** Initial document fragments stay readable while article previews settle. */
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

async function position(page) {
  return page.evaluate(() => {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)))
    return {
      top: target.getBoundingClientRect().top,
      margin: parseFloat(getComputedStyle(target).scrollMarginTop),
      covered: target.getBoundingClientRect().top < document.querySelector('.app-header').getBoundingClientRect().bottom,
      closed: Boolean(target.closest('details:not([open])')),
    }
  })
}

async function aligned(page) {
  await page.waitForFunction(() => {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)))
    return target && !target.closest('details:not([open])')
      && Math.abs(target.getBoundingClientRect().top - parseFloat(getComputedStyle(target).scrollMarginTop)) < 2
  })
  assert.equal((await position(page)).covered, false)
}

async function growArticle(page, height) {
  await page.evaluate(height => {
    const block = document.createElement('div')
    block.style.height = height + 'px'
    block.setAttribute('aria-hidden', 'true')
    document.querySelector('main article.prose').prepend(block)
  }, height)
}

for (const engine of ['chromium', 'webkit']) for (const width of [390, 1280]) {
  for (const route of [
    '/reference/rules/modes#namespace-resolution',
    '/reference/rules/extraction#complete-classes',
    '/reference/rules/layers#priority-matrix',
    '/guide/theme#alias-and-override-tokens',
  ]) {
    test(`${engine} ${width}: initial ${route} survives late article growth`, async () => {
      const page = await browsers.get(engine).newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
      try {
        await page.goto(base + route, { waitUntil: 'networkidle' })
        await aligned(page)
        await growArticle(page, 160)
        await aligned(page)
      } finally { await page.close() }
    })
  }

  for (const intent of ['wheel', 'keyboard', 'scroll']) {
    test(`${engine} ${width}: ${intent} releases the initial fragment`, async () => {
      const page = await browsers.get(engine).newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
      try {
        await page.goto(base + '/reference/rules/modes#namespace-resolution', { waitUntil: 'networkidle' })
        await aligned(page)
        if (intent === 'wheel') await page.mouse.wheel(0, 200)
        if (intent === 'keyboard') await page.keyboard.press('PageDown')
        if (intent === 'scroll') await page.evaluate(() => scrollBy({ top: 200, behavior: 'instant' }))
        await page.waitForFunction(() => {
          const target = document.getElementById('namespace-resolution')
          return Math.abs(target.getBoundingClientRect().top - parseFloat(getComputedStyle(target).scrollMarginTop)) > 20
        })
        await growArticle(page, 80)
        // Let the resize observer and any browser scroll anchoring finish.
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
        const result = await position(page)
        assert.ok(Math.abs(result.top - result.margin) > 20, JSON.stringify(result))
      } finally { await page.close() }
    })
  }
}
