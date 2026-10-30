/** Capture and inspect every current documentation route, serially, against a local site.
 * MASTER_SITE_URL=http://localhost:3000 node site/tests/docs-quality.e2e.mjs
 * Captures are evidence for editorial review, not automatic visual approval.
 */
import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const root = new URL('../', import.meta.url)
const ledger = JSON.parse(await readFile(new URL('tests/docs-quality-review.json', root), 'utf8'))
const base = process.env.MASTER_SITE_URL ?? 'http://localhost:3000'
const output = new URL(process.env.MASTER_DOC_OUTPUT ?? 'test-results/docs-quality/', root)
await mkdir(output, { recursive: true })
const selected = process.env.MASTER_DOC_ROUTES?.split(',')
const pages = ledger.pages.filter(row => !selected || selected.includes(row.url))
const browser = await chromium.launch()
const results = []
const previous = selected ? await readFile(new URL('results.json', output), 'utf8').then(JSON.parse).catch(() => []) : []
try {
  for (const row of pages) {
    const record = { url: row.url, profiles: [], failures: [] }
    for (const width of [390, 768, 1280]) for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: theme, reducedMotion: 'reduce' })
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      try {
        const response = await page.goto(base + row.url, { waitUntil: 'networkidle', timeout: 60000 })
        assert.equal(response.status(), 200)
        await page.evaluate(() => document.fonts.ready)
        const main = page.locator('main').first()
        await main.waitFor()
        const frames = []
        for (const iframe of await page.locator('iframe.demo-viewport').all()) {
          await iframe.scrollIntoViewIfNeeded()
          await page.waitForFunction(element => element.dataset.ready === 'true' && element.contentDocument?.body.childElementCount > 0, await iframe.elementHandle(), { timeout: 15000 })
          frames.push(await iframe.evaluate(element => ({ title: element.title, ready: element.dataset.ready, height: element.clientHeight, contentHeight: element.contentDocument.body.getBoundingClientRect().height })))
        }
        await page.evaluate(() => scrollTo(0, 0))
        const geometry = await page.evaluate(() => {
          const prose = document.querySelector('.prose') ?? document.querySelector('main')
          const bad = [...prose.querySelectorAll('h1,h2,h3,h4,p,li,figure,table,iframe,img')].filter(el => {
            const r = el.getBoundingClientRect()
            if (!r.width || !r.height) return false
            // Tables and code can scroll within their explicit reading region.
            for (let parent = el.parentElement; parent && parent !== prose; parent = parent.parentElement) {
              if (['auto', 'scroll'].includes(getComputedStyle(parent).overflowX)) return false
            }
            return r.left < -2 || r.right > innerWidth + 2
          }).map(el => ({ tag: el.tagName, text: el.textContent.slice(0, 80) }))
          return {
            pageOverflow: document.documentElement.scrollWidth > innerWidth + 2,
            overflow: bad,
            ids: [...document.querySelectorAll('[id]')].map(el => el.id),
            headings: [...prose.querySelectorAll('h1,h2,h3,h4')].map(el => ({ id: el.id, title: el.textContent.trim() })),
            figures: [...prose.querySelectorAll('.doc-illustration')].map(el => ({ title: el.getAttribute('aria-label'), visibleImages: [...el.querySelectorAll('img')].filter(img => getComputedStyle(img).display !== 'none').length })),
            brokenImages: [...prose.querySelectorAll('img')].filter(el => getComputedStyle(el).display !== 'none' && el.complete && !el.naturalWidth).map(el => el.src),
            links: [...prose.querySelectorAll('a[href]')].map(el => el.getAttribute('href'))
          }
        })
        assert.equal(geometry.pageOverflow, false, 'page overflow')
        assert.deepEqual(geometry.overflow, [], 'reading content escapes its column')
        assert.deepEqual(geometry.brokenImages, [], 'broken article image')
        assert.deepEqual(errors, [], 'browser runtime errors')
        for (const figure of geometry.figures) assert.equal(figure.visibleImages, 1, figure.title)
        const stem = row.url.slice(1).replaceAll('/', '--') + `-${width}-${theme}`
        await page.screenshot({ path: new URL(`${stem}.png`, output).pathname, fullPage: true })
        // Keep a readable capture of each meaningful illustration and demo, beyond the opening.
        const specimens = page.locator('.doc-illustration, .demo, .foundation-tokens, [data-demo-browser]')
        const specimensCount = await specimens.count()
        if (width === 390 || width === 1280) for (let i = 0; i < specimensCount; i++) {
          const specimen = specimens.nth(i)
          if (await specimen.isVisible()) await specimen.screenshot({ path: new URL(`${stem}-figure-${i}.png`, output).pathname })
        }
        record.profiles.push({ width, theme, screenshot: `${stem}.png`, specimens: specimensCount, frames, ...geometry })
      } catch (error) {
        record.failures.push({ width, theme, message: String(error) })
      } finally { await context.close() }
    }
    results.push(record)
    const current = new Map([...previous, ...results].map(record => [record.url, record]))
    await writeFile(new URL('results.json', output), JSON.stringify(ledger.pages.flatMap(row => current.has(row.url) ? [current.get(row.url)] : []), null, 2) + '\n')
    console.log(`${row.url}: ${record.profiles.length}/6 profiles${record.failures.length ? ' FAILED ' + JSON.stringify(record.failures) : ''}`)
  }
} finally { await browser.close() }
assert.deepEqual(results.flatMap(row => row.failures.map(failure => ({ url: row.url, ...failure }))), [])
