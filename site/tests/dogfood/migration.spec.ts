import { expect, test, type Page } from '@playwright/test'
import { configuredExampleCSS, configuredMarkupClasses } from '../../reference/configured-example'
import { documentHeadings } from '../../reference/headings'
import { migrationFences, migrationSlugs, migrationSource, renderMigrationExample } from '../migration-examples'

async function specimen(page: Page, html: string, extraCSS = '', source = '') {
  await page.setContent(`<meta name="viewport" content="width=device-width,initial-scale=1"><style>${configuredExampleCSS(source, configuredMarkupClasses(html))}${extraCSS}</style>${html}`)
}

for (const slug of migrationSlugs) test(`complete migration guide ${slug}`, async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(`/en/guide/migration/${slug}`)
  for (const heading of documentHeadings(migrationSource(slug))) await expect(page.locator(`[id="${heading.id}"]`)).toHaveCount(1)
  await page.evaluate(() => document.fonts.ready)
  for (const table of await page.locator('.doc-comparison').all()) {
    expect(await table.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true)
    for (const row of await table.locator('tbody tr').all()) {
      await expect(row.locator('td')).toHaveCount(2)
      expect(await row.evaluate(e => getComputedStyle(e).contain)).toBe('none')
    }
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: info.outputPath(`${slug}.png`), fullPage: true, scale: 'css', style: 'nav.app-wrapper{visibility:hidden}' })
  expect(errors).toEqual([])
})

test('CSS card conversion preserves original dimensions and surface', async ({ page }) => {
  const fences = migrationFences('css')
  const css = fences.find(example => example.text.startsWith('.card {'))!.text
  const card = fences.find(example => example.text.includes('export function Card'))!.text
  const html = renderMigrationExample(card, 'Card', { children: 'Project overview' })
  await specimen(page, `<section data-original>Project overview</section>${html}`, `:root{--color-surface:#fff}${css.replace('.card', '[data-original]')}`)
  const geometry = await page.locator('section').evaluateAll(nodes => nodes.map(e => {
    const style = getComputedStyle(e)
    return [style.display, style.gap, style.padding, style.borderRadius, style.backgroundColor, e.getBoundingClientRect().height]
  }))
  expect(geometry[0]).toEqual(geometry[1])
  expect(geometry[1].slice(0, 4)).toEqual(['grid', '16px', '24px', '12px'])
})

test('migrated variant buttons keep native state and a visible keyboard outline', async ({ page }) => {
  const variant = migrationFences('css-in-js').find(example => example.text.includes('const toneClasses'))!.text
  const html = ['neutral', 'primary', 'danger'].map(tone => renderMigrationExample(variant, 'Button', { tone, children: tone, size: 'md' })).join('')
  await specimen(page, html)
  await page.keyboard.press('Tab')
  const button = page.getByRole('button', { name: 'primary', exact: true })
  await button.focus()
  await expect(button).toBeFocused()
  await expect(button).toHaveCSS('outline-style', 'solid')
  await expect(button).toHaveCSS('outline-width', '2px')
  expect(await button.evaluate(e => getComputedStyle(e).outlineColor)).not.toBe(await button.evaluate(e => getComputedStyle(e).color))
  await expect(button).toHaveCSS('height', '40px')
  expect(await button.getAttribute('tone')).toBeNull()
})

test('project breakpoint migrations use the authored 72rem viewport boundary', async ({ page }) => {
  for (const slug of ['tailwindcss', 'v1']) {
    const fences = migrationFences(slug)
    const source = fences.find(example => example.language === 'css' && example.text.includes('@import "@master/css"') && example.text.includes('--breakpoint-dashboard'))!.text
    const html = fences.find(example => example.language === 'html' && example.text.includes('grid-cols:3@dashboard'))!.text
    await specimen(page, html, '', source)
    const grid = page.locator('article, section')
    await page.setViewportSize({ width: 1200, height: 900 })
    expect(await grid.evaluate(e => getComputedStyle(e).gridTemplateColumns.split(' ').length)).toBe(3)
    await page.setViewportSize({ width: 390, height: 844 })
    expect(await grid.evaluate(e => getComputedStyle(e).gridTemplateColumns.split(' ').length)).toBe(1)
    if (slug === 'v1') await expect(grid).toHaveCSS('padding', '16px')
  }
})

test('all migrated progress examples render exact runtime widths with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const slug of migrationSlugs) {
    const example = migrationFences(slug).find(example => example.text.includes('export function Progress'))!.text
    await specimen(page, renderMigrationExample(example, 'Progress', { value: 75 }))
    const progress = page.getByRole('progressbar', { name: 'Upload progress' })
    await expect(progress).toHaveAttribute('aria-valuenow', '75')
    const fill = progress.locator('div')
    await expect(fill).toHaveCSS('transition-duration', '0s')
    expect(await fill.evaluate(e => e.getBoundingClientRect().width / e.parentElement!.getBoundingClientRect().width)).toBeCloseTo(.75, 2)
  }
})

test('comparison recipe keeps both columns visible', async ({ page }, info) => {
  await page.goto('/en/design-system#reading-comparisons')
  const example = page.locator('.doc-comparison')
  await expect(example).toHaveCount(1)
  await expect(example.getByRole('columnheader')).toHaveCount(2)
  expect(await example.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true)
  await example.screenshot({ path: info.outputPath('comparison-recipe.png'), scale: 'css', style: 'nav.app-wrapper{visibility:hidden}' })
})
