import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

const previous = JSON.parse(readFileSync(new URL('../final-page-heading-ids.json', import.meta.url), 'utf8')) as Record<string, string[]>
const captureStyle = 'nav.app-wrapper,nextjs-portal{visibility:hidden}'
function errorsFor(page: Page) {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', event => { if (event.type() === 'error') errors.push(event.text()) })
  return errors
}

async function capture(page: Page, path: string) {
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() => scrollTo(0, 0))
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path, fullPage: true, scale: 'css', caret: 'initial', style: captureStyle })
}

test('brand assets preserve original files, proportional previews and keyboard downloads', async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.goto('/en/brand')
  for (const id of previous['/brand']) await expect(page.locator(`[id="${id}"]`)).toHaveCount(1)
  const assets = page.locator('.demo-asset')
  await expect(assets).toHaveCount(3)
  for (const asset of await assets.all()) {
    const image = asset.getByRole('img')
    await expect(image).toHaveAttribute('alt', /Master CSS/)
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true)
    const ratio = await image.evaluate((element: HTMLImageElement) => {
      const rect = element.getBoundingClientRect()
      return Math.abs(rect.width / rect.height - element.naturalWidth / element.naturalHeight)
    })
    expect(ratio).toBeLessThan(.05)
    const link = asset.getByRole('link', { name: /^Download .+ \(SVG\)$/ })
    await expect(link).toHaveAttribute('download', '')
    await link.focus()
    await expect(link).toHaveCSS('outline-style', 'solid')
    await expect(link).toHaveCSS('outline-width', '2px')
    const downloaded = page.waitForEvent('download')
    await link.press('Enter')
    const download = await downloaded
    expect(await download.failure()).toBeNull()
    const filename = (await link.getAttribute('href'))!.split('/').at(-1)!
    expect(download.suggestedFilename()).toBe(filename)
    const expected = readFileSync(new URL(`../../public/images/${filename}`, import.meta.url))
    expect(readFileSync((await download.path())!)).toEqual(expected)
  }
  const policy = page.getByRole('link', { name: 'trademark policy', exact: true }).first()
  await expect(policy).not.toHaveAttribute('target', '_blank')
  await policy.focus()
  await policy.press('Enter')
  await expect(page).toHaveURL(/\/brand#trademark-policy$/)
  await expect(page.locator('#trademark-policy')).toBeInViewport()
  await capture(page, info.outputPath('brand.png'))
  expect(errors).toEqual([])
})

test('asset gallery exposes the same native specimen and links to its real usage', async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.goto('/en/design-system#assets')
  const asset = page.locator('.demo-asset').first()
  await expect(asset).toBeVisible()
  await expect(asset.getByRole('link', { name: 'Download Master CSS mark (SVG)' })).toHaveAttribute('href', '/images/logo.svg')
  await asset.screenshot({ path: info.outputPath('asset.png'), scale: 'css', caret: 'initial', style: captureStyle })
  const usage = page.getByRole('link', { name: 'Brand page', exact: true })
  await usage.focus()
  await usage.press('Enter')
  await expect(page).toHaveURL(/\/brand#download-assets$/)
  expect(errors).toEqual([])
})

for (const name of ['guide', 'reference']) test(`${name} index retains every destination across category, letter and direct-anchor navigation`, async ({ page, browser }, info) => {
  const errors = errorsFor(page)
  await page.goto(`/en/${name}`)
  const index = page.locator('.doc-index')
  const category = page.locator(`#${name}-category-index`)
  const alphabet = page.locator(`#${name}-alphabetical-index`)
  for (const id of previous[`/${name}`]) await expect(index.locator(`[id="${id}"]`)).toHaveCount(1)
  await expect(category).toBeVisible()
  await expect(alphabet).toBeHidden()
  const expected = name === 'reference'
    ? JSON.parse(readFileSync(new URL('../../.generated/reference.json', import.meta.url), 'utf8')).documents.map((doc: { url: string }) => doc.url.replace(/^\/(en|tw)(?=\/)/, ''))
    : JSON.parse(readFileSync(new URL('../../.categories/guide.json', import.meta.url), 'utf8')).flatMap((category: { pages: { pathname: string }[] }) => category.pages.map(page => page.pathname).filter(path => path.split('/').length === 3))
  const links = (container: ReturnType<Page['locator']>) => container.locator('.doc-index-links a').evaluateAll(elements => elements.map(element => element.getAttribute('href')!.replace(/^\/(en|tw)(?=\/)/, '')).sort())
  expect(await links(category)).toEqual([...expected].sort())
  for (const summary of await category.locator('.doc-index-entry-description').all()) {
    expect(await summary.evaluate(element => element.scrollHeight <= element.clientHeight + 1)).toBe(true)
    await expect(summary).toHaveCSS('-webkit-line-clamp', 'none')
  }
  await capture(page, info.outputPath(`${name}.png`))
  const byLetter = index.getByRole('button', { name: 'A–Z', exact: true })
  await byLetter.focus()
  await byLetter.press('Enter')
  await expect(byLetter).toHaveAttribute('aria-pressed', 'true')
  await expect(byLetter).toBeFocused()
  await expect(byLetter).toHaveCSS('outline-width', '2px')
  await expect(category).toBeHidden()
  expect(await links(alphabet)).toEqual([...expected].sort())
  const letter = alphabet.getByRole('navigation', { name: 'Jump to a letter' }).getByRole('link', { name: 'C', exact: true })
  await letter.focus()
  await letter.press('Enter')
  await expect(page).toHaveURL(/#index-c$/)
  await expect(page.locator('#index-c')).toBeInViewport()
  await page.reload()
  await expect(byLetter).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('#index-c')).toBeInViewport()
  const section = index.getByRole('navigation', { name: `${name === 'guide' ? 'Guide' : 'Reference'} sections` }).getByRole('link').first()
  await section.focus()
  await section.press('Enter')
  await expect(category).toBeVisible()
  if (name === 'reference') {
    const jump = category.getByRole('navigation', { name: 'Utilities categories' }).getByRole('link', { name: 'Typography', exact: true })
    await jump.focus()
    await jump.press('Enter')
    await expect(page).toHaveURL(/#utilities-typography$/)
    await expect(page.locator('#utilities-typography')).toBeInViewport()
    await page.reload()
    await expect(page.locator('#utilities-typography')).toBeInViewport()
  }
  await expect(page.getByText(/^Theme:/)).toHaveText(/^Theme: (System|Light|Dark)$/)
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: page.viewportSize()! })
  try {
    const noScript = await context.newPage()
    await noScript.goto(new URL(`/en/${name}`, page.url()).href)
    expect(await links(noScript.locator(`#${name}-category-index`))).toEqual([...expected].sort())
  } finally { await context.close() }
  expect(errors).toEqual([])
})

test('localized indexes preserve canonical category fragments and complete destinations', async ({ page }) => {
  const errors = errorsFor(page)
  for (const name of ['guide', 'reference']) {
    const id = name === 'guide' ? 'getting-started' : 'utilities-typography'
    await page.goto(`/tw/${name}#${id}`)
    await expect(page.locator(`#${id}`)).toBeInViewport()
    const category = page.locator(`#${name}-category-index`)
    await expect(category).toBeVisible()
    for (const href of await category.locator('.doc-index-links a').evaluateAll(elements => elements.map(element => element.getAttribute('href')))) {
      expect(href).toMatch(/^\/tw\//)
    }
    await page.locator('.doc-index').getByRole('button', { name: 'A–Z', exact: true }).click()
    await expect(page.locator(`#${name}-alphabetical-index`)).toBeVisible()
  }
  expect(errors).toEqual([])
})

test('index gallery demonstrates complete summaries, category shortcuts and alphabetical lookup', async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.goto('/en/design-system#document-index')
  const gallery = page.locator('[data-index-gallery]')
  await expect(gallery).toBeVisible()
  await expect(gallery.locator('#guide-category-index .doc-index-links a')).toHaveCount(8)
  await gallery.screenshot({ path: info.outputPath('index.png'), scale: 'css', caret: 'initial', style: captureStyle })
  await gallery.getByRole('button', { name: 'A–Z', exact: true }).click()
  await expect(gallery.locator('#guide-alphabetical-index .doc-index-links a')).toHaveCount(8)
  const link = gallery.getByRole('navigation', { name: 'Guide sections' }).getByRole('link').nth(1)
  await link.focus()
  await link.press('Enter')
  const group = gallery.getByRole('navigation', { name: 'Utilities categories' }).getByRole('link', { name: 'Document flow', exact: true })
  await group.focus()
  await group.press('Enter')
  await expect(page.locator('#gallery-flow')).toBeInViewport()
  const clear = gallery.locator('#guide-category-index').getByRole('link', { name: 'clear', exact: true })
  await clear.focus()
  await clear.press('Enter')
  await expect(page).toHaveURL(/\/reference\/clear$/)
  expect(errors).toEqual([])
})
