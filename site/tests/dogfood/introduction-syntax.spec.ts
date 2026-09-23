import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { getThemeNumericVariableEntries } from '../../utils/theme-variables'

const previous = JSON.parse(readFileSync(new URL('../final-page-heading-ids.json', import.meta.url), 'utf8')) as Record<string, string[]>
const breakpoint = getThemeNumericVariableEntries('breakpoint').find(entry => entry.key === 'sm')!.px
const spacing = Object.fromEntries(getThemeNumericVariableEntries('spacing').map(entry => [entry.key, `${entry.px}px`]))
const style = 'nav.app-wrapper,nextjs-portal{visibility:hidden}'
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
  await page.screenshot({ path, fullPage: true, scale: 'css', caret: 'initial', style })
}

test('introduction pairs the literal first panel with its code and preserves card navigation', async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.goto('/en/guide/introduction')
  for (const id of previous['/guide/introduction']) await expect(page.locator(`[id="${id}"]`)).toHaveCount(1)
  const image = page.locator('.site-demo img').first()
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true)
  await expect(image).toHaveCSS('aspect-ratio', '16 / 9')
  expect(await image.evaluate(element => { const box = element.getBoundingClientRect(); return box.width / box.height })).toBeCloseTo(16 / 9, 1)
  const preview = page.locator('[data-project-style="first-panel"] iframe')
  await preview.scrollIntoViewIfNeeded()
  await expect(preview).toHaveAttribute('data-ready', 'true')
  const frame = preview.contentFrame()
  const panel = frame.locator('section')
  await expect(panel).toHaveAttribute('class', 'grid gap:md p:lg r:lg bg:blue-60 fg:white')
  await expect(panel).toHaveCSS('display', 'grid')
  await expect(panel).toHaveCSS('gap', spacing.md)
  await expect(panel).toHaveCSS('padding', spacing.lg)
  await expect(frame.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(frame.getByText('A compact panel styled from its class list.')).toBeVisible()
  await capture(page, info.outputPath('introduction.png'))
  const code = page.getByText('Card structure', { exact: true })
  await code.focus()
  await code.press('Enter')
  await expect(page.locator('details[open]')).toContainText('building.jpg')
  const start = page.getByRole('link', { name: 'Start building', exact: true })
  await start.focus()
  await start.press('Enter')
  await expect(page).toHaveURL(/\/guide\/installation$/)
  expect(errors).toEqual([])
})

test('syntax specimens apply real breakpoint, hover, focus and project-token rules', async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.goto('/en/guide/syntax-tutorial')
  for (const id of previous['/guide/syntax-tutorial']) await expect(page.locator(`[id="${id}"]`)).toHaveCount(1)
  const examples = [
    ['Padding around the label', false, false],
    ['Hover and keyboard focus', false, false],
    ['Padding across the breakpoint', true, false],
    ['A conditional hover state', true, true],
    ['The complete Save button', true, false],
  ] as const
  for (const [title, responsive, conditional] of examples) {
    const demo = page.locator(`[data-tutorial-preview="${title}"]`)
    const iframe = demo.locator('iframe')
    await iframe.scrollIntoViewIfNeeded()
    await expect(iframe).toHaveAttribute('data-ready', 'true')
    const button = iframe.contentFrame().getByRole('button', { name: 'Save', exact: true })
    await expect(button).toHaveAttribute('type', 'button')
    await expect(button).toHaveCSS('padding', spacing.md)
    if (title === 'The complete Save button') await expect(button).toHaveAttribute('class', /p:action/)
    const base = await button.evaluate(element => getComputedStyle(element).color)
    if (title !== 'Padding around the label') {
      await page.keyboard.press('Tab')
      await button.focus()
      expect(await button.evaluate(element => element.matches(':focus-visible'))).toBe(true)
      expect(await button.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none')
      const selected = await button.evaluate(element => getComputedStyle(element).color)
      expect(selected).not.toBe(base)
      await button.evaluate((element: HTMLButtonElement) => element.blur())
      if (!info.project.use.isMobile) {
        await button.hover()
        await expect(button).toHaveCSS('color', conditional ? base : selected)
        await page.mouse.move(0, 0)
      }
    }
    if (responsive) {
      expect(await iframe.evaluate((element: HTMLIFrameElement) => element.contentWindow!.innerWidth)).toBe(Math.floor(breakpoint) - 1)
      const wide = demo.getByRole('button', { name: 'At sm and above', exact: true })
      await wide.focus()
      await wide.press('Enter')
      await expect(wide).toHaveAttribute('aria-pressed', 'true')
      await expect(button).toHaveCSS('padding', spacing.lg)
      expect(await iframe.evaluate((element: HTMLIFrameElement) => element.contentWindow!.innerWidth)).toBe(Math.ceil(breakpoint) + 1)
      if (conditional && !info.project.use.isMobile) {
        await button.hover()
        expect(await button.evaluate(element => getComputedStyle(element).color)).not.toBe(base)
        await page.mouse.move(0, 0)
      }
      const range = demo.getByRole('slider', { name: 'Viewport', exact: true })
      await range.focus()
      await range.press('ArrowLeft')
      await expect(range).toHaveValue(String(Math.ceil(breakpoint)))
      await expect(button).toHaveCSS('padding', spacing.lg)
      await range.press('ArrowLeft')
      await expect(button).toHaveCSS('padding', spacing.md)
      await demo.getByRole('button', { name: 'Fit', exact: true }).click()
      await expect(iframe).toHaveJSProperty('clientWidth', await iframe.locator('..').evaluate(element => element.clientWidth))
      await demo.getByRole('button', { name: 'Below sm', exact: true }).click()
    }
  }
  await capture(page, info.outputPath('syntax.png'))
  const source = page.getByText('Complete source and generated CSS', { exact: true })
  await source.focus()
  await source.press('Enter')
  await expect(page.locator('details[open]')).toContainText('--spacing-action: 1rem')
  await expect(page.locator('details[open]')).toContainText('p:action')
  expect(errors).toEqual([])
})


test('design system documents and exercises named viewport widths', async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.goto('/en/design-system#viewport-presets')
  const demo = page.locator('[data-tutorial-preview="A breakpoint comparison"]')
  const iframe = demo.locator('iframe')
  await iframe.scrollIntoViewIfNeeded()
  await expect(iframe).toHaveAttribute('data-ready', 'true')
  const button = iframe.contentFrame().getByRole('button', { name: 'Save', exact: true })
  await expect(button).toHaveCSS('padding', spacing.md)
  const wide = demo.getByRole('button', { name: 'At sm and above', exact: true })
  await wide.focus()
  await wide.press('Enter')
  await expect(wide).toHaveAttribute('aria-pressed', 'true')
  await expect(button).toHaveCSS('padding', spacing.lg)
  await demo.screenshot({ path: info.outputPath('presets.png'), caret: 'initial', scale: 'css', style })
  const usage = page.getByRole('link', { name: 'Syntax Tutorial', exact: true }).filter({ hasNot: page.locator('svg') })
  await expect(usage).toHaveAttribute('href', /\/guide\/syntax-tutorial#conditions$/)
  expect(errors).toEqual([])
})
