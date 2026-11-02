/** Run against a running site with MASTER_RELEASE_URL and, optionally, MASTER_RELEASE_BROWSER=webkit. */
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { chromium, webkit } from '@playwright/test'

const base = process.env.MASTER_RELEASE_URL ?? 'http://localhost:3000'
const engine = process.env.MASTER_RELEASE_BROWSER ?? 'chromium'
let browser
before(async () => { browser = await ({ chromium, webkit })[engine].launch() })
after(async () => { await browser?.close() })

for (const width of [390, 1440]) for (const scheme of ['light', 'dark']) {
  test(`release journal and illustrations work at ${width}px in ${scheme}`, async () => {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: scheme, reducedMotion: 'reduce' })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    try {
      await page.addInitScript(theme => localStorage.setItem('theme-preference', theme), scheme)
      assert.equal((await page.goto(`${base}/blog/v2`, { waitUntil: 'networkidle' })).status(), 200)
      const demo = page.locator('[data-release-journal]')
      const iframe = demo.locator('iframe')
      const frame = await (await iframe.elementHandle()).contentFrame()
      await frame.evaluate(async () => {
        await document.fonts.ready
        await Promise.all([...document.images].map(image => image.decode()))
      })
      const layout = () => frame.evaluate(() => {
        const lead = document.querySelector('#fieldwork-lead').getBoundingClientRect()
        const notes = document.querySelector('#fieldwork-notes').getBoundingClientRect()
        return { overflow: document.documentElement.scrollWidth > innerWidth + 1, columns: Math.abs(lead.y - notes.y) < 2 ? 2 : 1 }
      })
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false)
      assert.equal((await layout()).overflow, false)
      const range = demo.getByRole('slider')
      for (const [size, columns] of [[390, 1], [720, 2]]) {
        await range.fill(String(size))
        await range.dispatchEvent('change')
        assert.deepEqual(await layout(), { overflow: false, columns })
      }
      await demo.getByRole('button', { name: 'Fit', exact: true }).click()
      const summary = frame.locator('.journal-read summary')
      await summary.focus()
      await summary.press('Enter')
      assert.equal(await frame.locator('.journal-read').getAttribute('open'), '')
      await page.waitForFunction(() => {
        const iframe = document.querySelector('[data-release-journal] iframe')
        return iframe.clientHeight >= iframe.contentDocument.body.scrollHeight
      })
      await summary.press('Enter')
      for (const story of await frame.locator('.journal-story').all()) {
        await story.locator('summary').click()
        assert.equal(await story.getAttribute('open'), '')
        await story.locator('summary').click()
      }
      const color = () => frame.locator('.journal-kicker').first().evaluate(element => getComputedStyle(element).color)
      const originalColor = await color()
      await demo.getByRole('button', { name: 'Theme', exact: true }).click()
      assert.notEqual(await color(), originalColor)
      await frame.getByRole('link', { name: 'About', exact: true }).click()
      assert.equal(await frame.evaluate(() => location.hash), '#fieldwork-about')
      assert.equal(new URL(page.url()).pathname, '/blog/v2')

      await demo.getByText('View the HTML and CSS', { exact: true }).click()
      for (const asset of await demo.locator('a[download]').all()) {
        const response = await context.request.get(new URL(await asset.getAttribute('href'), base).href)
        assert.equal(response.status(), 200)
        assert.ok((await response.body()).length > 0)
      }
      await demo.getByRole('tab', { name: 'HTML', exact: true }).click()
      assert.equal(await demo.getByRole('tab', { name: 'HTML', exact: true }).getAttribute('aria-selected'), 'true')
      await demo.getByText('Generated CSS', { exact: true }).click()
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false)

      const figures = page.locator('figure[data-illustration-expandable]')
      assert.equal(await figures.count(), 5)
      for (const figure of await figures.all()) {
        const link = figure.locator('.document-illustration-expand:visible')
        assert.equal(await link.count(), 1)
        assert.equal(await link.getAttribute('data-scheme'), scheme)
        const image = await context.request.get(new URL(await link.getAttribute('href'), base).href)
        assert.equal(image.status(), 200)
        assert.equal(image.headers()['content-type'], 'image/png')
        const bytes = await image.body()
        assert.equal(bytes.readUInt32BE(16), 1440)
        assert.equal(bytes.readUInt32BE(20), 960)
      }
      const link = figures.first().locator('.document-illustration-expand:visible')
      await page.keyboard.press('Tab')
      await link.focus()
      assert.notEqual(await link.evaluate(element => getComputedStyle(element).outlineStyle), 'none')
      const opened = page.waitForEvent('popup')
      await link.press('Enter')
      const popup = await opened
      await popup.waitForLoadState('load')
      assert.equal(await popup.locator('img').evaluate(image => image.naturalWidth), 1440)
      await popup.close()
      assert.equal(new URL(page.url()).pathname, '/blog/v2')
      if (width === 390) {
        // Measure text itself: overflow:hidden can conceal clipping from scrollWidth checks.
        const clipped = await frame.evaluate(() => {
          const sizes = [...document.querySelectorAll('body, body *')].map(element => [element, parseFloat(getComputedStyle(element).fontSize)])
          for (const [element, size] of sizes) element.style.fontSize = `${size * 2}px`
          const issues = []
          const walker = document.createTreeWalker(document.querySelector('.journal'), NodeFilter.SHOW_TEXT)
          while (walker.nextNode()) {
            const node = walker.currentNode
            if (!node.textContent.trim() || !node.parentElement.getClientRects().length) continue
            const range = document.createRange()
            range.selectNodeContents(node)
            const boundaries = []
            for (let element = node.parentElement; element; element = element.parentElement) {
              if (['hidden', 'clip', 'auto', 'scroll'].includes(getComputedStyle(element).overflowX)) boundaries.push(element.getBoundingClientRect())
            }
            if ([...range.getClientRects()].some(rect => rect.width && rect.height && (rect.right > innerWidth + 1 || rect.left < 0 || boundaries.some(boundary => rect.right > boundary.right + 1 || rect.left < boundary.left - 1)))) issues.push(node.textContent.trim())
          }
          return issues
        })
        assert.deepEqual(clipped, [], 'doubling computed text sizes must not clip journal text')
      }
      assert.deepEqual(errors, [])
    } finally { await context.close() }
  })
}
