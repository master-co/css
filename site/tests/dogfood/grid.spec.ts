import { expect, test, type FrameLocator, type Locator, type Page } from '@playwright/test'

const routes = ['grid', 'grid-area', 'grid-auto-columns', 'grid-auto-flow', 'grid-auto-rows', 'grid-column', 'grid-columns', 'grid-row', 'grid-rows', 'grid-template', 'grid-template-areas', 'grid-template-columns', 'grid-template-rows']
const example = (page: Page, route: string, section: string) => page.locator(`[data-demo-case="${route}#${section}"]`)
async function ready(demo: Locator) {
  await demo.scrollIntoViewIfNeeded()
  await expect(demo.locator('iframe')).toHaveAttribute('data-ready', 'true')
  await demo.locator('iframe').evaluate(async (element: HTMLIFrameElement) => { await element.contentDocument!.fonts.ready })
  return demo.frameLocator('iframe')
}
async function box(frame: FrameLocator, id = 'target', prefix = '') {
  return frame.locator(`#${prefix}${id}`).evaluate((element, layoutId) => {
    const box = element.getBoundingClientRect(), origin = element.ownerDocument.getElementById(layoutId)!.getBoundingClientRect()
    return { x: box.left - origin.left, y: box.top - origin.top, w: box.width, h: box.height, width: origin.width, height: origin.height }
  }, `${prefix}layout`)
}
async function bounds(frame: FrameLocator, expected: Partial<Awaited<ReturnType<typeof box>>>, id = 'target', prefix = '') {
  const actual = await box(frame, id, prefix)
  for (const [key, value] of Object.entries(expected)) expect(actual[key as keyof typeof actual], `${prefix}${id} ${key}`).toBeCloseTo(value, 1)
}
async function tracks(frame: FrameLocator, columns: number[], rows: number[], prefix = '') {
  const actual = await frame.locator(`#${prefix}layout`).evaluate(element => {
    const style = getComputedStyle(element)
    return [style.gridTemplateColumns, style.gridTemplateRows].map(value => value.split(' ').map(Number.parseFloat))
  })
  for (const [index, expected] of [columns, rows].entries()) {
    expect(actual[index]).toHaveLength(expected.length)
    expected.forEach((value, n) => expect(actual[index][n]).toBeCloseTo(value, 1))
  }
  for (const property of ['grid-template-columns', 'grid-template-rows', 'grid-auto-flow']) {
    const value = await frame.locator(`#${prefix}layout`).evaluate((element, property) => getComputedStyle(element).getPropertyValue(property), property)
    const reading = frame.locator(`[data-style-readout="${prefix}layout"][data-style-property="${property}"]`)
    if (property === 'grid-auto-flow') await expect(reading).toHaveText(value)
    else {
      await expect(reading).toHaveText(value.replace(/(-?\d*\.?\d+)px\b/g, (_, number: string) => `${Math.round(Number(number) * 10) / 10}px`))
      await expect(reading).toHaveAttribute('title', value)
    }
  }
}
async function viewport(demo: Locator, width: number) {
  await demo.getByLabel('Viewport', { exact: true }).fill(String(width))
  await expect.poll(() => demo.locator('iframe').evaluate(element => element.clientWidth)).toBe(width)
}
async function conditional(page: Page, route: string) {
  const demo = example(page, route, 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 360)
  return { demo, frame }
}

test('grid shorthand establishes tracks and flow while display and gap remain separate', async ({ page }) => {
  await page.goto('/en/reference/grid')
  const reset = await ready(example(page, 'grid', 'set-the-native-grid-shorthand'))
  await tracks(reset, [80, 184], [48, 48], 'example-0-')
  await bounds(reset, { x: 0, y: 64 }, 'peer', 'example-0-')
  await expect(reset.locator('#example-1-layout')).toHaveCSS('display', 'grid')
  await expect(reset.locator('#example-1-layout')).toHaveCSS('grid-auto-flow', 'row')
  await expect(reset.locator('#example-1-layout')).toHaveCSS('gap', '16px')
  await bounds(reset, { w: 280, x: 0 }, 'target', 'example-1-')
  const first = await box(reset, 'target', 'example-1-'), second = await box(reset, 'peer', 'example-1-')
  expect(second.y - first.h).toBeCloseTo(16, 1)
  const flow = await ready(example(page, 'grid', 'define-rows-columns-and-auto-flow-together'))
  for (const prefix of ['example-0-', 'example-1-']) await tracks(flow, [132, 132], [56, 56], prefix)
  await bounds(flow, { x: 148, y: 0 }, 'peer', 'example-0-')
  await bounds(flow, { x: 0, y: 72 }, 'peer', 'example-1-')
  const { demo, frame } = await conditional(page, 'grid')
  await tracks(frame, [280], [48, 48, 48, 48])
  await viewport(demo, 900)
  await expect(frame.locator('#layout')).toHaveCSS('grid-template-columns', '132px 132px')
  await tracks(frame, [132, 132], [48, 48])
})

test('grid-area resolves four line boundaries, spans, named regions and responsive placement', async ({ page }) => {
  await page.goto('/en/reference/grid-area')
  const lines = await ready(example(page, 'grid-area', 'place-an-item-by-grid-lines'))
  await bounds(lines, { x: 296 / 3, y: 64, w: 544 / 3, h: 144 })
  await bounds(lines, { x: 0, y: 0, w: 280, h: 48 }, 'peer')
  const span = await ready(example(page, 'grid-area', 'span-tracks'))
  await bounds(span, { x: 296 / 3, y: 64, w: 544 / 3, h: 112 })
  const named = await ready(example(page, 'grid-area', 'use-a-named-area'))
  await bounds(named, { w: 280, h: 64, x: 0, y: 0 })
  await bounds(named, { w: 80, h: 80, x: 0, y: 80 }, 'peer')
  const { demo, frame } = await conditional(page, 'grid-area')
  await bounds(frame, { x: 0, y: 0, h: 48, w: 248 / 3 })
  await viewport(demo, 900)
  await expect(frame.locator('#target')).toHaveCSS('grid-area', '2 / 2 / span 2 / span 2')
  await bounds(frame, { x: 296 / 3, y: 64, w: 544 / 3, h: 112 })
  await bounds(frame, { x: 0, y: 0 }, 'peer')
})

test('grid-auto-columns changes implicit tracks without resizing the explicit column', async ({ page }) => {
  await page.goto('/en/reference/grid-auto-columns')
  const implicit = await ready(example(page, 'grid-auto-columns', 'size-implicit-columns'))
  await tracks(implicit, [80, 72, 72], [64])
  await bounds(implicit, { x: 96, w: 72, h: 64 })
  const { demo, frame } = await conditional(page, 'grid-auto-columns')
  await tracks(frame, [80, 56, 56], [64])
  await viewport(demo, 900)
  await expect(frame.locator('#layout')).toHaveCSS('grid-auto-columns', '80px')
  await tracks(frame, [80, 80, 80], [64])
  await bounds(frame, { w: 80, x: 0 }, 'peer')
})

test('grid-auto-rows sizes excess rows and preserves an explicit first row', async ({ page }) => {
  await page.goto('/en/reference/grid-auto-rows')
  const implicit = await ready(example(page, 'grid-auto-rows', 'size-implicit-rows'))
  await tracks(implicit, [132, 132], [48, 64, 64])
  await bounds(implicit, { y: 64, h: 64 })
  const { demo, frame } = await conditional(page, 'grid-auto-rows')
  await tracks(frame, [132, 132], [48, 56, 56])
  await viewport(demo, 900)
  await expect(frame.locator('#layout')).toHaveCSS('grid-auto-rows', '80px')
  await tracks(frame, [132, 132], [48, 80, 80])
  await bounds(frame, { h: 48, y: 0 }, 'peer')
})

test('grid-auto-flow creates actual dense holes while native focus keeps source order', async ({ page }) => {
  await page.goto('/en/reference/grid-auto-flow')
  const flow = await ready(example(page, 'grid-auto-flow', 'fill-by-column'))
  await bounds(flow, { x: 148, y: 0 }, 'peer', 'example-0-')
  await bounds(flow, { x: 0, y: 72 }, 'peer', 'example-1-')
  const dense = await ready(example(page, 'grid-auto-flow', 'fill-gaps-densely'))
  await bounds(dense, { x: 592 / 3, y: 64 }, 'item-3', 'example-0-')
  await bounds(dense, { x: 592 / 3, y: 0 }, 'item-3', 'example-1-')
  await bounds(dense, { height: 176 }, 'target', 'example-0-')
  await bounds(dense, { height: 112 }, 'target', 'example-1-')
  for (const prefix of ['example-0-', 'example-1-']) {
    await dense.locator(`#${prefix}target`).focus()
    for (const id of ['target', 'peer', 'item-3', 'item-4']) {
      await expect(dense.locator(`#${prefix}${id}`)).toBeFocused()
      await expect(dense.locator(`#${prefix}${id}`)).toHaveCSS('outline-width', '2px')
      await page.keyboard.press('Tab')
    }
  }
  const { demo, frame } = await conditional(page, 'grid-auto-flow')
  await bounds(frame, { x: 148, y: 0 }, 'peer')
  await viewport(demo, 900)
  await expect(frame.locator('#layout')).toHaveCSS('grid-auto-flow', 'column')
  await bounds(frame, { x: 0, y: 72 }, 'peer')
})

test('grid-column line boundaries and spans include real tracks and internal gaps', async ({ page }) => {
  await page.goto('/en/reference/grid-column')
  const lines = await ready(example(page, 'grid-column', 'place-an-item-by-columns'))
  await bounds(lines, { x: 296 / 3, y: 0, w: 544 / 3 }, 'target', 'example-0-')
  await bounds(lines, { x: 0, y: 0, w: 280 }, 'target', 'example-1-')
  const span = await ready(example(page, 'grid-column', 'span-columns'))
  await bounds(span, { x: 0, y: 0, w: 544 / 3 })
  await bounds(span, { x: 592 / 3, y: 0 }, 'peer')
  const { demo, frame } = await conditional(page, 'grid-column')
  await bounds(frame, { w: 248 / 3 })
  await viewport(demo, 900)
  await expect(frame.locator('#target')).toHaveCSS('grid-column', '1 / -1')
  await bounds(frame, { w: 280 })
  await bounds(frame, { x: 0, y: 64 }, 'peer')
})

test('grid-row line boundaries and auto spans occupy the authored rows', async ({ page }) => {
  await page.goto('/en/reference/grid-row')
  const lines = await ready(example(page, 'grid-row', 'place-an-item-by-rows'))
  await bounds(lines, { x: 0, y: 0, h: 112 }, 'target', 'example-0-')
  await bounds(lines, { x: 0, y: 0, h: 176 }, 'target', 'example-1-')
  const span = await ready(example(page, 'grid-row', 'span-rows'))
  await bounds(span, { h: 112 })
  await bounds(span, { x: 148, y: 64 }, 'item-3')
  const { demo, frame } = await conditional(page, 'grid-row')
  await bounds(frame, { h: 48 })
  await viewport(demo, 900)
  await expect(frame.locator('#target')).toHaveCSS('grid-row', '1 / -1')
  await bounds(frame, { h: 176 })
  await bounds(frame, { x: 148, y: 0 }, 'peer')
})

test('grid-cols creates equal tracks and changes count at real sm and lg queries', async ({ page }) => {
  await page.goto('/en/reference/grid-columns')
  const equal = await ready(example(page, 'grid-columns', 'create-equal-columns'))
  await tracks(equal, [248 / 3, 248 / 3, 248 / 3], [48, 48])
  const { demo, frame } = await conditional(page, 'grid-columns')
  await tracks(frame, [132, 132], [48, 48, 48])
  await viewport(demo, 900)
  await expect.poll(async () => (await box(frame)).w).toBeCloseTo(248 / 3, 1)
  await tracks(frame, [248 / 3, 248 / 3, 248 / 3], [48, 48])
  await viewport(demo, 1400)
  await expect.poll(async () => (await box(frame)).w).toBe(58)
  await tracks(frame, [58, 58, 58, 58], [48, 48])
})

test('grid-rows supplies column flow as well as equal definite-height rows', async ({ page }) => {
  await page.goto('/en/reference/grid-rows')
  const equal = await ready(example(page, 'grid-rows', 'create-equal-rows'))
  await tracks(equal, [132, 132], [64, 64, 64])
  await bounds(equal, { x: 0, y: 80 }, 'peer')
  await bounds(equal, { x: 148, y: 0 }, 'item-4')
  const { demo, frame } = await conditional(page, 'grid-rows')
  await tracks(frame, [248 / 3, 248 / 3, 248 / 3], [104, 104])
  await viewport(demo, 900)
  await expect(frame.locator('#layout')).toHaveCSS('grid-template-rows', '64px 64px 64px')
  await tracks(frame, [132, 132], [64, 64, 64])
})

test('grid-template sets explicit dimensions without resetting implicit settings', async ({ page }) => {
  await page.goto('/en/reference/grid-template')
  const template = await ready(example(page, 'grid-template', 'define-rows-and-columns-together'))
  await tracks(template, [96, 168], [64, 144], 'example-0-')
  await tracks(template, [72, 72, 72], [48], 'example-1-')
  await expect(template.locator('#example-1-layout')).toHaveCSS('grid-auto-flow', 'column')
  // Native shorthand comparison on the same fixture establishes reset semantics.
  const retained = template.locator('#example-1-layout')
  await retained.evaluate((element: HTMLElement) => { element.style.gridTemplate = 'none' })
  await expect(retained).toHaveCSS('grid-auto-columns', '72px')
  await retained.evaluate((element: HTMLElement) => { element.style.grid = 'none' })
  await expect(retained).toHaveCSS('grid-auto-columns', 'auto')
  await expect(retained).toHaveCSS('grid-auto-flow', 'row')
  await expect(retained).toHaveCSS('gap', '16px')
  const { demo, frame } = await conditional(page, 'grid-template')
  await tracks(frame, [280], [48, 48, 48, 48])
  await viewport(demo, 900)
  await expect(frame.locator('#layout')).toHaveCSS('grid-template-rows', '64px 160px')
  await tracks(frame, [96, 168], [64, 160])
})

test('named grid regions resize through a real map while children retain their names', async ({ page }) => {
  await page.goto('/en/reference/grid-template-areas')
  const named = await ready(example(page, 'grid-template-areas', 'name-areas-in-a-grid'))
  await bounds(named, { w: 280, h: 48, x: 0, y: 0 })
  await bounds(named, { w: 80, h: 96, x: 0, y: 64 }, 'peer')
  await bounds(named, { w: 184, h: 96, x: 96, y: 64 }, 'item-3')
  const { demo, frame } = await conditional(page, 'grid-template-areas')
  await bounds(frame, { w: 280, y: 64, h: 48 }, 'peer')
  await bounds(frame, { w: 280, y: 128, h: 96 }, 'item-3')
  await viewport(demo, 900)
  await expect(frame.locator('#layout')).toHaveCSS('grid-template-areas', '"head head" "nav main"')
  await bounds(frame, { w: 80, h: 96, x: 0, y: 64 }, 'peer')
  await expect(frame.locator('#target')).toHaveCSS('grid-area', 'head')
  // Clearing the map does not clear item placement.
  await named.locator('#layout').evaluate((element: HTMLElement) => { element.style.gridTemplateAreas = 'none' })
  await expect(named.locator('#target')).toHaveCSS('grid-area', 'head')
})

test('column minimums distinguish intrinsic size, fractional tracks and content clipping', async ({ page }) => {
  await page.goto('/en/reference/grid-template-columns')
  const explicit = await ready(example(page, 'grid-template-columns', 'define-explicit-columns'))
  await tracks(explicit, [64, 136, 48], [64])
  const minimum = await ready(example(page, 'grid-template-columns', 'use-minmax'))
  await tracks(minimum, [216, 48], [64], 'example-0-')
  await tracks(minimum, [88, 176], [64], 'example-1-')
  for (const prefix of ['example-0-', 'example-1-']) {
    expect(await minimum.locator(`#${prefix}target > span`).evaluate(element => element.getBoundingClientRect().width)).toBe(192)
    await expect(minimum.locator(`#${prefix}target`)).toHaveCSS('overflow', 'clip')
  }
  const { demo, frame } = await conditional(page, 'grid-template-columns')
  await tracks(frame, [132, 132], [48, 48])
  await viewport(demo, 900)
  await expect(frame.locator('#layout')).toHaveCSS('grid-template-columns', '80px 184px')
  await tracks(frame, [80, 184], [48, 48])
})

test('row minimums grow with real line content and leave the rest to a fraction', async ({ page }) => {
  await page.goto('/en/reference/grid-template-rows')
  const explicit = await ready(example(page, 'grid-template-rows', 'define-explicit-rows'))
  await tracks(explicit, [280], [48, 80, 48])
  const minimum = await ready(example(page, 'grid-template-rows', 'use-minmax'))
  await tracks(minimum, [280], [48, 160], 'example-0-')
  await tracks(minimum, [280], [104, 104], 'example-1-')
  const { demo, frame } = await conditional(page, 'grid-template-rows')
  await tracks(frame, [280], [48, 80, 48])
  await viewport(demo, 900)
  await expect(frame.locator('#layout')).toHaveCSS('grid-template-rows', '80px 48px 80px')
  await tracks(frame, [280], [80, 48, 80])
  await bounds(frame, { height: 240 })
})

for (const route of routes) {
  test(`grid composition: ${route}`, async ({ page }, testInfo) => {
    const failures: string[] = []
    page.on('pageerror', error => failures.push(error.message))
    page.on('console', message => { if (message.type() === 'error' && /hydration|hydrate|mismatch/i.test(message.text())) failures.push(message.text()) })
    await page.goto(`/en/reference/${route}`)
    await page.addStyleTag({ content: 'nextjs-portal { visibility: hidden }' })
    for (const [index, demo] of (await page.locator('.site-demo').all()).entries()) {
      await ready(demo)
      await demo.evaluate(element => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 96))
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
      await demo.screenshot({ path: testInfo.outputPath(`demo-${index}.png`), scale: 'css' })
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
    expect(failures).toEqual([])
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: testInfo.outputPath('page.png'), fullPage: true, scale: 'css' })
  })
}
