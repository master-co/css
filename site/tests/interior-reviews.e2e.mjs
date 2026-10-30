/** Enlarged review scenes keep their chrome separate from the measured subjects. */
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { before, after, test } from 'node:test'
import fg from 'fast-glob'
import { chromium, webkit } from '@playwright/test'

const engine = process.env.MASTER_SITE_BROWSER ?? 'chromium'
const base = process.env.MASTER_SITE_URL ?? 'http://127.0.0.1:3218'
const site = new URL('../', import.meta.url)
const output = new URL(`test-results/interior-redesign/reviews-${engine}/`, site)
const files = await fg('content/design-system/**/page.tsx', { cwd: site.pathname })
const routes = files.map(file => '/' + path.dirname(file).replace(/^content\//, '')).sort()
const records = []
const visited = new Set()
let browser, context, page
let errors = []
before(async () => {
  await mkdir(output, { recursive: true })
  browser = await ({ chromium, webkit })[engine].launch()
  context = await browser.newContext({ viewport: { width: 320, height: 900 }, hasTouch: true, reducedMotion: 'reduce', colorScheme: 'light' })
  page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
})
after(async () => {
  await writeFile(new URL('readings.json', output), JSON.stringify({ engine, width: 320, rootPixels: 32, checkedAt: new Date().toISOString(), records }, null, 2) + '\n')
  await browser?.close()
})

async function open(route) {
  errors = []
  const response = await page.goto(base + route, { waitUntil: 'networkidle', timeout: 60000 })
  if (response.status() === 304) {
    const headers = await response.request().allHeaders()
    assert.ok(visited.has(route), 'a cached response must follow an earlier visit')
    assert.ok(headers['if-none-match'] || headers['if-modified-since'], 'a 304 must answer a conditional cache request')
    records.push({ action: 'cache-revalidation', route, status: 304 })
  } else assert.equal(response.status(), 200)
  visited.add(route)
  assert.ok(await page.getByRole('heading', { level: 1 }).isVisible(), 'the cached document still renders its page heading')
  await page.addStyleTag({ content: 'html { font-size: 32px !important }' })
  await page.evaluate(() => document.fonts.ready)
}

async function noOverflow() {
  const result = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }))
  assert.ok(result.scroll <= result.width + 1, JSON.stringify(result))
  assert.deepEqual(errors, [])
  return result
}

for (const route of routes) for (const locale of ['', '/tw']) test(`${engine} 320 / 200%: ${locale}${route} keeps enlarged text inside the page`, { timeout: 90000 }, async () => {
  const pathname = locale + route
  await open(pathname)
  const metrics = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, title: document.title, rootPixels: parseFloat(getComputedStyle(document.documentElement).fontSize) }))
  records.push({ route: pathname, ...metrics })
  await page.screenshot({ path: new URL(`${pathname.replaceAll('/', '-')}.png`, output).pathname })
  await noOverflow()
})

test(`${engine}: enlarged default canvas owns its height without overlapping the following note`, { timeout: 60000 }, async () => {
  await open('/design-system/review/demo')
  const metrics = await page.locator('.review-demo-current').evaluate(element => {
    const box = selector => element.querySelector(selector).getBoundingClientRect().toJSON()
    return { frame: box('.site-demo'), canvas: box('.demo-canvas'), note: box('.review-demo-optionNote') }
  })
  assert.ok(metrics.frame.height >= metrics.canvas.height - 1)
  assert.ok(metrics.note.top >= metrics.canvas.bottom, 'the supporting note follows the whole canvas')
  await page.locator('#canvas-current').evaluate(element => scrollTo(0, scrollY + element.getBoundingClientRect().top - 100))
  await page.screenshot({ path: new URL('canvas-enlarged.png', output).pathname })
  await noOverflow()
  records.push({ action: 'canvas-height', ...metrics })
})

test(`${engine}: enlarged alignment controls change the actual subject inside a local scroll preview`, { timeout: 60000 }, async () => {
  await open('/design-system/review/controls')
  const viewport = page.getByRole('region', { name: 'Alignment preview', exact: true })
  const demo = viewport.locator('xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " site-demo ")][1]')
  await demo.getByRole('button', { name: 'End', exact: true }).click()
  const subject = viewport.locator(':scope > div')
  await page.waitForFunction(element => getComputedStyle(element).alignItems === 'flex-end', await subject.elementHandle())
  assert.equal(await subject.evaluate(element => getComputedStyle(element).alignItems), 'flex-end')
  const bottoms = await subject.locator(':scope > div').evaluateAll(items => items.map(item => item.getBoundingClientRect().bottom))
  assert.ok(Math.max(...bottoms) - Math.min(...bottoms) < 1)
  await viewport.focus(); await page.keyboard.press('ArrowRight')
  await page.waitForFunction(element => element.scrollLeft > 0, await viewport.elementHandle())
  await noOverflow()
  records.push({ action: 'alignment', bottoms, localScroll: await viewport.evaluate(element => element.scrollLeft) })
})

test(`${engine}: the enlarged float preview keeps its authored width and keyboard scrolling`, { timeout: 60000 }, async () => {
  await open('/design-system/review/text')
  const viewport = page.getByRole('region', { name: 'Text flow preview', exact: true })
  const image = viewport.getByRole('img', { name: 'Sun above layered mountains' })
  assert.equal(await image.evaluate(element => getComputedStyle(element).float), 'left')
  assert.ok(Math.abs((await image.boundingBox()).width - 224) < 1, '7rem remains the actual float width at the enlarged root')
  await viewport.focus(); await page.keyboard.press('ArrowRight')
  await page.waitForFunction(element => element.scrollLeft > 0, await viewport.elementHandle())
  await noOverflow()
  await viewport.screenshot({ path: new URL('float-enlarged.png', output).pathname })
})

test(`${engine}: the enlarged measure control stays within its frame and reports real content growth`, { timeout: 60000 }, async () => {
  await open('/design-system/review/measure')
  const range = page.getByRole('slider', { name: /Requested width/ })
  assert.ok((await range.boundingBox()).width <= 200)
  await range.focus(); await range.press('End')
  assert.equal(await range.inputValue(), '460')
  const subject = page.locator('.review-measure-measuredSurface')
  const initial = (await subject.boundingBox()).height
  await page.getByRole('checkbox', { name: 'Add detail', exact: true }).check()
  await page.waitForFunction(({ element, height }) => element.getBoundingClientRect().height > height, { element: await subject.elementHandle(), height: initial })
  await noOverflow()
  records.push({ action: 'measure-content', initialHeight: initial, expandedHeight: (await subject.boundingBox()).height })
})
