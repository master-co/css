import { expect, test } from '@playwright/test'
import { ready } from './interactions-helpers'

const families = ['sand', 'taupe', 'olive', 'sage', 'moss', 'petrol', 'copper', 'terracotta']
const levels = [0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100]

test('new palette is complete and copies the authored OKLCH value', async ({ page, context, browserName }) => {
  if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/en/guide/colors')
  for (const family of families) {
    for (const level of levels) {
      const swatch = page.locator(`[role="button"][title^="${family}-${level} "]`)
      await expect(swatch).toHaveCount(1)
      await expect(swatch).toHaveCSS('background-color', /oklch/)
    }
  }
  const swatch = page.locator('[role="button"][title^="petrol-60 "]')
  await swatch.focus()
  const authored = (await swatch.getAttribute('title'))!.slice('petrol-60 '.length)
  expect(authored).toMatch(/^oklch\(/)
  if (browserName === 'chromium') {
    await page.keyboard.press('Enter')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(authored)
  } else {
    await expect(swatch).toBeFocused()
  }
  await expect(page.locator('main')).toContainText('Existing classes such as')
})

test('material compositions resolve both modes without overflow', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/en/guide/colors')
  for (const name of ['architecture', 'living', 'boutique']) {
    const demo = page.locator(`[data-foundation-paint="natural-${name}"]`)
    for (const mode of ['light', 'dark']) {
      const specimen = demo.locator(`[data-theme-specimen="${mode}"]`)
      const frame = await ready(specimen)
      await expect(frame.locator('html')).toHaveClass(new RegExp(mode))
      const article = frame.locator('article')
      await expect(article).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
      await expect(frame.locator('svg')).toHaveAccessibleName(/.+/)
      expect(await frame.locator('body').evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
      const paints = await frame.locator('svg [class]').evaluateAll(elements => elements.map(element => getComputedStyle(element).fill))
      expect(paints.filter(value => value.startsWith('oklch')).length).toBeGreaterThan(4)
      if (name === 'boutique') {
        const text = frame.locator('.text-petrol').first()
        await expect(text).toHaveCSS('color', mode === 'light' ? 'oklch(0.493 0.091 219)' : 'oklch(0.768 0.066 213)')
        const link = frame.getByRole('link', { name: 'View the palette' })
        await link.focus()
        await expect(link).toBeFocused()
      }
      await specimen.screenshot({ path: info.outputPath(`${name}-${mode}.png`), scale: 'css', style: 'nav.app-wrapper{visibility:hidden}' })
    }
  }
  expect(errors).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
})
