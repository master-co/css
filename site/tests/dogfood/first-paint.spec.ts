import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { documentHeadings } from '../../reference/headings'
import { deliveryFences, deliverySource } from '../delivery-examples'

const slugs = ['preload-critical-resources', 'flash-of-unstyled-content']
const previous = JSON.parse(readFileSync(new URL('../first-paint-heading-ids.json', import.meta.url), 'utf8')) as Record<string, { id: string }[]>
const asset = (path: string) => readFileSync(new URL(`../../../packages/${path}`, import.meta.url))
const runtimeURL = 'https://cdn.master.co/css-runtime@rc'
const manifestURL = runtimeURL + '/default-manifest.json'
const baseURL = 'https://cdn.master.co/css@rc/base.css'
const consumerURL = 'https://first-paint.test/'

const authoredHTML = (slug: string) => deliveryFences(deliverySource(slug)).find(f => f.name === 'index.html')!.text
async function baseStyles(page: Page) {
  await page.route(baseURL, route => route.fulfill({ contentType: 'text/css', body: asset('preset/src/base.css') }))
}

for (const slug of slugs) test(`complete first-paint guide ${slug}`, async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', e => { if (e.type() === 'error') errors.push(e.text()) })
  await page.goto(`/en/guide/${slug}`)
  for (const heading of [...documentHeadings(deliverySource(slug)), ...previous[slug]]) await expect(page.locator(`[id="${heading.id}"]`)).toHaveCount(1)
  for (const frame of await page.locator('.demo-style-comparison iframe').all()) {
    await frame.scrollIntoViewIfNeeded()
    await expect(frame).toHaveAttribute('data-ready', 'true')
  }
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: info.outputPath(`${slug}.png`), fullPage: true, scale: 'css', caret: 'initial', style: 'nav.app-wrapper,nextjs-portal{visibility:hidden}' })
  expect(errors).toEqual([])
})

test('authored preload discovers the JSON module before the blocked runtime entry and reuses it', async ({ page }) => {
  let requests = 0
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  await baseStyles(page)
  await page.route(runtimeURL, async route => {
    await gate
    await route.fulfill({ contentType: 'text/javascript', body: asset('runtime/dist/global.min.js') })
  })
  await page.route(manifestURL, route => {
    requests++
    return route.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: asset('runtime/dist/default-manifest.json') })
  })
  await page.route('**/mastercss_binding_wasm_engine_bg.wasm', route => route.fulfill({ contentType: 'application/wasm', headers: { 'access-control-allow-origin': '*' }, body: asset('runtime/artifacts/mastercss_binding_wasm_engine_bg.wasm') }))
  await page.route(consumerURL, route => route.fulfill({ contentType: 'text/html', body: authoredHTML(slugs[0]) }))
  try {
    await page.goto(consumerURL, { waitUntil: 'commit' })
    await expect.poll(() => requests).toBe(1)
  } finally { release() }
  await expect.poll(() => page.evaluate(() => Boolean((globalThis as any).masterCSSRuntime?.snapshot().observing))).toBe(true)
  expect(requests).toBe(1)
  await expect(page.getByRole('heading', { name: 'Project overview' })).toHaveCSS('text-align', 'center')
})

test('authored visibility guard reveals failed runtime loads and supports disabled JavaScript', async ({ page, browser }) => {
  await page.clock.install()
  await baseStyles(page)
  await page.route(runtimeURL, route => route.abort())
  await page.route(consumerURL, route => route.fulfill({ contentType: 'text/html', body: authoredHTML(slugs[1]) }))
  await page.goto(consumerURL)
  await expect(page.locator('html')).toHaveAttribute('hidden', '')
  await page.clock.fastForward(3001)
  await expect(page.locator('html')).not.toHaveAttribute('hidden', '')
  await expect(page.getByRole('heading', { name: 'Project overview' })).toBeVisible()

  const context = await browser.newContext({ javaScriptEnabled: false, viewport: page.viewportSize()! })
  try {
    const noScript = await context.newPage()
    await baseStyles(noScript)
    await noScript.route(consumerURL, route => route.fulfill({ contentType: 'text/html', body: authoredHTML(slugs[1]) }))
    await noScript.goto(consumerURL)
    await expect(noScript.locator('html')).toHaveAttribute('hidden', '')
    await expect(noScript.locator('html')).toHaveCSS('display', 'block')
    await expect(noScript.getByRole('heading', { name: 'Project overview' })).toBeVisible()
  } finally { await context.close() }
})

test('first-paint gallery has readable diagrams and identical isolated comparison markup', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', e => { if (e.type() === 'error') errors.push(e.text()) })
  await page.goto('/en/design-system#discovery-waterfall')
  const figures = page.locator('.demo-waterfall')
  await expect(figures).toHaveCount(3)
  for (const [index, figure] of (await figures.all()).entries()) {
    expect(await figure.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true)
    for (const bar of await figure.locator('.demo-waterfall-bar').all()) {
      expect(await bar.evaluate(e => { const b = e.getBoundingClientRect(), p = e.parentElement!.getBoundingClientRect(); return b.left >= p.left && b.right <= p.right + 1 })).toBe(true)
    }
    await figure.screenshot({ path: info.outputPath(`waterfall-${index}.png`), scale: 'css', caret: 'initial', style: 'nav.app-wrapper,nextjs-portal{visibility:hidden}' })
  }
  const comparisons = page.locator('.demo-style-comparison')
  await expect(comparisons).toHaveCount(2)
  for (const [index, comparison] of (await comparisons.all()).entries()) {
    for (const frame of await comparison.locator('iframe').all()) {
      await frame.scrollIntoViewIfNeeded()
      await expect(frame).toHaveAttribute('data-ready', 'true')
    }
    const frames = comparison.locator('iframe')
    const html = await frames.evaluateAll(es => es.map(e => (e as HTMLIFrameElement).contentDocument!.body.innerHTML))
    expect(html[0]).toBe(html[1])
    const before = comparison.frameLocator('iframe').nth(0)
    const after = comparison.frameLocator('iframe').nth(1)
    await expect(before.locator(index === 0 ? 'article' : 'p')).toHaveCSS('padding-top', '0px')
    await expect(after.locator(index === 0 ? 'article' : 'p')).toHaveCSS('padding-top', index === 0 ? '24px' : '16px')
    await comparison.screenshot({ path: info.outputPath(`style-comparison-${index}.png`), scale: 'css', caret: 'initial', style: 'nav.app-wrapper,nextjs-portal{visibility:hidden}' })
  }
  expect(errors).toEqual([])
})
