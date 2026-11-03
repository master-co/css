/** Capture and inspect every current documentation route, serially, against a local site.
 * MASTER_SITE_URL=http://localhost:3000 node site/tests/docs-quality.e2e.mjs
 * Captures are evidence for editorial review, not automatic visual approval.
 */
import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = new URL('../', import.meta.url)
// The historical review ledger is evidence, not a current route inventory.
const build = process.env.MASTER_DOC_BUILD ?? fileURLToPath(new URL('out/', root))
async function documentRoutes(directory) {
  const files = await readdir(directory, { withFileTypes: true })
  return (await Promise.all(files.map(async entry => {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) return documentRoutes(file)
    if (!entry.name.endsWith('.html')) return []
    const url = '/' + path.relative(build, file).split(path.sep).join('/').replace(/\.html$/, '').replace(/\/index$/, '')
    return /^\/(?:tw\/)?(?:guide|reference|benchmarks|blog|brand|design-system)(?:\/|$)/.test(url) ? [{ url }] : []
  }))).flat().sort((a, b) => a.url.localeCompare(b.url))
}
const inventory = await documentRoutes(build)
assert.ok(inventory.length, `No built document routes found in ${build}; build the site first`)
const base = process.env.MASTER_SITE_URL ?? 'http://localhost:3000'
const output = new URL(process.env.MASTER_DOC_OUTPUT ?? 'test-results/docs-quality/', root)
await mkdir(output, { recursive: true })
const selected = process.env.MASTER_DOC_ROUTES?.split(',')
if (selected) assert.deepEqual(selected.filter(url => !inventory.some(row => row.url === url)), [], 'selected routes exist in the current build')
const pages = inventory.filter(row => !selected || selected.includes(row.url))
const capture = process.env.MASTER_DOC_CAPTURE !== '0'
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
        for (const iframe of await page.locator('.ui-browser-viewport > iframe').all()) {
          // A lazy preview inside a closed disclosure cannot enter the viewport.
          // Reveal it through the same summary control a reader uses first.
          for (const disclosure of await iframe.locator('xpath=ancestor::details').all()) {
            if (await disclosure.getAttribute('open') === null) await disclosure.locator(':scope > summary').click()
          }
          await iframe.scrollIntoViewIfNeeded()
          await page.waitForFunction(element => {
            if (element.dataset.ready === 'true' && element.contentDocument?.body.childElementCount > 0) return true
            // Earlier content-sized previews may expand after the first scroll.
            // Keep this lazy frame in view until its actual document is ready.
            element.scrollIntoView({ block: 'center', behavior: 'instant' })
            return false
          }, await iframe.elementHandle(), { timeout: 15000 })
          frames.push(await iframe.evaluate(element => ({ title: element.title, ready: element.dataset.ready, height: element.clientHeight, contentHeight: element.contentDocument.body.getBoundingClientRect().height })))
        }
        await page.evaluate(() => scrollTo(0, 0))
        const geometry = await page.evaluate(() => {
          const prose = document.querySelector('.ui-prose') ?? document.querySelector('main')
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
            comparisonTextOverflow: [...prose.querySelectorAll('.document-comparison :is(th, td)')].flatMap(cell => {
              const bounds = cell.getBoundingClientRect()
              const texts = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT)
              let text
              while ((text = texts.nextNode())) {
                const range = document.createRange()
                range.selectNodeContents(text)
                if ([...range.getClientRects()].some(rect => rect.width && (rect.left < bounds.left - 2 || rect.right > bounds.right + 2))) return [{ text: cell.textContent.trim().slice(0, 120) }]
              }
              return []
            }),
            ids: [...document.querySelectorAll('[id]')].map(el => el.id),
            headings: [...prose.querySelectorAll('h1,h2,h3,h4')].map(el => ({ id: el.id, title: el.textContent.trim() })),
            figures: [...prose.querySelectorAll('.document-illustration')].map(el => ({ title: el.getAttribute('aria-label'), visibleImages: [...el.querySelectorAll('img')].filter(img => getComputedStyle(img).display !== 'none').length })),
            brokenImages: [...prose.querySelectorAll('img')].filter(el => getComputedStyle(el).display !== 'none' && el.complete && !el.naturalWidth).map(el => el.src),
            links: [...prose.querySelectorAll('a[href]')].map(el => el.getAttribute('href'))
          }
        })
        assert.equal(geometry.pageOverflow, false, 'page overflow')
        assert.deepEqual(geometry.overflow, [], 'reading content escapes its column')
        assert.deepEqual(geometry.comparisonTextOverflow, [], 'comparison text crosses into another cell')
        assert.deepEqual(geometry.brokenImages, [], 'broken article image')
        assert.deepEqual(errors, [], 'browser runtime errors')
        assert.equal(new Set(geometry.ids).size, geometry.ids.length, 'unique document IDs')
        for (const figure of geometry.figures) assert.equal(figure.visibleImages, 1, figure.title)
        const stem = row.url.slice(1).replaceAll('/', '--') + `-${width}-${theme}`
        if (capture) await page.screenshot({ path: new URL(`${stem}.png`, output).pathname, fullPage: true })
        // Keep a readable capture of each meaningful illustration and demo, beyond the opening.
        const specimens = page.locator('figure.ui-tray, [data-foundation-tokens]')
        const specimensCount = await specimens.count()
        if (capture && (width === 390 || width === 1280)) for (let i = 0; i < specimensCount; i++) {
          const specimen = specimens.nth(i)
          if (await specimen.isVisible()) await specimen.screenshot({ path: new URL(`${stem}-figure-${i}.png`, output).pathname })
        }
        record.profiles.push({ width, theme, ...(capture ? { screenshot: `${stem}.png` } : {}), specimens: specimensCount, frames, ...geometry })
      } catch (error) {
        record.failures.push({ width, theme, message: String(error) })
      } finally { await context.close() }
    }
    results.push(record)
    const current = new Map([...previous, ...results].map(record => [record.url, record]))
    await writeFile(new URL('results.json', output), JSON.stringify(inventory.flatMap(row => current.has(row.url) ? [current.get(row.url)] : []), null, 2) + '\n')
    console.log(`${row.url}: ${record.profiles.length}/6 profiles${record.failures.length ? ' FAILED ' + JSON.stringify(record.failures) : ''}`)
  }
} finally { await browser.close() }
assert.deepEqual(results.flatMap(row => row.failures.map(failure => ({ url: row.url, ...failure }))), [])
