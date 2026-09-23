import { expect, test, type FrameLocator, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { documentHeadings } from '../../reference/headings'
import { deliverySource } from '../delivery-examples'

const slugs = ['compatibility', 'view-transitions']
const previous = JSON.parse(readFileSync(new URL('../guide-platform-heading-ids.json', import.meta.url), 'utf8')) as Record<string, { id: string }[]>
const captureStyle = 'nav.app-wrapper,nextjs-portal{visibility:hidden}'

function errorsFor(page: Page) {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', e => { if (e.type() === 'error') errors.push(e.text()) })
  return errors
}
async function ready(page: Page, selector: string) {
  const iframe = page.locator(`${selector} iframe`)
  await iframe.scrollIntoViewIfNeeded()
  await expect(iframe).toHaveAttribute('data-ready', 'true')
  return page.frameLocator(`${selector} iframe`)
}
async function uniqueNames(frame: FrameLocator) {
  const names = await frame.locator('body').evaluate(e => [...e.querySelectorAll('*')].map(item => getComputedStyle(item).viewTransitionName).filter(name => name && name !== 'none'))
  expect(new Set(names).size).toBe(names.length)
}

async function observeTransitions(frame: FrameLocator) {
  return frame.locator('body').evaluate(() => {
    const native = document.startViewTransition?.bind(document)
    if (!native) return false
    document.startViewTransition = update => {
      const transition = native(update)
      document.body.dataset.transitionReady = 'pending'
      document.body.dataset.transitionFinished = 'pending'
      void transition.ready.then(() => { document.body.dataset.transitionReady = 'true' }, () => { document.body.dataset.transitionReady = 'skipped' })
      void transition.finished.then(() => { document.body.dataset.transitionFinished = 'true' }, () => { document.body.dataset.transitionFinished = 'failed' })
      return transition
    }
    return true
  })
}
async function finished(frame: FrameLocator, native: boolean) {
  if (native) {
    await expect(frame.locator('body')).toHaveAttribute('data-transition-ready', 'true')
    await expect(frame.locator('body')).toHaveAttribute('data-transition-finished', 'true')
  }
}

for (const slug of slugs) test(`complete platform guide ${slug}`, async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.goto(`/en/guide/${slug}`)
  for (const heading of [...documentHeadings(deliverySource(slug)), ...previous[slug]]) await expect(page.locator(`[id="${heading.id}"]`)).toHaveCount(1)
  for (const iframe of await page.locator('.site-demo iframe').all()) {
    await iframe.scrollIntoViewIfNeeded()
    await expect(iframe).toHaveAttribute('data-ready', 'true')
    expect(await iframe.evaluate(e => {
      const doc = (e as HTMLIFrameElement).contentDocument!
      return doc.documentElement.scrollWidth <= doc.documentElement.clientWidth + 1
    })).toBe(true)
  }
  for (const block of await page.locator('main pre, main iframe').all()) {
    if (await block.isVisible()) await block.scrollIntoViewIfNeeded()
  }
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: info.outputPath(`${slug}.png`), fullPage: true, scale: 'css', caret: 'initial', style: captureStyle })
  expect(errors).toEqual([])
})

test('native field and relational selector keep native keyboard behavior', async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.goto('/en/guide/compatibility')
  const field = await ready(page, '[data-project-style="nativeField"]')
  const textarea = field.getByRole('textbox', { name: 'Project note' })
  await expect(textarea).toHaveAccessibleDescription('Add a few lines to try content-based sizing.')
  await textarea.fill('One line')
  const before = (await textarea.boundingBox())!.height
  await textarea.fill(Array.from({ length: 15 }, (_, i) => `Line ${i + 1} of the project note.`).join('\n'))
  const supported = await textarea.evaluate(() => CSS.supports('field-sizing', 'content'))
  const after = (await textarea.boundingBox())!.height
  if (supported) expect(after).toBeGreaterThan(before)
  expect(after).toBeLessThanOrEqual(192)
  await expect(page.locator('.demo-feature-support').first()).toHaveAttribute('data-supported', String(supported))
  await page.locator('[data-project-style="nativeField"]').screenshot({ path: info.outputPath('field.png'), scale: 'css', caret: 'initial', style: captureStyle })
  const selection = await ready(page, '[data-project-style="checkedSelector"]')
  const checkbox = selection.getByRole('checkbox', { name: /Include project notes/ })
  const card = selection.locator('body > div')
  const color = await card.evaluate(e => getComputedStyle(e).borderColor)
  await checkbox.focus(); await page.keyboard.press('Space')
  await expect(checkbox).toBeChecked()
  await expect(checkbox).toHaveCSS('outline-width', '2px')
  await expect.poll(() => card.evaluate(e => getComputedStyle(e).borderColor)).not.toBe(color)
  await page.locator('[data-project-style="checkedSelector"]').screenshot({ path: info.outputPath('selector.png'), scale: 'css', caret: 'initial', style: captureStyle })
  expect(errors).toEqual([])
})

test('view changes use native snapshots and restore article focus', async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/en/guide/view-transitions')
  const views = await ready(page, '[data-view-transition="views"]')
  const viewsNative = await observeTransitions(views)
  await views.getByRole('button', { name: 'Product detail', exact: true }).click()
  await finished(views, viewsNative)
  await expect(views.getByRole('heading', { name: 'Product detail' })).toBeVisible()
  await expect(views.getByRole('button', { name: 'Product detail', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await uniqueNames(views)
  expect(await page.locator('html').getAttribute('class')).not.toContain('view-transition-group')
  await page.locator('[data-view-transition="views"]').screenshot({ path: info.outputPath('views.png'), scale: 'css', caret: 'initial', style: captureStyle })
  const articles = await ready(page, '[data-view-transition="articles"]')
  await uniqueNames(articles)
  const cards = articles.locator('main > div').last().locator(':scope > .demo-surface')
  const [first, second] = await Promise.all([cards.nth(0).boundingBox(), cards.nth(1).boundingBox()])
  const contentWidth = await articles.locator('main').evaluate(e => e.clientWidth - parseFloat(getComputedStyle(e).paddingLeft) - parseFloat(getComputedStyle(e).paddingRight))
  if (contentWidth < 448) expect(second!.y).toBeGreaterThan(first!.y + first!.height)
  else expect(second!.x).toBeGreaterThan(first!.x)
  const articlesNative = await observeTransitions(articles)
  const open = articles.getByRole('button', { name: 'Read Designing transitions that preserve context', exact: true })
  await open.focus(); await page.keyboard.press('Enter')
  await finished(articles, articlesNative)
  await expect(articles.getByRole('heading', { name: 'Designing transitions that preserve context', level: 1 })).toBeFocused()
  await uniqueNames(articles)
  await page.locator('[data-view-transition="articles"]').screenshot({ path: info.outputPath('article-detail.png'), scale: 'css', caret: 'initial', style: captureStyle })
  await articles.getByRole('button', { name: 'Back to collection' }).focus()
  await page.keyboard.press('Enter')
  await finished(articles, articlesNative)
  await expect(open).toBeFocused()
  await expect(open).toHaveCSS('outline-width', '2px')
  await expect(open).toHaveCSS('outline-style', 'solid')
  await uniqueNames(articles)
  await page.locator('[data-view-transition="articles"]').screenshot({ path: info.outputPath('article-list.png'), scale: 'css', caret: 'initial', style: captureStyle })
  expect(errors).toEqual([])
})

test('rapid view selection keeps the latest update without snapshot errors', async ({ page }) => {
  const errors = errorsFor(page)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/en/guide/view-transitions')
  const views = await ready(page, '[data-view-transition="views"]')
  const native = await observeTransitions(views)
  await views.locator('main').evaluate(element => {
    const buttons = element.querySelectorAll('button')
    buttons[1].click()
    buttons[2].click()
  })
  await finished(views, native)
  await expect(views.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await expect(views.getByRole('button', { name: 'Settings', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await uniqueNames(views)
  expect(errors).toEqual([])
})

test('reduced motion and missing API keep both update paths functional', async ({ page }) => {
  const errors = errorsFor(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/en/guide/view-transitions')
  const views = await ready(page, '[data-view-transition="views"]')
  await expect(views.getByRole('status')).toContainText('Reduced motion')
  // A throwing API proves the reduced-motion branch does not start an animation.
  await views.locator('body').evaluate(() => { document.startViewTransition = () => { throw new Error('Unexpected animation') } })
  await views.getByRole('button', { name: 'Settings', exact: true }).click()
  await expect(views.getByRole('heading', { name: 'Settings' })).toBeVisible()
  const articles = await ready(page, '[data-view-transition="articles"]')
  await articles.locator('body').evaluate(() => { Object.defineProperty(document, 'startViewTransition', { value: undefined, configurable: true }) })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await articles.getByRole('button', { name: 'Read Building quieter detail pages', exact: true }).click()
  await expect(articles.getByRole('heading', { name: 'Building quieter detail pages', level: 1 })).toBeFocused()
  await expect(articles.getByRole('status')).toContainText('API unavailable')
  await articles.getByRole('button', { name: 'Back to collection' }).click()
  await expect(articles.getByRole('button', { name: 'Read Building quieter detail pages', exact: true })).toBeFocused()
  expect(errors).toEqual([])
})

test('platform gallery keeps support status and isolated previews usable', async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.goto('/en/design-system#platform-behavior')
  for (const example of ['views', 'articles']) {
    await ready(page, `[data-view-transition="${example}"]`)
    await page.locator(`[data-view-transition="${example}"]`).screenshot({ path: info.outputPath(`gallery-${example}.png`), scale: 'css', caret: 'initial', style: captureStyle })
  }
  const support = page.locator('.demo-feature-support')
  await expect(support).toHaveCount(2)
  for (const [index, status] of (await support.all()).entries()) {
    await expect(status).toHaveAttribute('data-supported', /true|false/)
    expect(await status.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true)
    await status.screenshot({ path: info.outputPath(`support-${index}.png`), scale: 'css', caret: 'initial', style: captureStyle })
  }
  expect(errors).toEqual([])
})
