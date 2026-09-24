import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { markdownTree } from '~/site/docs-shell/utils/markdown-tree'

const catalog = JSON.parse(readFileSync(new URL('../../.generated/reference.json', import.meta.url), 'utf8'))
const docs = catalog.documents.filter((doc: any) => doc.kind === 'directive') as { id: string, title: string, markdown: string, headings: { id: string }[] }[]
const previous = JSON.parse(readFileSync(new URL('../directive-heading-ids.json', import.meta.url), 'utf8')) as Record<string, { id: string }[]>
const captureStyle = 'nav.app-wrapper,nextjs-portal{visibility:hidden}'
function errorsFor(page: Page) {
  const errors: string[] = []
  page.on('pageerror', event => errors.push(event.message))
  page.on('console', event => { if (event.type() === 'error') errors.push(event.text()) })
  return errors
}
for (const doc of docs) test(`complete directive reference ${doc.id}`, async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.goto(`/en/reference/${doc.id}`)
  await expect(page.locator('h1')).toHaveText(doc.title)
  for (const heading of [...doc.headings, ...previous[doc.id]]) await expect(page.locator(`[id="${heading.id}"]`)).toHaveCount(1)
  await expect(page.locator(`h2[id="${doc.headings[0].id}"]`)).toHaveCount(0)
  const fences = markdownTree(doc.markdown).children.filter((node: any) => node.type === 'code') as any[]
  const displayed = await Promise.all((await page.locator('main pre').all()).map(async pre => (await pre.locator('code .line').allTextContents()).join('\n').trim()))
  for (const fence of fences) {
    if (fence.lang === 'css') expect(displayed.map(text => text.replace(/\s+/g, ''))).toContain(fence.value.replace(/\s+/g, ''))
    else expect(displayed).toContain(fence.value)
  }
  if (doc.id === 'directives/settings') {
    await expect(page.getByRole('definition')).toHaveCount(6)
    for (const row of await page.locator('.doc-option').all()) {
      expect((await row.locator('dd p').boundingBox())!.width).toBeGreaterThan(250)
      expect(await row.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    }
  }
  for (const pre of await page.locator('main pre').all()) await pre.scrollIntoViewIfNeeded()
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: info.outputPath(`${doc.id.replaceAll('/', '-')}.png`), fullPage: true, scale: 'css', caret: 'initial', style: captureStyle })
  expect(errors).toEqual([])
})

test('stylesheet gallery preserves source, generated resources and rich option descriptions', async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { document.body.dataset.copiedText = text } } })
  })
  await page.goto('/en/design-system#stylesheet-examples')
  const gallery = page.locator('[data-stylesheet-gallery]')
  await expect(gallery).toBeVisible()
  await expect(gallery.locator('pre')).toHaveCount(6)
  await expect(gallery.getByRole('link', { name: 'Project settings' })).toHaveAttribute('href', /\/(?:en\/)?reference\/directives\/settings$/)
  for (const [index, specimen] of (await gallery.locator('.doc-code-example, .doc-options').all()).entries()) {
    await specimen.scrollIntoViewIfNeeded()
    await specimen.screenshot({ path: info.outputPath(`gallery-${index}.png`), scale: 'css', caret: 'initial', style: captureStyle })
  }
  await expect(gallery.locator('pre').nth(1)).toContainText('--color-brand: #4f46e5')
  await expect(gallery.locator('pre').nth(3)).not.toContainText('--color-brand')
  await expect(gallery.locator('pre').nth(5)).toContainText('@keyframes fade-in')
  const example = gallery.getByRole('figure', { name: 'A token used by a native rule', exact: true })
  const button = example.getByRole('button', { name: 'Copy A token used by a native rule — Source', exact: true })
  await expect(button).toBeEnabled()
  await button.focus(); await page.keyboard.press('Enter')
  await expect(button).toBeFocused()
  await expect(button).toHaveCSS('outline-width', '2px')
  await expect(example.getByRole('status').first()).toHaveText('A token used by a native rule — Source copied')
  await expect(page.locator('body')).toHaveAttribute('data-copied-text', (await example.locator('pre').first().locator('code .line').allTextContents()).join('\n'))
  await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('Permission denied')) } }) })
  await page.keyboard.press('Enter')
  await expect(example.getByRole('status').first()).toContainText('Clipboard unavailable')
  await example.screenshot({ path: info.outputPath('gallery-copy-unavailable.png'), scale: 'css', caret: 'initial', style: captureStyle })
  expect(await gallery.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
  expect(errors).toEqual([])
})
