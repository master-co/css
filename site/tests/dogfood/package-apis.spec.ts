import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { markdownTree } from 'internal/utils/markdown-tree'

const catalog = JSON.parse(readFileSync(new URL('../../.generated/reference.json', import.meta.url), 'utf8'))
const docs = catalog.documents.filter((doc: any) => doc.kind === 'package') as { id: string, title: string, markdown: string, headings: { id: string, title: string }[] }[]
const previous = JSON.parse(readFileSync(new URL('../package-heading-ids.json', import.meta.url), 'utf8')) as Record<string, { id: string }[]>
const captureStyle = 'nav.app-wrapper,nextjs-portal{visibility:hidden}'
function errorsFor(page: Page) {
  const errors: string[] = []
  page.on('pageerror', event => errors.push(event.message))
  page.on('console', event => { if (event.type() === 'error') errors.push(event.text()) })
  return errors
}

for (const doc of docs) test(`complete package reference ${doc.id}`, async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.goto(`/en/reference/${doc.id}`)
  await expect(page.locator('h1')).toHaveText(doc.title)
  const ids = await page.locator('[id]').evaluateAll(elements => elements.map(element => element.id))
  for (const heading of [...doc.headings, ...previous[doc.id]]) expect(ids.filter(id => id === heading.id)).toHaveLength(1)
  const renderedHeadings = await page.locator('main h2, main h3').evaluateAll(elements => Object.fromEntries(elements.map(element => [element.id, element.textContent])))
  for (const heading of doc.headings) expect(renderedHeadings[heading.id]).toBe(heading.title)
  const fences = markdownTree(doc.markdown).children.filter((node: any) => node.type === 'code') as any[]
  const displayed = await page.locator('main pre').evaluateAll(elements => elements.map(element => [...element.querySelectorAll('code .line')].map(line => line.textContent).join('\n').trim()))
  for (const fence of fences) expect(displayed).toContain(fence.value)
  const declarations = fences.filter(fence => fence.meta === 'declaration')
  await expect(page.locator('.doc-declaration')).toHaveCount(declarations.length)
  const paths = page.getByRole('navigation', { name: 'Public entrypoints', exact: true })
  await expect(paths.getByRole('link')).toHaveCount(doc.headings.filter(heading => heading.id.startsWith('entry-')).length)
  const link = paths.getByRole('link').first()
  const href = await link.getAttribute('href')
  await link.focus(); await page.keyboard.press('Enter')
  await expect(page).toHaveURL(new RegExp(`${href}$`))
  const details = page.locator('main details.doc-disclosure')
  for (const detail of await details.all()) await expect(detail).not.toHaveAttribute('open')
  if (await details.count()) {
    const detail = details.first()
    await detail.locator('summary').focus(); await page.keyboard.press('Enter')
    await expect(detail).toHaveAttribute('open', '')
    await page.keyboard.press('Space')
    await expect(detail).not.toHaveAttribute('open')
  }
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: info.outputPath(`${doc.id.replaceAll('/', '-')}.png`), fullPage: true, scale: 'css', caret: 'initial', style: captureStyle })
  expect(errors).toEqual([])
})

test('package gallery preserves declarations, native disclosure and keyboard copying', async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { document.body.dataset.copiedText = text } } })
  })
  await page.goto('/en/design-system#package-apis')
  const gallery = page.locator('[data-package-gallery]')
  await expect(gallery).toBeVisible()
  await expect(gallery.locator('.doc-declaration')).toHaveCount(3)
  await page.evaluate(() => document.fonts.ready)
  await expect(gallery.getByRole('button', { name: 'Copy Short declaration declaration', exact: true })).toBeEnabled()
  for (const [index, specimen] of (await gallery.locator(':scope > nav, :scope > details, :scope > figure').all()).entries()) {
    await specimen.scrollIntoViewIfNeeded()
    await expect(specimen).toBeInViewport()
    if (await specimen.evaluate(element => element.tagName === 'NAV')) {
      for (const link of await specimen.getByRole('link').all()) await expect(link).toBeVisible()
    }
    await specimen.screenshot({ path: info.outputPath(`gallery-${index}.png`), scale: 'css', caret: 'initial', style: captureStyle })
  }
  const long = gallery.locator('details').last()
  await expect(long).not.toHaveAttribute('open')
  const text = (await long.locator('code .line').allTextContents()).join('\n')
  expect(text.split('\n').length).toBeGreaterThan(40)
  await long.locator('summary').focus(); await page.keyboard.press('Enter')
  await expect(long.locator('pre')).toBeVisible()
  await long.screenshot({ path: info.outputPath('gallery-expanded.png'), scale: 'css', caret: 'initial', style: captureStyle })
  const button = long.getByRole('button', { name: /Copy .* declaration/ })
  await expect(button).toBeEnabled()
  await button.focus(); await page.keyboard.press('Enter')
  await expect(button).toBeFocused()
  await expect(button).toHaveCSS('outline-width', '2px')
  await expect(long.getByRole('status')).toContainText('declaration copied')
  await expect(page.locator('body')).toHaveAttribute('data-copied-text', text)
  await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('Permission denied')) } }) })
  await page.keyboard.press('Enter')
  await expect(long.getByRole('status')).toContainText('Clipboard unavailable')
  await long.screenshot({ path: info.outputPath('gallery-copy-unavailable.png'), scale: 'css', caret: 'initial', style: captureStyle })
  expect(await gallery.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
  expect(errors).toEqual([])
})

test('copy controls wait for client initialization and retain server-rendered text', async ({ page }) => {
  const errors = errorsFor(page)
  let release!: () => void
  const scripts = new Promise<void>(resolve => { release = resolve })
  await page.route('**/_next/static/**/*.js', async route => { await scripts; await route.continue() })
  try {
    await page.goto('/en/reference/packages/css-language-server', { waitUntil: 'commit' })
    const disclosure = page.locator('details').filter({ hasText: 'Complete declaration' }).first()
    // The site's development runtime also hides the root while its scripts load.
    // Check the actual SSR control state without changing that host behavior.
    const button = disclosure.locator('button[aria-label^="Copy "]')
    await expect(button).toBeAttached()
    await expect(button).toBeDisabled()
    await expect(disclosure.locator('pre')).toContainText('MasterCSSLanguageServer')
    release()
    await expect(disclosure.locator('summary')).toBeVisible()
    await disclosure.locator('summary').focus(); await page.keyboard.press('Enter')
    await expect(disclosure.locator('pre')).toBeVisible()
    await expect(button).toBeEnabled()
    await expect(disclosure).toHaveAttribute('open', '')
    expect(errors).toEqual([])
  } finally { release() }
})
