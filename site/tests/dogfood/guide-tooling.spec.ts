import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { documentHeadings } from '../../reference/headings'
import { deliverySource } from '../delivery-examples'
import { toolingExample } from '../../utils/tooling-guide-data'

const previous = JSON.parse(readFileSync(new URL('../guide-tooling-heading-ids.json', import.meta.url), 'utf8')) as Record<string, { id: string }[]>
const captureStyle = 'nav.app-wrapper,nextjs-portal{visibility:hidden}'
function errorsFor(page: Page) {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', e => { if (e.type() === 'error') errors.push(e.text()) })
  return errors
}
async function readableOptions(page: Page) {
  for (const row of await page.locator('.doc-option').all()) {
    await row.scrollIntoViewIfNeeded()
    expect(await row.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true)
    const description = row.locator('dd p')
    await expect(description).toBeVisible()
    const [name, text] = await Promise.all([row.locator('dt').boundingBox(), description.boundingBox()])
    expect(text!.width).toBeGreaterThan(250)
    expect(text!.y).toBeGreaterThan(name!.y)
  }
}
for (const slug of ['code-linting', 'language-service']) test(`complete tooling guide ${slug}`, async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.goto(`/en/guide/${slug}`)
  for (const heading of [...documentHeadings(deliverySource(slug)), ...previous[slug]]) await expect(page.locator(`[id="${heading.id}"]`)).toHaveCount(1)
  await readableOptions(page)
  for (const pre of await page.locator('main pre').all()) if (await pre.isVisible()) await pre.scrollIntoViewIfNeeded()
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  for (const example of await page.locator('[data-tooling-example]').all()) {
    const name = (await example.getAttribute('data-tooling-example'))!
    const data = toolingExample(name)
    const codes = example.locator('pre code')
    expect((await codes.nth(0).innerText()).trim()).toBe(data.source)
    if (data.result !== undefined) expect((await codes.nth(1).innerText()).trim()).toBe(data.result)
    if (data.diagnostic) await expect(example.locator('.doc-code-diagnostic')).toContainText(data.diagnostic.message)
    await example.screenshot({ path: info.outputPath(`${name}.png`), scale: 'css', caret: 'initial', style: captureStyle })
  }
  await page.screenshot({ path: info.outputPath(`${slug}.png`), fullPage: true, scale: 'css', caret: 'initial', style: captureStyle })
  expect(errors).toEqual([])
})

test('code copy supports keyboard activation and an unavailable clipboard', async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { document.body.dataset.copiedText = text } } })
  })
  await page.goto('/en/guide/code-linting')
  const example = page.locator('[data-tooling-example="sort"]')
  const button = example.getByRole('button', { name: 'Copy A stable class order — After sorting', exact: true })
  await button.focus(); await page.keyboard.press('Enter')
  await expect(button).toBeFocused()
  await expect(button).toHaveCSS('outline-width', '2px')
  await expect(example.getByRole('status').last()).toHaveText('A stable class order — After sorting copied')
  await expect(page.locator('body')).toHaveAttribute('data-copied-text', toolingExample('sort').result!)
  await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('Permission denied')) } }) })
  await page.keyboard.press('Enter')
  await expect(example.getByRole('status').last()).toContainText('Clipboard unavailable')
  await expect(example.getByRole('status').last()).toBeVisible()
  await example.screenshot({ path: info.outputPath('clipboard-unavailable.png'), scale: 'css', style: captureStyle })
  expect(errors).toEqual([])
})

test('tooling documentation gallery keeps long options and code pairs readable', async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.goto('/en/design-system#tooling-documentation')
  const section = page.locator('[data-tooling-gallery]')
  await expect(section).toBeVisible()
  for (const item of await section.locator('[data-tooling-options], [data-tooling-example]').all()) {
    await item.scrollIntoViewIfNeeded()
    for (const pre of await item.locator('pre').all()) await pre.scrollIntoViewIfNeeded()
    const name = await item.getAttribute('data-tooling-options') ?? await item.getAttribute('data-tooling-example')
    await item.screenshot({ path: info.outputPath(`gallery-${name}.png`), scale: 'css', caret: 'initial', style: captureStyle })
  }
  expect(await section.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true)
  expect(errors).toEqual([])
})
