import { expect, test, type Page } from '@playwright/test'
import catalog from '../../.generated/reference.json' with { type: 'json' }
import type { ReferenceCatalog } from '../../reference/types'
import { variableNamespaceSources } from '../../utils/variable-namespace-sources'
import { ready } from './interactions-helpers'

function captureErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  return errors
}

for (const slug of ['modes', 'layers']) test(`complete project rule ${slug}`, async ({ page }, info) => {
  const errors = captureErrors(page)
  await page.goto(`/en/reference/rules/${slug}`)
  const doc = (catalog as ReferenceCatalog).documents.find(doc => doc.id === `rules/${slug}`)!
  for (const heading of doc.headings) await expect(page.locator(`[id="${heading.id}"]`)).toHaveCount(1)
  for (const example of doc.examples.filter(example => example.configuration)) {
    await expect(page.locator('pre').filter({ hasText: example.classes.includes('btn') ? '.btn' : example.classes.includes('p:card') ? '--spacing-card' : '1.5rem' }).first()).toBeAttached()
  }
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: info.outputPath('page.png'), fullPage: true, scale: 'css', style: 'nav.app-wrapper{visibility:hidden}' })
  expect(errors).toEqual([])
})

test('namespace index keeps every consumer and links to the current token inventory', async ({ page }, info) => {
  const errors = captureErrors(page)
  await page.goto('/en/reference/rules/modes#default-namespace-sources')
  const table = page.locator('table').filter({ has: page.getByRole('columnheader', { name: 'Consumers', exact: true }) })
  await expect(table.locator('tbody tr')).toHaveCount(variableNamespaceSources.length)
  for (const { namespace, consumers } of variableNamespaceSources) {
    const row = table.getByRole('row').filter({ has: page.getByRole('rowheader', { name: `${namespace}-*`, exact: true }) })
    await expect(row).toHaveCount(1)
    expect(await row.locator('code').allTextContents()).toEqual([`${namespace}-*`, ...consumers])
  }
  const spacing = table.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'spacing-*', exact: true }) })
  const more = spacing.locator('summary')
  await more.focus(); await page.keyboard.press('Enter'); await expect(spacing.locator('details')).toHaveAttribute('open', '')
  await expect(spacing.getByText('scroll-padding-inline-end:', { exact: true })).toBeVisible()
  await page.keyboard.press('Enter'); await expect(spacing.locator('details')).not.toHaveAttribute('open', '')
  expect(await table.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true)
  await table.screenshot({ path: info.outputPath('namespaces.png'), scale: 'css', style: 'nav.app-wrapper{visibility:hidden}' })
  const link = page.getByRole('link', { name: 'token reference', exact: true })
  await link.focus(); await expect(link).toBeFocused(); await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/reference#tokens$/)
  await expect(page.locator('h2#tokens')).toBeInViewport()
  expect(errors).toEqual([])
})

test('design system namespace recipes expose complete keys with native keyboard disclosure', async ({ page }, info) => {
  const errors = captureErrors(page)
  await page.goto('/en/design-system#namespace-consumers')
  await ready(page.locator('[data-project-style="tokens"]'))
  const table = page.locator('.doc-namespace-table')
  await expect(table.getByRole('rowheader')).toHaveCount(3)
  await table.screenshot({ path: info.outputPath('namespace-recipes.png'), scale: 'css', style: 'nav.app-wrapper{visibility:hidden}' })
  const spacing = table.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'spacing-*', exact: true }) })
  const details = spacing.locator('details'), summary = details.locator('summary')
  await summary.focus(); await page.keyboard.press('Space'); await expect(summary).toBeFocused()
  await expect(details).toHaveAttribute('open', '')
  await expect(details.getByText('scroll-padding-inline-end:', { exact: true })).toBeVisible()
  expect(await spacing.locator('code').allTextContents()).toEqual(['spacing-*', ...variableNamespaceSources.find(row => row.namespace === 'spacing')!.consumers])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await spacing.screenshot({ path: info.outputPath('namespace-expanded.png'), scale: 'css', style: 'nav.app-wrapper{visibility:hidden}' })
  await summary.focus(); await page.keyboard.press('Space'); await expect(details).not.toHaveAttribute('open', '')
  expect(errors).toEqual([])
})
