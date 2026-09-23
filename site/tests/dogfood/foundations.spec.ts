import { expect, test, type Locator } from '@playwright/test'
import { ready, viewport } from './interactions-helpers'

const routes = ['breakpoints', 'containers', 'responsive-design', 'sizing', 'corner-radius', 'layout-system']
const bounds = (element: Locator) => element.evaluate(e => {
  const b = e.getBoundingClientRect()
  return { x: b.x, y: b.y, width: b.width, height: b.height }
})

async function container(demo: Locator, width: number) {
  await demo.getByLabel('Container', { exact: true }).fill(String(width))
  await expect(demo.locator('output')).toHaveText(`${width} px · viewport unchanged`)
}

test('viewport thresholds use an actual iframe and survive authored root font changes', async ({ page }) => {
  await page.goto('/en/guide/breakpoints')
  const demo = page.locator('[data-foundation="breakpoint"]'), frame = await ready(demo)
  await viewport(demo, 1023); await expect(frame.locator('h1')).toHaveCSS('font-size', '24px')
  await viewport(demo, 1024); await expect(frame.locator('h1')).toHaveCSS('font-size', '32px')
  // This is a semantic probe of authored font size, not a substitute for triggering media conditions.
  await frame.locator('html').evaluate(e => e.style.fontSize = '20px')
  await expect(frame.locator('h1')).toHaveCSS('font-size', '40px')
  await viewport(demo, 1023); await expect(frame.locator('h1')).toHaveCSS('font-size', '30px')
  await frame.locator('html').evaluate(e => e.style.removeProperty('font-size'))
  await demo.getByLabel('Viewport', { exact: true }).focus(); await page.keyboard.press('ArrowRight')
  await expect(demo.locator('iframe')).toHaveJSProperty('clientWidth', 1024)
})

test('container grids change descendants without changing the document viewport', async ({ page }) => {
  await page.goto('/en/guide/containers')
  const demo = page.locator('[data-foundation="container-grid"]'), article = demo.locator('article')
  const original = await page.evaluate(() => window.innerWidth)
  await container(demo, 447)
  const narrow = await bounds(article.locator('svg')), narrowText = await bounds(article.locator('div').first())
  expect(narrowText.y).toBeGreaterThan(narrow.y + narrow.height)
  await container(demo, 448)
  const wide = await bounds(article.locator('svg')), wideText = await bounds(article.locator('div').first())
  expect(wideText.x).toBeGreaterThan(wide.x + wide.width)
  expect(await page.evaluate(() => window.innerWidth)).toBe(original)
  await demo.getByLabel('Container', { exact: true }).focus(); await page.keyboard.press('ArrowLeft')
  await expect(demo.locator('output')).toHaveText('447 px · viewport unchanged')
  await demo.getByRole('button', { name: 'Fit', exact: true }).click()
  const shell = await bounds(demo.locator('.demo-container-shell'))
  expect((await bounds(article)).width).toBeLessThanOrEqual(shell.width)
})

test('media object owns an ancestor query boundary in both guides', async ({ page }) => {
  for (const route of ['responsive-design', 'layout-system']) {
    await page.goto(`/en/guide/${route}`)
    const demo = page.locator('[data-foundation="media"]'), article = demo.locator('article')
    await container(demo, 447); await expect(article).toHaveCSS('flex-direction', 'column')
    await container(demo, 448); await expect(article).toHaveCSS('flex-direction', 'row')
    await expect(article).toHaveCSS('container-type', 'normal')
    await expect(article.locator('..')).toHaveCSS('container-type', 'inline-size')
    expect((await bounds(article.locator('svg'))).width).toBe(144)
    expect(await article.evaluate(e => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1)
  }
})

test('sizing examples keep measured axes and let content shrink at the actual cap', async ({ page }) => {
  await page.goto('/en/guide/sizing')
  const square = await bounds(page.locator('[data-foundation="axes"] .demo-item').first())
  expect(square.width).toBe(56); expect(square.height).toBe(56)
  const demo = page.locator('[data-foundation="shrink"]')
  await container(demo, 240); expect((await bounds(demo.locator('article'))).width).toBe(240)
  expect(await demo.locator('p').evaluate(e => e.scrollWidth > e.clientWidth)).toBe(true)
  await container(demo, 600); expect((await bounds(demo.locator('article'))).width).toBe(384)
  expect(await demo.locator('article').evaluate(e => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1)
})

test('radius specimens preserve token values and usable shape links', async ({ page }) => {
  await page.goto('/en/guide/corner-radius')
  const items = page.locator('[data-foundation="radius"] .demo-item')
  for (const [index, radius] of ['4px', '8px', '16px'].entries()) await expect(items.nth(index)).toHaveCSS('border-radius', radius)
  const links = page.locator('[data-foundation="shapes"] a')
  const circle = await bounds(links.nth(1)); expect(circle.width).toBe(48); expect(circle.height).toBe(48)
  await expect(links.nth(1)).toHaveAccessibleName('Shape shortcuts')
  await links.nth(1).focus(); await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#use-shape-shortcuts$/)
  await expect(page.locator('#use-shape-shortcuts')).toBeVisible()
})

test('page previews have real responsive tracks, working links and native inputs', async ({ page }) => {
  await page.goto('/en/guide/layout-system')
  const demo = page.locator('.site-demo').filter({ has: page.locator('iframe[src="/examples/layout-system"]') }), frame = await ready(demo)
  await viewport(demo, 390)
  const tracks = () => frame.locator('[data-workspace]').evaluate(e => getComputedStyle(e).gridTemplateColumns.split(' ').length)
  expect(await tracks()).toBe(4)
  await viewport(demo, 600); expect(await tracks()).toBe(8)
  await frame.getByRole('link', { name: 'Tasks', exact: true }).click()
  await expect(frame.locator('#launch-tasks')).toBeInViewport()
  const input = frame.getByRole('checkbox', { name: 'Audit onboarding Today' })
  await input.focus(); await page.keyboard.press('Space'); await expect(input).toBeChecked()
  await demo.getByRole('button', { name: 'Theme', exact: true }).click()
  const dark = await frame.locator('html').evaluate(e => e.classList.contains('dark'))
  await expect(demo.getByRole('button', { name: 'Theme', exact: true })).toHaveAttribute('aria-pressed', String(dark))
  await page.goto('/en/guide/responsive-design')
  const galleryDemo = page.locator('.site-demo').filter({ has: page.locator('iframe[src="/examples/responsive-gallery"]') }), gallery = await ready(galleryDemo)
  for (const [width, count] of [[390, 2], [600, 3], [834, 4], [1024, 5]]) {
    await viewport(galleryDemo, width)
    await expect.poll(() => gallery.locator('[data-gallery]').evaluate(e => getComputedStyle(e).gridTemplateColumns.split(' ').length)).toBe(count)
  }
  await expect(gallery.locator('img')).toHaveCount(12)
  for (const image of await gallery.locator('img').all()) {
    await expect(image).toHaveAttribute('alt', /\w+/)
    await expect.poll(() => image.evaluate((e: HTMLImageElement) => e.naturalWidth)).toBeGreaterThan(0)
  }
})

for (const route of routes) {
  test(`foundation composition: ${route}`, async ({ page }, info) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    page.on('console', m => { if (m.type() === 'error' && /hydration|hydrate|mismatch/i.test(m.text())) errors.push(m.text()) })
    await page.setViewportSize({ ...page.viewportSize()!, height: 1600 })
    await page.goto(`/en/guide/${route}`)
    await page.addStyleTag({ content: 'nextjs-portal{visibility:hidden}' })
    await page.evaluate(() => document.fonts.ready)
    const dark = await page.locator('html').evaluate(e => e.classList.contains('dark'))
    for (const [index, demo] of (await page.locator('.site-demo').all()).entries()) {
      await demo.scrollIntoViewIfNeeded()
      if (await demo.locator('iframe').count()) {
        const frame = await ready(demo)
        await frame.locator('body').evaluate(e => { const style = e.ownerDocument.createElement('style'); style.textContent = 'nextjs-portal{visibility:hidden}'; e.append(style) })
        await expect(frame.locator('html')).toHaveClass(dark ? /dark/ : /light/)
        expect(await frame.locator('body').evaluate(e => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1)
      }
      for (const control of await demo.locator('button,input,a').filter({ visible: true }).all()) await expect(control).toHaveAccessibleName(/.+/)
      await demo.evaluate(e => window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 96))
      await demo.screenshot({ path: info.outputPath(`demo-${index}.png`), scale: 'css', caret: 'initial' })
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
    expect(errors).toEqual([])
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: info.outputPath('page.png'), fullPage: true, scale: 'css', caret: 'initial' })
  })
}


test('foundation gallery keeps all ten practical recipes reachable', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await page.setViewportSize({ ...page.viewportSize()!, height: 1600 })
  await page.goto('/en/design-system')
  await page.addStyleTag({ content: 'nextjs-portal{visibility:hidden}' })
  await expect(page.locator('[data-foundation-recipe]')).toHaveCount(8)
  await expect(page.locator('.demo-recipe')).toHaveCount(87)
  const demos = page.locator('[data-foundation],.site-demo:has(iframe[src])')
  await expect(demos).toHaveCount(10)
  for (const [index, demo] of (await demos.all()).entries()) {
    await demo.scrollIntoViewIfNeeded()
    if (await demo.locator('iframe').count()) {
      const frame = await ready(demo)
      await frame.locator('body').evaluate(e => { const style = e.ownerDocument.createElement('style'); style.textContent = 'nextjs-portal{visibility:hidden}'; e.append(style) })
    }
    if (await demo.locator('[data-demo-container]').count()) await expect(demo.locator('[data-demo-container]')).toHaveAttribute('data-ready', 'true')
    await demo.evaluate(e => window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 96))
    await demo.screenshot({ path: info.outputPath(`foundation-${index}.png`), scale: 'css', caret: 'initial' })
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  expect(errors).toEqual([])
})
