import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { documentHeadings } from '../../reference/headings'
import { deliverySource } from '../delivery-examples'

const slugs = ['monorepo', 'authoring-packages']
const previous = JSON.parse(readFileSync(new URL('../package-authoring-heading-ids.json', import.meta.url), 'utf8')) as Record<string, { id: string }[]>
const captureStyle = 'nav.app-wrapper,nextjs-portal{visibility:hidden}'

for (const slug of slugs) test(`complete package guide ${slug}`, async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', e => { if (e.type() === 'error') errors.push(e.text()) })
  await page.goto(`/en/guide/${slug}`)
  for (const heading of [...documentHeadings(deliverySource(slug)), ...previous[slug]]) await expect(page.locator(`[id="${heading.id}"]`)).toHaveCount(1)
  for (const frame of await page.locator('[data-project-style="authoring-package"] iframe').all()) {
    await frame.scrollIntoViewIfNeeded()
    await expect(frame).toHaveAttribute('data-ready', 'true')
  }
  const tree = page.locator('.doc-file-tree')
  await expect(tree).toHaveCount(1)
  await expect(tree.getByRole('list').first()).toBeVisible()
  await expect(tree.locator('li')).toHaveCount(slug === 'monorepo' ? 9 : 4)
  await expect(tree.locator('a,button,[tabindex],[role="tree"]')).toHaveCount(0)
  expect(await tree.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true)
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: info.outputPath(`${slug}.png`), fullPage: true, scale: 'css', caret: 'initial', style: captureStyle })
  expect(errors).toEqual([])
})

test('authored package preview preserves keyboard focus, hover and reduced motion', async ({ page, browserName }, info) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', e => { if (e.type() === 'error') errors.push(e.text()) })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/en/guide/authoring-packages#use-the-package')
  const frame = page.locator('[data-project-style="authoring-package"] iframe')
  await frame.scrollIntoViewIfNeeded()
  await expect(frame).toHaveAttribute('data-ready', 'true')
  const inner = page.frameLocator('[data-project-style="authoring-package"] iframe')
  const button = inner.getByRole('button', { name: 'Save changes' })
  await expect(button).toHaveAttribute('type', 'button')
  await expect(button).toHaveCSS('padding-inline-start', '16px')
  await expect(button).toHaveCSS('border-radius', '8px')
  await expect(button).toHaveCSS('transition-property', 'background-color')
  const duration = await button.evaluate(e => getComputedStyle(e).transitionDuration)
  expect(parseFloat(duration)).toBeGreaterThan(0)
  await frame.focus()
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
  await expect(button).toBeFocused()
  await expect(button).toHaveCSS('outline-width', '2px')
  await expect(button).toHaveCSS('outline-offset', '3px')
  await page.locator('[data-project-style="authoring-package"]').screenshot({ path: info.outputPath('package-focus.png'), scale: 'css', caret: 'initial', style: captureStyle })
  const initial = await button.evaluate(e => getComputedStyle(e).backgroundColor)
  await button.hover()
  await expect.poll(() => button.evaluate(e => getComputedStyle(e).backgroundColor)).not.toBe(initial)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(button).toHaveCSS('transition-duration', '0s')
  await expect(button).toHaveCSS('outline-width', '2px')
  await expect(inner.locator('article')).toHaveCSS('content-visibility', 'auto')
  expect(await frame.evaluate(e => {
    const doc = (e as HTMLIFrameElement).contentDocument!
    return doc.documentElement.scrollWidth <= doc.documentElement.clientWidth + 1
  })).toBe(true)
  expect(errors).toEqual([])
})

test('file-tree gallery preserves nested and flat variants in the reading column', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', e => { if (e.type() === 'error') errors.push(e.text()) })
  await page.goto('/en/design-system#file-structure')
  const trees = page.locator('.doc-file-tree')
  await expect(trees).toHaveCount(2)
  for (const [index, tree] of (await trees.all()).entries()) {
    await tree.scrollIntoViewIfNeeded()
    await expect(tree).toHaveAccessibleName(index === 0 ? 'Independent applications, shared vocabulary' : 'Stylesheet package')
    expect(await tree.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true)
    await expect(tree.locator('a,button,[tabindex],[role="tree"]')).toHaveCount(0)
    await expect(tree.locator('li')).toHaveCount(index === 0 ? 9 : 3)
    await tree.screenshot({ path: info.outputPath(`file-tree-${index}.png`), scale: 'css', caret: 'initial', style: captureStyle })
  }
  await expect(trees.nth(1).getByText('assets/', { exact: true })).toBeVisible()
  expect(errors).toEqual([])
})
