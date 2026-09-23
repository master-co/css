import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import snapshot from '../../../benchmarks/docs-page-css-size/snapshot.json' with { type: 'json' }

const headings = JSON.parse(readFileSync(new URL('../final-page-heading-ids.json', import.meta.url), 'utf8')) as Record<string, string[]>
function errorsFor(page: Page) {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', event => { if (event.type() === 'error') errors.push(event.text()) })
  return errors
}
async function capture(page: Page, path: string) {
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() => scrollTo(0, 0))
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path, fullPage: true, scale: 'css', caret: 'initial', style: 'nav.app-wrapper,nextjs-portal{visibility:hidden}' })
}

test('benchmark values, scales, sources and complete data remain readable and operable', async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.goto('/en/guide/benchmarks')
  for (const id of headings['/guide/benchmarks']) await expect(page.locator(`[id="${id}"]`)).toHaveCount(1)
  await expect(page.locator('.benchmark-source time')).toHaveCount(8)
  const max = Math.max(...snapshot.pages.map(entry => entry.css.total.brotliBytes))
  for (const entry of snapshot.pages) {
    const meter = page.locator('[data-page-css-size]').getByRole('meter', { name: entry.name, exact: true })
    await expect(meter).toHaveCount(1)
    await expect(meter).toHaveAttribute('aria-valuenow', String(entry.css.total.brotliBytes))
    await expect(meter).toHaveAttribute('aria-valuetext', `${(entry.css.total.brotliBytes / 1000).toFixed(1)} kB`)
    const fraction = await meter.evaluate(element => element.firstElementChild!.getBoundingClientRect().width / element.getBoundingClientRect().width)
    expect(fraction).toBeCloseTo(entry.css.total.brotliBytes / max, 2)
  }
  const names = await page.getByRole('meter').evaluateAll(elements => elements.map(element => element.getAttribute('aria-label')))
  expect(names.every(name => name && !name.includes('[object Object]'))).toBe(true)
  await capture(page, info.outputPath('benchmarks.png'))
  const raw = page.locator('summary').filter({ hasText: 'Compare uncompressed CSS' })
  await raw.focus(); await raw.press('Enter')
  await expect(page.locator('[data-page-css-size]').getByRole('meter', { name: 'Master CSS', exact: true })).toHaveCount(2)
  const disclosures = page.locator('details.benchmark-data').filter({ has: page.locator('.benchmark-table-scroll') })
  const rowCounts: number[] = []
  for (const disclosure of await disclosures.all()) {
    const summary = disclosure.locator('summary')
    await summary.focus(); await summary.press('Enter')
    const region = disclosure.getByRole('region')
    await expect(region).toBeVisible()
    await expect(region).toHaveAccessibleName(/\w/)
    await expect(region).toHaveAccessibleDescription('Use arrow keys to scroll the table.')
    rowCounts.push(await region.locator('tbody tr').count())
    if (rowCounts.length === 1) await disclosure.screenshot({ path: info.outputPath('page-css-data.png'), caret: 'initial' })
    await region.scrollIntoViewIfNeeded()
    await region.focus()
    await expect(region).toBeFocused()
    const size = await region.evaluate(element => ({ width: element.clientWidth, scroll: element.scrollWidth }))
    if (size.scroll > size.width + 1) {
      await region.press('ArrowRight')
      await expect.poll(() => region.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
      await region.press('ArrowLeft')
      await expect.poll(() => region.evaluate(element => element.scrollLeft)).toBe(0)
    }
    if (await region.evaluate(element => element.scrollHeight > element.clientHeight + 1)) {
      await region.press('ArrowDown')
      await expect.poll(() => region.evaluate(element => element.scrollTop)).toBeGreaterThan(0)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    await summary.press('Enter')
  }
  expect(rowCounts).toEqual([snapshot.pages.length + snapshot.pages.find(entry => entry.name === 'Master CSS')!.assets.length, 16, 16, 16, 4, 14, 16, 54, 4])
  const sources = page.locator('details.benchmark-data').filter({ has: page.locator('a[href*="benchmarks/"]') })
  await expect(sources).toHaveCount(8)
  for (const [index, disclosure] of (await sources.all()).entries()) {
    const summary = disclosure.locator('summary')
    await summary.focus(); await summary.press('Enter')
    await expect(disclosure.locator('a[href*="benchmarks/"]')).toBeVisible()
    await expect(disclosure.locator('code').first()).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    if (index === 0 || index === 7) await disclosure.screenshot({ path: info.outputPath(`source-${index}.png`), caret: 'initial' })
    await summary.press('Enter')
  }
  expect(errors).toEqual([])
})

test('chart catalog shows full labels, exact zero, and native table controls', async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.goto('/en/design-system#benchmark-charts')
  const gallery = page.locator('[data-benchmark-gallery]')
  await gallery.scrollIntoViewIfNeeded()
  const zero = gallery.getByRole('meter', { name: 'No recorded work' })
  await expect(zero).toHaveAttribute('aria-valuenow', '0')
  expect(await zero.locator('.benchmark-fill').evaluate(element => element.getBoundingClientRect().width)).toBe(0)
  const label = gallery.getByText('A deliberately long scenario name that remains readable on a narrow screen', { exact: true })
  await expect(label).toBeVisible()
  expect(await label.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
  const disclosure = gallery.locator('summary').filter({ hasText: 'Illustrative measurements by fixture' })
  await disclosure.focus(); await disclosure.press('Enter')
  await expect(gallery.getByRole('region', { name: 'Illustrative measurements by fixture' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await gallery.screenshot({ path: info.outputPath('benchmark-gallery.png'), caret: 'initial', style: 'nav.app-wrapper,nextjs-portal{visibility:hidden}' })
  expect(errors).toEqual([])
})
