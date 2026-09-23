import { expect, test, type Page } from '@playwright/test'
import { configuredExampleCSS, configuredMarkupClasses } from '../../reference/configured-example'
import { documentHeadings } from '../../reference/headings'
import { migrationGuides } from '../../utils/migration-guides'
import { migrationFences, migrationSource, renderMigrationExample, vendorMigrationSlugs } from '../migration-examples'

async function specimen(page: Page, html: string, source = '', extraCSS = '') {
  const classes = configuredMarkupClasses(html)
  await page.setContent(`<meta name="viewport" content="width=device-width,initial-scale=1"><style>${configuredExampleCSS(source, classes)}${extraCSS}</style>${html}`)
}

function configuration(slug: string) {
  return migrationFences(slug).filter(f => f.language === 'css' && /@(?:theme|components)/.test(f.text)).map(f => f.text.replace(/@import[^;]+;/g, '')).join('\n')
}

for (const slug of vendorMigrationSlugs) test(`complete vendor migration guide ${slug || 'overview'}`, async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(`/en/guide/migration${slug ? `/${slug}` : ''}`)
  for (const heading of documentHeadings(migrationSource(slug))) await expect(page.locator(`[id="${heading.id}"]`)).toHaveCount(1)
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.doc-table')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: info.outputPath(`${slug || 'overview'}.png`), fullPage: true, scale: 'css', caret: 'initial', style: 'nav.app-wrapper{visibility:hidden}' })
  expect(errors).toEqual([])
})

test('Bootstrap replacement uses the original column boundary and explicit new geometry', async ({ page }) => {
  const html = migrationFences('bootstrap').find(f => f.language === 'html' && f.text.includes('grid-cols:3@dashboard'))!.text
  expect(configuredMarkupClasses(html)).not.toContain('container')
  await specimen(page, html, configuration('bootstrap'))
  const grid = page.locator('.grid')
  await expect(grid).toHaveCSS('gap', '24px')
  await expect(page.locator('body > div')).toHaveCSS('max-width', '1152px')
  await expect(page.locator('body > div')).toHaveCSS('padding', '48px 12px')
  await expect(page.locator('body > div')).toHaveCSS('container-type', 'normal')
  for (const [width, count] of [[767, 1], [768, 3]]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await grid.evaluate(e => getComputedStyle(e).gridTemplateColumns.split(' ').length)).toBe(count)
  }
  const nav = migrationFences('bootstrap').find(f => f.text.includes('min-w:16rem'))!.text
  await specimen(page, nav)
  await expect(page.getByRole('navigation', { name: 'Project' })).toHaveCSS('min-width', '256px')
})

test('MUI conversion preserves resolved spacing, radius, element and breakpoint', async ({ page }) => {
  const card = migrationFences('material-ui').find(f => f.text.includes('export function DashboardPanel') && !f.text.includes('@mui'))!.text
  const html = renderMigrationExample(card, 'DashboardPanel', { children: 'Project settings' })
  await specimen(page, html, configuration('material-ui'))
  const panel = page.locator('body > div')
  await expect(panel).toHaveCSS('display', 'grid')
  await expect(panel).toHaveCSS('gap', '16px')
  await expect(panel).toHaveCSS('padding', '24px')
  await expect(panel).toHaveCSS('border-radius', '16px')
  await expect(panel).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  const gridHTML = migrationFences('material-ui').find(f => f.language === 'html' && f.text.includes('grid-cols:3@dashboard'))!.text
  await specimen(page, gridHTML, configuration('material-ui'))
  for (const [width, count] of [[899, 1], [900, 3]]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.locator('.grid').evaluate(e => getComputedStyle(e).gridTemplateColumns.split(' ').length)).toBe(count)
  }
})

test('Sass card conversion preserves the authored original geometry', async ({ page }) => {
  const fences = migrationFences('sass')
  const css = fences.find(f => f.text.startsWith('.card {'))!.text.replace('.card', '[data-original]')
  const html = renderMigrationExample(fences.find(f => f.text.includes('export function Card'))!.text, 'Card', { children: 'Project overview' })
  await specimen(page, `<section data-original>Project overview</section>${html}`, configuration('sass'), css)
  const geometry = await page.locator('section').evaluateAll(nodes => nodes.map(e => {
    const style = getComputedStyle(e)
    const context = document.createElement('canvas').getContext('2d')!
    context.fillStyle = style.backgroundColor
    context.fillRect(0, 0, 1, 1)
    return [style.display, style.gap, style.padding, style.borderRadius, [...context.getImageData(0, 0, 1, 1).data], e.getBoundingClientRect().height]
  }))
  expect(geometry[0]).toEqual(geometry[1])
  expect(geometry[1].slice(0, 4)).toEqual(['grid', '16px', '24px', '12px'])
})

test('migrated native controls retain visible keyboard focus and disabled state', async ({ page, browserName }) => {
  for (const slug of ['bootstrap', 'material-ui', 'sass']) {
    const html = migrationFences(slug).find(f => f.language === 'html' && f.text.includes('<button'))!.text
    await specimen(page, html, configuration(slug))
    const button = page.getByRole('button', { name: 'Save' })
    // WebKit's native Option+Tab preference includes links and buttons.
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
    await expect(button).toBeFocused()
    await expect(button).toHaveCSS('outline-style', 'solid')
    await expect(button).toHaveCSS('outline-width', '2px')
    await expect(button).toHaveAttribute('type', 'button')
    await button.evaluate(e => { (e as HTMLButtonElement).disabled = true })
    await expect(button).toBeDisabled()
    await expect(button).toHaveCSS('opacity', '0.5')
  }
})

test('migration choices preserve accessible links and keyboard navigation', async ({ page, browserName }, info) => {
  await page.goto('/en/guide/migration#frameworks')
  const choices = page.getByRole('navigation', { name: 'Migration guides', exact: true })
  await expect(choices.getByRole('link')).toHaveCount(7)
  for (const guide of migrationGuides) await expect(choices.getByRole('link', { name: `${guide.title} ${guide.description}`, exact: true })).toHaveAttribute('href', `/en/guide/migration/${guide.slug}`)
  const first = choices.getByRole('link').first()
  await first.focus()
  await expect(first).toHaveCSS('outline-style', 'solid')
  // WebKit's native Option+Tab preference includes links and buttons.
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
  await expect(choices.getByRole('link').nth(1)).toBeFocused()
  await choices.screenshot({ path: info.outputPath('migration-choices.png'), scale: 'css', caret: 'initial', style: 'nav.app-wrapper{visibility:hidden}' })
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/guide\/migration\/css$/)
})

test('document choice gallery shows text and branded variants without overflow', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/en/design-system#document-choices')
  const plain = page.getByRole('navigation', { name: 'Example guide choices' })
  const branded = page.getByRole('navigation', { name: 'Migration guides', exact: true })
  await expect(plain.getByRole('link')).toHaveCount(2)
  await expect(branded.getByRole('link')).toHaveCount(7)
  for (const [name, example] of [['plain', plain], ['branded', branded]] as const) {
    expect(await example.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true)
    await example.screenshot({ path: info.outputPath(`choices-${name}.png`), scale: 'css', caret: 'initial', style: 'nav.app-wrapper{visibility:hidden}' })
  }
  expect(errors).toEqual([])
})
