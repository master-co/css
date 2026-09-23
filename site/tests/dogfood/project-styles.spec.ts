import { expect, test, type Locator } from '@playwright/test'
import { ready } from './interactions-helpers'

const recipe = (name: string) => `[data-project-style="${name}"]`
const styles = (item: Locator, properties: string[]) => item.evaluate((e, properties) => properties.map(property => getComputedStyle(e).getPropertyValue(property)), properties)
const guides = {
  theme: ['tokens', 'modes'],
  'variables-and-modes': ['spacing', 'modes'],
  'global-styles': ['components'],
  'cascade-layers': ['layers'],
}
const anchors = {
  theme: ['overview', 'project-css-entry', 'define-tokens', 'use-tokens', 'alias-and-override-tokens', 'add-mode-aware-values', 'use-inline-and-static-tokens', 'define-responsive-tokens', 'define-motion-tokens', 'continue-with-foundation-guides'],
  'variables-and-modes': ['give-a-repeated-value-a-project-name', 'add-modes-after-the-shared-value-works', 'look-up-a-rule', 'overview', 'variable-lifecycle', 'namespace-resolution', 'default-namespace-sources', 'contextual-token-lookup', 'inline-and-static-variables', 'mode-buckets', 'derived-mode-aware-values', 'mode-triggers', 'project-settings', 'custom-spacing-example'],
  'global-styles': ['overview', 'entry-stylesheet', 'base-layer', 'site-typeface', 'shared-vocabulary', 'component-classes', 'custom-utilities', 'organize-global-files'],
  'cascade-layers': ['override-a-component-locally', 'diagnose-a-competing-declaration', 'look-up-a-rule', 'how-layers-control-the-cascade', 'the-five-layers', 'base', 'theme', 'defaults', 'components', 'utilities', 'a-complete-flow', 'base-is-for-normalization', 'defaults-are-for-broad-defaults', 'utilities-can-override-components', 'summary'],
}

for (const [slug, names] of Object.entries(guides)) test(`complete project style guide ${slug}`, async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(`/en/guide/${slug}`)
  for (const name of names) {
    const demo = page.locator(recipe(name)), frame = await ready(demo)
    expect(await frame.locator('body').evaluate(e => e.scrollWidth <= e.ownerDocument.documentElement.clientWidth + 1)).toBe(true)
    await demo.screenshot({ path: info.outputPath(`${name}.png`), scale: 'css', style: 'nav.app-wrapper{visibility:hidden}' })
  }
  for (const id of anchors[slug as keyof typeof anchors]) await expect(page.locator(`[id="${id}"]`)).toHaveCount(1)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: info.outputPath('page.png'), fullPage: true, scale: 'css', style: 'nav.app-wrapper{visibility:hidden}' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  const generated = page.locator('details').filter({ has: page.locator('summary', { hasText: 'Generated CSS' }) }).first()
  await generated.locator('summary').focus(); await page.keyboard.press('Enter')
  await expect(generated).toHaveAttribute('open', '')
  await expect(generated.locator('pre')).toContainText('@layer')
  await page.keyboard.press('Enter'); await expect(generated).not.toHaveAttribute('open', '')
  expect(errors).toEqual([])
})

test('project namespace geometry and shared padding use real generated custom properties', async ({ page }) => {
  await page.goto('/en/guide/theme')
  const card = (await ready(page.locator(recipe('tokens')))).locator('article')
  await expect(card).toHaveCSS('padding', '24px'); await expect(card).toHaveCSS('border-radius', '12px')
  expect((await styles(card, ['--spacing-card', '--radius-card'])).map(value => value.trim())).toEqual(['1.5rem', '.75rem'])
  const contrast = await card.locator('p').first().evaluate(e => {
    const context = e.ownerDocument.createElement('canvas').getContext('2d')!
    function luminance(color: string) {
      context.fillStyle = color; context.fillRect(0, 0, 1, 1)
      const channels = Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3).map(value => {
        const channel = value / 255
        return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4
      })
      return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722
    }
    const foreground = luminance(getComputedStyle(e).color), background = luminance(getComputedStyle(e.parentElement!).backgroundColor)
    return (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05)
  })
  expect(contrast).toBeGreaterThanOrEqual(4.5)
  await page.goto('/en/guide/variables-and-modes')
  const frame = await ready(page.locator(recipe('spacing')))
  await expect(frame.locator('article')).toHaveCSS('padding', '24px')
  await expect(frame.locator('aside')).toHaveCSS('padding', '24px')
  // Native inheritance: changing the one CSS variable reaches both consumers.
  await frame.locator('html').evaluate(e => (e as HTMLElement).style.setProperty('--spacing-card', '2rem'))
  await expect(frame.locator('article')).toHaveCSS('padding', '32px')
  await expect(frame.locator('aside')).toHaveCSS('padding', '32px')
})

test('mode control changes actual generated variables without changing the card markup or outer page', async ({ page }, info) => {
  await page.goto('/en/guide/variables-and-modes')
  const demo = page.locator(recipe('modes')), frame = await ready(demo), card = frame.locator('article')
  const before = await styles(card, ['background-color', 'color']), html = await card.getAttribute('class')
  const hostClass = await page.locator('html').getAttribute('class')
  const theme = demo.getByRole('button', { name: 'Theme', exact: true })
  await theme.focus(); await page.keyboard.press('Space'); await expect(theme).toBeFocused()
  await expect.poll(() => styles(card, ['background-color', 'color'])).not.toEqual(before)
  expect(await card.getAttribute('class')).toBe(html)
  expect(await page.locator('html').getAttribute('class')).toBe(hostClass)
  await demo.screenshot({ path: info.outputPath('mode-toggled.png'), scale: 'css', style: 'nav.app-wrapper{visibility:hidden}' })
  await page.keyboard.press('Space'); await expect.poll(() => styles(card, ['background-color', 'color'])).toEqual(before)
})

test('managed component states and layered utility override work in native CSS', async ({ page }) => {
  await page.goto('/en/guide/global-styles')
  const frame = await ready(page.locator(recipe('components'))), button = frame.getByRole('button', { name: 'Preview button' })
  await button.focus(); await expect(button).toBeFocused()
  await expect(button).toHaveCSS('outline-style', 'solid'); await expect(button).toHaveCSS('outline-width', '2px')
  await expect(button).toHaveCSS('padding-block', '8px'); await expect(button).toHaveCSS('padding-inline', '16px')
  const background = await button.evaluate(e => getComputedStyle(e).backgroundColor)
  await button.hover(); await expect.poll(() => button.evaluate(e => getComputedStyle(e).backgroundColor)).not.toBe(background)
  await page.goto('/en/guide/cascade-layers')
  const cards = (await ready(page.locator(recipe('layers')))).locator('article')
  await expect(cards.first()).toHaveCSS('padding', '24px'); await expect(cards.last()).toHaveCSS('padding', '12px')
  expect(await styles(cards.first(), ['border-radius', 'border-width', 'background-color'])).toEqual(await styles(cards.last(), ['border-radius', 'border-width', 'background-color']))
})

test('design system publishes all five configured recipes and their source lessons', async ({ page }, info) => {
  await page.goto('/en/design-system')
  await expect(page.locator('#project-style-recipes')).toBeVisible()
  for (const name of ['tokens', 'spacing', 'modes', 'components', 'layers']) {
    const demo = page.locator(recipe(name)); await ready(demo)
    await demo.screenshot({ path: info.outputPath(`${name}.png`), scale: 'css', style: 'nav.app-wrapper{visibility:hidden}' })
  }
  for (const path of ['/guide/theme', '/guide/variables-and-modes', '/guide/global-styles#component-classes', '/guide/cascade-layers']) await expect(page.locator(`a[href="${path}"]`).first()).toHaveCount(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
})

test('search finds configured example content, restores focus and follows the result by keyboard', async ({ page }, info) => {
  await page.goto('/en/guide/variables-and-modes')
  await ready(page.locator(recipe('spacing')))
  const origin = page.getByRole('link', { name: 'namespace\'s consumers', exact: true })
  await origin.focus(); await page.keyboard.press('ControlOrMeta+k')
  const dialog = page.getByRole('dialog', { name: 'Search documentation' })
  const input = dialog.getByRole('searchbox', { name: 'Search documentation' })
  await input.fill('Both elements have 1.5rem of padding')
  const result = dialog.locator('a[href$="/guide/variables-and-modes#give-a-repeated-value-a-project-name"]')
  await expect(result).toHaveCount(1)
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(origin).toBeFocused()
  await page.keyboard.press('ControlOrMeta+k'); await expect(input).toHaveValue('Both elements have 1.5rem of padding')
  await dialog.screenshot({ path: info.outputPath('project-style-search.png'), scale: 'css' })
  const index = Number((await result.getAttribute('id'))!.replace('documentation-result-', ''))
  for (let i = 0; i < index; i++) await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/guide\/variables-and-modes#give-a-repeated-value-a-project-name$/)
  await expect(page.locator('#give-a-repeated-value-a-project-name')).toBeInViewport()
})
