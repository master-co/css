import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import snapshot from '../../../benchmarks/docs-page-css-size/snapshot.json' with { type: 'json' }

const headings = JSON.parse(readFileSync(new URL('../final-page-heading-ids.json', import.meta.url), 'utf8')) as Record<string, string[]>
function errorsFor(page: Page) {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', event => {
    // The browser test harness attempts script injection into the intentionally scriptless syntax-tutorial iframe.
    const sandboxNotice = /^Blocked script execution in 'about:(?:srcdoc|blank)' because the document's frame is sandboxed and the 'allow-scripts' permission is not set\.$/
    if (event.type() === 'error' && !sandboxNotice.test(event.text())) errors.push(event.text())
  })
  return errors
}
async function capture(page: Page, path: string) {
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() => scrollTo(0, 0))
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path, fullPage: true, scale: 'css', caret: 'initial', style: 'nav.app-wrapper,nextjs-portal{visibility:hidden}' })
}

test('original Guide charts and source data remain readable and operable', async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.goto('/en/guide/benchmarks')
  for (const id of headings['/guide/benchmarks']) await expect(page.locator(`[id="${id}"]`)).toHaveCount(1)
  const sizeChart = page.locator('figure').filter({ has: page.locator('figcaption').filter({ hasText: 'total size' }) })
  await expect(sizeChart.getByRole('button', { name: 'Raw' })).toHaveClass(/active/)
  await expect(sizeChart.locator('svg rect')).toHaveCount(snapshot.pages.length * 2)
  await sizeChart.getByRole('button', { name: 'Brotli' }).click()
  await expect(sizeChart.getByRole('button', { name: 'Brotli' })).toHaveClass(/active/)
  await expect(sizeChart.locator('svg rect')).toHaveCount(snapshot.pages.length * 2)
  const sourceLinks = page.locator('a[href*="benchmarks/"]')
  const uniqueSources = await sourceLinks.evaluateAll(links => [...new Set(links.map(link => (link as HTMLAnchorElement).href))])
  expect(uniqueSources).toHaveLength(8)
  await expect(page.getByRole('button', { name: 'Expand', exact: true })).toHaveCount(8)
  const firstExpand = page.getByRole('button', { name: 'Expand', exact: true }).first()
  await firstExpand.focus()
  await firstExpand.press('Enter')
  await expect(page.getByRole('button', { name: 'Collapse', exact: true })).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Collapse', exact: true }).locator('xpath=../preceding-sibling::div[1]//tbody/tr')).toHaveCount(16)
  await page.getByRole('button', { name: 'Collapse', exact: true }).press('Enter')
  for (const meter of await page.getByRole('meter').all()) {
    await expect(meter).toHaveAccessibleName(/\S/)
    await expect(meter).not.toHaveAccessibleName(/\[object Object\]/)
  }
  await capture(page, info.outputPath('benchmarks.png'))
  expect(errors).toEqual([])
})

test('chart catalog shows full labels, exact zero, and native table controls', async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.goto('/en/design-system#benchmark-charts')
  const gallery = page.locator('[data-benchmark-gallery]')
  await gallery.scrollIntoViewIfNeeded()
  const zero = gallery.getByRole('meter', { name: 'No recorded work' })
  await expect(zero).toHaveAttribute('aria-valuenow', '0')
  expect(await zero.locator('div').first().evaluate(element => element.getBoundingClientRect().width)).toBe(0)
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
