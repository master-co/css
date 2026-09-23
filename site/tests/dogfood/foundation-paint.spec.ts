import { expect, test, type Locator } from '@playwright/test'
import { ready } from './interactions-helpers'

const colorNames = ['color-roles', 'surfaces', 'lines', 'text-roles', 'base-hue', 'text-hue']
async function theme(demo: Locator, mode: 'light' | 'dark') {
  const specimen = demo.locator(`[data-theme-specimen="${mode}"]`)
  const frame = await ready(specimen)
  await expect(frame.locator('html')).toHaveClass(new RegExp(mode))
  return frame
}
const css = (item: Locator, key: string) => item.evaluate((e, key) => getComputedStyle(e).getPropertyValue(key), key)

test('paired specimens keep independent native themes and complete readable content', async ({ page }) => {
  await page.goto('/en/guide/colors')
  for (const name of colorNames) {
    const demo = page.locator(`[data-foundation-paint="${name}"]`)
    const light = await theme(demo, 'light'), dark = await theme(demo, 'dark')
    expect(await css(light.locator('body'), 'background-color')).not.toBe(await css(dark.locator('body'), 'background-color'))
    for (const frame of [light, dark]) {
      expect(await frame.locator('body').evaluate(e => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1)
      await expect.poll(() => frame.locator('body').evaluate(e => e.ownerDocument.documentElement.scrollHeight - e.ownerDocument.defaultView!.innerHeight)).toBeLessThanOrEqual(1)
    }
    expect(await light.locator('body').innerText()).toBe(await dark.locator('body').innerText())
  }
  await page.locator('html').evaluate(e => { e.classList.toggle('dark'); e.classList.toggle('light') })
  for (const name of colorNames) for (const mode of ['light', 'dark'] as const) await theme(page.locator(`[data-foundation-paint="${name}"]`), mode)
})

test('token inventories resolve every mode value locally, including otherwise unused roles', async ({ page }) => {
  await page.goto('/en/guide/colors')
  await theme(page.locator('[data-foundation-paint="color-roles"]'), 'light')
  const swatches = page.locator('.demo-token-preview')
  expect(await swatches.count()).toBeGreaterThan(50)
  for (const mode of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: mode as 'light' | 'dark' })
    await expect(page.locator('html')).toHaveClass(new RegExp(mode))
    const values = await swatches.evaluateAll(items => items.map(e => getComputedStyle(e).getPropertyValue('--demo-token-color')))
    expect(values.every(value => value.trim() && !value.includes('undefined'))).toBe(true)
    for (const item of await page.locator('.demo-token-preview[data-paint="background"]').all()) await expect(item).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await expect(page.locator('[data-token="--color-surface-inverse"]')).toHaveCSS('background-color', mode === 'light' ? 'oklch(0 0 none)' : 'oklch(1 0 none)')
  }
})

test('text roles use real controls and lines retain width and style', async ({ page }) => {
  await page.goto('/en/guide/colors')
  for (const mode of ['light', 'dark'] as const) {
    const text = await theme(page.locator('[data-foundation-paint="text-roles"]'), mode)
    await expect(text.getByRole('button', { name: 'Archive unavailable' })).toBeDisabled()
    const link = text.getByRole('link', { name: 'Explore text roles' })
    await expect(link).toHaveAttribute('href', '/guide/colors#text-roles')
    await link.focus(); await page.keyboard.press('ArrowRight'); await expect(link).toBeFocused()
    await expect(link).toHaveCSS('outline-width', '2px')
    const lines = await theme(page.locator('[data-foundation-paint="lines"]'), mode)
    for (const line of await lines.locator('section').all()) {
      await expect(line).toHaveCSS('border-top-width', '1px'); await expect(line).toHaveCSS('border-top-style', 'solid')
    }
    expect(await css(lines.locator('section').first(), 'border-top-color')).not.toBe(await css(lines.locator('section').last(), 'border-top-color'))
  }
})

test('palette has all thirteen fixed steps and keyboard copy confirms a real write', async ({ page, context, browserName }) => {
  await page.goto('/en/guide/colors')
  const family = page.getByRole('region', { name: 'blue palette', exact: true })
  await expect(family.getByRole('button')).toHaveCount(13)
  await expect(family.locator('.demo-label')).toHaveText(['0', '5', '10', '20', '30', '40', '50', '60', '70', '80', '90', '95', '100'])
  const color = family.getByRole('button', { name: 'Copy color-blue-60', exact: true })
  await expect(color).toHaveCSS('background-color', /oklch/)
  const channels = (await css(color, 'background-color')).match(/[\d.]+/g)!.map(Number)
  for (const [i, value] of [0.5183, 0.2687, 266.1].entries()) expect(channels[i]).toBeCloseTo(value, 4)
  if (browserName === 'chromium') {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    for (const [step, key] of [['60', 'Enter'], ['95', 'Space']]) {
      const chip = family.getByRole('button', { name: `Copy color-blue-${step}`, exact: true })
      await chip.focus(); await page.keyboard.press(key)
      await expect(page.locator('[data-foundation-palette] [role="status"]')).toHaveText(`Copied var(--color-blue-${step})`)
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`var(--color-blue-${step})`)
      await expect(chip).toBeFocused()
    }
  } else {
    await color.focus(); await page.keyboard.press('ArrowRight'); await expect(color).toBeFocused()
    await expect(color).toHaveCSS('outline-width', '2px')
  }
})

test('clipboard denial reports failure without claiming success or overflowing', async ({ page }) => {
  await page.goto('/en/guide/colors')
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new DOMException('Denied', 'NotAllowedError')) } }))
  const button = page.getByRole('button', { name: 'Copy color-blue-100', exact: true })
  await button.click()
  await expect(page.locator('[data-foundation-palette] [role="status"]')).toHaveText('Copy unavailable. Select this value: var(--color-blue-100)')
  await expect(button).toBeEnabled()
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
})

test('elevation uses native token shadows and preserves focus and print behavior', async ({ page, browserName }) => {
  await page.goto('/en/guide/elevation')
  const scale = page.locator('[data-shadow-token]')
  await expect(scale).toHaveCount(6)
  const values = await scale.evaluateAll(items => items.map(item => getComputedStyle(item).boxShadow))
  expect(new Set(values).size).toBe(6); expect(values).not.toContain('none')
  const demo = page.locator('[data-foundation-paint="elevation-state"]')
  for (const mode of ['light', 'dark'] as const) {
    const frame = await theme(demo, mode), link = frame.getByRole('link', { name: /Collection guide/ })
    const before = await css(link, 'box-shadow')
    if (await page.evaluate(() => matchMedia('(hover:hover)').matches)) {
      await link.hover(); await expect(link).not.toHaveCSS('box-shadow', before)
      await page.mouse.move(0, 0); await expect(link).toHaveCSS('box-shadow', before)
    }
    await link.focus(); await page.keyboard.press('ArrowRight')
    await expect(link).not.toHaveCSS('box-shadow', before); await expect(link).toHaveCSS('outline-width', '2px')
    if (browserName === 'chromium') {
      await page.emulateMedia({ media: 'print' }); await expect(link).toHaveCSS('box-shadow', 'none')
      await page.emulateMedia({ media: 'screen' })
    }
  }
})

for (const route of ['colors', 'elevation']) test(`paint composition: ${route}`, async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await page.setViewportSize({ ...page.viewportSize()!, height: 1600 })
  await page.goto(`/en/guide/${route}`)
  await page.addStyleTag({ content: 'nextjs-portal{visibility:hidden}' })
  for (const [index, demo] of (await page.locator('.site-demo').all()).entries()) {
    const box = await demo.boundingBox()
    if (box && box.height > 1400) await page.setViewportSize({ ...page.viewportSize()!, height: Math.ceil(box.height + 200) })
    await demo.scrollIntoViewIfNeeded()
    for (const mode of ['light', 'dark'] as const) if (await demo.locator(`[data-theme-specimen="${mode}"]`).count()) await theme(demo, mode)
    await demo.evaluate(e => window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 96))
    await demo.screenshot({ path: info.outputPath(`demo-${index}.png`), scale: 'css', caret: 'initial', style: 'nav.app-wrapper{visibility:hidden}' })
    await page.setViewportSize({ ...page.viewportSize()!, height: 1600 })
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  expect(errors).toEqual([])
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: info.outputPath('page.png'), fullPage: true, scale: 'css', caret: 'initial' })
})

test('paint gallery provides all eight recipes and a focused palette', async ({ page }, info) => {
  await page.setViewportSize({ ...page.viewportSize()!, height: 1600 })
  await page.goto('/en/design-system')
  await page.addStyleTag({ content: 'nextjs-portal{visibility:hidden}' })
  await expect(page.locator('[data-paint-recipe]')).toHaveCount(8)
  const palette = page.locator('[data-foundation-palette]')
  await expect(palette.getByRole('button')).toHaveCount(26)
  await palette.scrollIntoViewIfNeeded(); await palette.screenshot({ path: info.outputPath('palette.png'), scale: 'css' })
  for (const [index, demo] of (await page.locator('[data-foundation-paint]').all()).entries()) {
    for (const mode of ['light', 'dark'] as const) await theme(demo, mode)
    await demo.evaluate(e => window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 96))
    await demo.screenshot({ path: info.outputPath(`recipe-${index}.png`), scale: 'css', caret: 'initial', style: 'nav.app-wrapper{visibility:hidden}' })
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
})
