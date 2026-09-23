import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { mcpEditorial } from '../../reference/mcp-editorial'
import { cliEditorial } from '../../reference/cli-editorial'
import { markdownTree } from 'internal/utils/markdown-tree'

const catalog = JSON.parse(readFileSync(new URL('../../.generated/reference.json', import.meta.url), 'utf8'))
const docs = catalog.documents.filter((doc: any) => doc.kind === 'tool') as { id: string, title: string, markdown: string, headings: { id: string }[] }[]
const previous = JSON.parse(readFileSync(new URL('../tool-contract-heading-ids.json', import.meta.url), 'utf8')) as Record<string, { id: string }[]>
const captureStyle = 'nav.app-wrapper,nextjs-portal{visibility:hidden}'
function errorsFor(page: Page) {
  const errors: string[] = []
  page.on('pageerror', event => errors.push(event.message))
  page.on('console', event => { if (event.type() === 'error') errors.push(event.text()) })
  return errors
}
for (const doc of docs) test(`complete tool reference ${doc.id}`, async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.goto(`/en/reference/${doc.id}`)
  await expect(page.locator('h1')).toHaveText(doc.title)
  for (const heading of [...doc.headings, ...previous[doc.id]]) await expect(page.locator(`[id="${heading.id}"]`)).toHaveCount(1)
  const parameterNames = await page.locator('.doc-parameters dt code').allTextContents()
  if (doc.id.startsWith('tools/mcp/')) {
    const name = doc.id.split('/').at(-1)!
    expect(parameterNames.sort()).toEqual(Object.keys(mcpEditorial[name].fields).sort())
  } else {
    expect(parameterNames.length).toBeGreaterThan(6)
    for (const [index, example] of cliEditorial[doc.id.split('/').at(-1)!].examples.entries()) {
      let found = false
      for (const pre of await page.locator('main pre').all()) {
        if ((await pre.locator('code .line').allTextContents()).join('\n') !== example.command) continue
        found = true
        await pre.scrollIntoViewIfNeeded()
        expect(await pre.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
        await pre.screenshot({ path: info.outputPath(`${doc.id.replaceAll('/', '-')}-command-${index}.png`), scale: 'css', caret: 'initial', style: captureStyle })
      }
      expect(found).toBe(true)
    }
  }
  for (const row of await page.locator('.doc-parameters .doc-option').all()) {
    await row.scrollIntoViewIfNeeded()
    expect(await row.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    expect((await row.locator('dd p').boundingBox())!.width).toBeGreaterThan(250)
  }
  const disclosure = page.locator('.doc-disclosure').first()
  const summary = disclosure.locator('summary')
  await summary.focus(); await page.keyboard.press('Enter')
  await expect(disclosure).toHaveAttribute('open', '')
  await expect(summary).toBeFocused()
  await expect(summary).toHaveCSS('outline-width', '2px')
  const raw = markdownTree(doc.markdown).children.find((node: any) => node.type === 'code' && node.meta?.startsWith('disclosure=')) as any
  expect((await disclosure.locator('pre code .line').allTextContents()).join('\n')).toBe(raw.value)
  await page.keyboard.press('Enter')
  await expect(disclosure).not.toHaveAttribute('open', '')
  for (const pre of await page.locator('main pre').all()) if (await pre.isVisible()) await pre.scrollIntoViewIfNeeded()
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: info.outputPath(`${doc.id.replaceAll('/', '-')}.png`), fullPage: true, scale: 'css', caret: 'initial', style: captureStyle })
  expect(errors).toEqual([])
})

test('tool contract gallery keeps readable parameters and keyboard disclosures', async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.goto('/en/design-system#tool-contracts')
  const gallery = page.locator('[data-tool-contract-gallery]')
  await expect(gallery).toBeVisible()
  for (const [index, part] of (await gallery.locator('.doc-parameters, .doc-disclosure').all()).entries()) {
    await part.scrollIntoViewIfNeeded()
    await part.screenshot({ path: info.outputPath(`gallery-${index}.png`), scale: 'css', caret: 'initial', style: captureStyle })
  }
  const disclosure = gallery.locator('.doc-disclosure').first()
  const summary = disclosure.locator('summary')
  await summary.focus(); await page.keyboard.press('Space')
  await expect(disclosure).toHaveAttribute('open', '')
  await expect(summary).toHaveCSS('outline-width', '2px')
  await expect(disclosure.locator('pre')).toContainText('className')
  await page.screenshot({ path: info.outputPath('gallery-schema-expanded.png'), scale: 'css', caret: 'initial', style: captureStyle })
  expect(await gallery.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
  expect(errors).toEqual([])
})

test.describe('server document without JavaScript', () => {
  test.use({ javaScriptEnabled: false })
  test('server disclosure remains keyboard accessible', async ({ page }) => {
    await page.goto('/en/reference/tools/mcp/mastercss_preview_directive_format')
    const disclosure = page.locator('.doc-disclosure').first()
    // Isolate the actual server markup from Next dev's JavaScript-dependent streaming shell.
    await page.setContent(await disclosure.evaluate(element => element.outerHTML))
    await disclosure.locator('summary').focus(); await page.keyboard.press('Enter')
    await expect(disclosure).toHaveAttribute('open', '')
    await expect(disclosure.locator('pre code')).toContainText('maximum')
  })
})
