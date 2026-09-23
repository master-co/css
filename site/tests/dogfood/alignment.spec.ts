import { expect, test, type FrameLocator, type Locator, type Page } from '@playwright/test'

const routes = ['align-content', 'align-items', 'align-self', 'justify-content', 'justify-items', 'justify-self', 'place-content', 'place-items', 'place-self']
const example = (page: Page, route: string, section: string) => page.locator(`[data-demo-case="${route}#${section}"]`)
async function ready(demo: Locator) {
  await demo.scrollIntoViewIfNeeded()
  await expect(demo.locator('iframe')).toHaveAttribute('data-ready', 'true')
  await demo.locator('iframe').evaluate(async (element: HTMLIFrameElement) => { await element.contentDocument!.fonts.ready })
  return demo.frameLocator('iframe')
}
async function geometry(frame: FrameLocator, prefix = '', id = 'target') {
  return frame.locator(`#${prefix}${id}`).evaluate((element, layoutId) => {
    const box = element.getBoundingClientRect(), origin = element.ownerDocument.getElementById(layoutId)!.getBoundingClientRect()
    return { x: box.left - origin.left, y: box.top - origin.top, w: box.width, h: box.height, width: origin.width, height: origin.height }
  }, `${prefix}layout`)
}
async function position(frame: FrameLocator, x: number, y: number, prefix = '', id = 'target') {
  const box = await geometry(frame, prefix, id)
  expect(box.x).toBeCloseTo(x, 1)
  expect(box.y).toBeCloseTo(y, 1)
}
async function readings(frame: FrameLocator, prefix = '') {
  const box = await geometry(frame, prefix)
  const round = (value: number) => Math.round(value * 10) / 10
  await expect(frame.locator(`[data-position-readout="${prefix}target"]`)).toHaveText(`x ${round(box.x)} · y ${round(box.y)} px`)
  await expect(frame.locator(`[data-size-readout="${prefix}target"]`)).toHaveText(`${round(box.w)} × ${round(box.h)} px`)
}
async function viewport(demo: Locator, width: number) {
  await demo.getByLabel('Viewport', { exact: true }).fill(String(width))
  await expect.poll(() => demo.locator('iframe').evaluate(element => element.clientWidth)).toBe(width)
}
async function centered(frame: FrameLocator, both = false) {
  const box = await geometry(frame)
  const column = (box.width - 16) / 2
  expect(box.x).toBeCloseTo((column - box.w) / 2, 1)
  expect(box.y).toBeCloseTo(both ? (box.height - box.h) / 2 : 0, 1)
  await readings(frame)
}

test('align-content distributes genuine flex lines and fixed grid tracks', async ({ page }) => {
  await page.goto('/en/reference/align-content')
  const between = await ready(example(page, 'align-content', 'align-multiple-rows-or-tracks'))
  await position(between, 0, 0)
  await position(between, 0, 176, '', 'item-3')
  const center = await ready(example(page, 'align-content', 'center-wrapped-lines'))
  for (const prefix of ['example-0-', 'example-1-']) {
    await position(center, 0, 56, prefix)
    await position(center, 0, 120, prefix, 'item-3')
    await readings(center, prefix)
  }
  const demo = example(page, 'align-content', 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 300)
  await expect(frame.locator('#layout')).toHaveCSS('align-content', 'start')
  await position(frame, 0, 64, '', 'item-3')
  await viewport(demo, 900)
  await expect(frame.locator('#layout')).toHaveCSS('align-content', 'space-between')
  await position(frame, 0, 176, '', 'item-3')
  // A wrapping container may have one actual line; nowrap uses a different line box.
  await center.locator('#example-0-layout').evaluate(element => {
    element.children[3].remove(); element.children[2].remove()
  })
  await position(center, 0, 88, 'example-0-')
  await center.locator('#example-0-layout').evaluate((element: HTMLElement) => { element.style.flexWrap = 'nowrap' })
  await position(center, 0, 0, 'example-0-')
})

test('align-items centers real media, stretches auto sizes and aligns text baselines', async ({ page }) => {
  await page.goto('/en/reference/align-items')
  const center = await ready(example(page, 'align-items', 'align-items-on-the-cross-axis'))
  const media = await geometry(center), text = await geometry(center, '', 'peer')
  expect(media.h).toBe(64)
  expect(media.y + media.h / 2).toBeCloseTo(text.y + text.h / 2, 1)
  expect(await center.locator('img').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)
  const edges = await ready(example(page, 'align-items', 'align-to-the-start-or-end'))
  expect((await geometry(edges, 'example-0-', 'peer')).y).toBe(0)
  const end = await geometry(edges, 'example-1-', 'peer')
  expect(end.y + end.h).toBe(96)
  const stretch = await ready(example(page, 'align-items', 'stretch-children'))
  expect((await geometry(stretch, 'example-0-')).h).toBe(128)
  expect((await geometry(stretch, 'example-0-', 'peer')).h).toBe(64)
  expect((await geometry(stretch, 'example-1-')).h).toBe(96)
  expect((await geometry(stretch, 'example-1-')).height).toBe(96)
  const baseline = await ready(example(page, 'align-items', 'align-text-baselines'))
  const baselines = await baseline.locator('#layout').evaluate(element => {
    // Zero-size inline probes expose the actual text baseline without changing boxes.
    return Array.from(element.children).map(child => {
      const before = child.getBoundingClientRect()
      const probe = element.ownerDocument.createElement('span')
      probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'
      child.append(probe)
      const y = probe.getBoundingClientRect().top, after = child.getBoundingClientRect()
      probe.remove()
      return { y, widthChange: after.width - before.width, heightChange: after.height - before.height }
    })
  })
  expect(baselines[0].y).toBeCloseTo(baselines[1].y, 1)
  for (const value of baselines) expect(value).toMatchObject({ widthChange: 0, heightChange: 0 })
  const demo = example(page, 'align-items', 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 300)
  await position(frame, 0, 0)
  await viewport(demo, 900)
  await expect(frame.locator('#layout')).toHaveCSS('align-items', 'center')
  const middle = await geometry(frame)
  expect(middle.y).toBeCloseTo((128 - middle.h) / 2, 1)
  await viewport(demo, 1400)
  await expect(frame.locator('#layout')).toHaveCSS('align-items', 'stretch')
  expect((await geometry(frame)).h).toBe(128)
  expect((await geometry(frame, '', 'peer')).h).toBe(64)
  await readings(frame)
})

test('align-self overrides the parent and auto follows its real default', async ({ page }) => {
  await page.goto('/en/reference/align-self')
  const override = await ready(example(page, 'align-self', 'override-cross-axis-alignment-for-one-item'))
  await position(override, 0, 40)
  expect((await geometry(override, '', 'peer')).y).toBe(0)
  const stretch = await ready(example(page, 'align-self', 'stretch-a-single-item'))
  expect((await geometry(stretch)).h).toBe(96)
  expect((await geometry(stretch, '', 'item-3')).y).toBe(24)
  const demo = example(page, 'align-self', 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 300)
  await position(frame, 0, 80)
  await expect(frame.locator('#target')).toHaveCSS('align-self', 'auto')
  await viewport(demo, 900)
  await expect(frame.locator('#target')).toHaveCSS('align-self', 'center')
  await position(frame, 0, 40)
  expect((await geometry(frame, '', 'peer')).y).toBe(96)
  await readings(frame)
})

test('justify-content uses real free space and preserves access with safe overflow', async ({ page }) => {
  await page.goto('/en/reference/justify-content')
  const modes = await ready(example(page, 'justify-content', 'align-items-on-the-main-axis'))
  for (const prefix of ['example-0-', 'example-1-']) await position(modes, 200, 0, prefix, 'peer')
  const group = await ready(example(page, 'justify-content', 'start-center-or-end-a-group'))
  for (const [index, x] of [0, 68, 136].entries()) await position(group, x, 0, `example-${index}-`)
  await position(group, 0, 56, 'example-3-')
  await expect(group.locator('[data-alignment-axis="example-3-layout"]')).toHaveText('block axis')
  const distribute = await ready(example(page, 'justify-content', 'distribute-extra-space'))
  for (const [index, start] of [0, 104 / 6, 26].entries()) {
    await position(distribute, start, 0, `example-${index}-`)
    await position(distribute, 116, 0, `example-${index}-`, 'peer')
    await readings(distribute, `example-${index}-`)
  }
  const safe = await ready(example(page, 'justify-content', 'use-explicit-css-values'))
  await position(safe, 0, 0, 'example-0-')
  await position(safe, -20, 0, 'example-1-')
  await position(safe, 24, 0, 'example-2-')
  const scrollport = safe.getByRole('region', { name: 'Safe centered overflow', exact: true })
  await scrollport.focus()
  await expect(scrollport).toBeFocused()
  await expect(scrollport).toHaveCSS('outline-width', '2px')
  await scrollport.evaluate(element => element.scrollBy({ left: 40, behavior: 'instant' }))
  await expect.poll(() => scrollport.evaluate(element => element.scrollLeft)).toBe(40)
  await position(safe, -40, 0, 'example-0-')
  await readings(safe, 'example-0-')
  const demo = example(page, 'justify-content', 'apply-conditionally'), frame = await ready(demo)
  for (const [width, value, x] of [[300, 'start', 0], [900, 'center', 68], [1400, 'space-between', 0]] as const) {
    await viewport(demo, width)
    await expect(frame.locator('#layout')).toHaveCSS('justify-content', value)
    await position(frame, x, 0)
  }
  await position(frame, 216, 0, '', 'peer')
})

test('justify-items aligns within equal columns and only stretches automatic widths', async ({ page }) => {
  await page.goto('/en/reference/justify-items')
  await centered(await ready(example(page, 'justify-items', 'align-grid-items-inline')))
  const stretch = await ready(example(page, 'justify-items', 'stretch-items-by-default'))
  expect((await geometry(stretch)).w).toBe(132)
  expect((await geometry(stretch, '', 'peer')).w).toBe(80)
  const demo = example(page, 'justify-items', 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 300)
  expect((await geometry(frame)).w).toBe(126)
  await viewport(demo, 900)
  await expect(frame.locator('#layout')).toHaveCSS('justify-items', 'center')
  await centered(frame)
  await expect(frame.locator('[data-style-property="grid-template-columns"]')).toHaveText('132px 132px')
})

test('justify-self changes one item inside its assigned grid area', async ({ page }) => {
  await page.goto('/en/reference/justify-self')
  const end = await ready(example(page, 'justify-self', 'align-one-grid-item-inline'))
  await position(end, 52, 0)
  await position(end, 148, 0, '', 'peer')
  const center = await ready(example(page, 'justify-self', 'center-an-item-inside-its-area'))
  await position(center, 26, 0)
  const demo = example(page, 'justify-self', 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 300)
  await position(frame, 0, 0)
  await viewport(demo, 900)
  await expect(frame.locator('#target')).toHaveCSS('justify-self', 'end')
  await position(frame, 52, 0)
  await readings(frame)
})

test('place-content distributes fixed tracks on two distinct axes', async ({ page }) => {
  await page.goto('/en/reference/place-content')
  const center = await ready(example(page, 'place-content', 'align-grid-or-wrapped-flex-content-on-both-axes'))
  await position(center, 52, 56)
  const split = await ready(example(page, 'place-content', 'use-separate-axis-values'))
  await position(split, 0, 0)
  await position(split, 200, 0, '', 'peer')
  await position(split, 0, 64, '', 'item-3')
  const demo = example(page, 'place-content', 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 300)
  await position(frame, 0, 0)
  await viewport(demo, 900)
  await expect(frame.locator('#layout')).toHaveCSS('place-content', 'center')
  await position(frame, 52, 56)
  await readings(frame)
})

test('place-items centers intrinsic items and stretches only automatic dimensions', async ({ page }) => {
  await page.goto('/en/reference/place-items')
  await centered(await ready(example(page, 'place-items', 'align-grid-items-on-both-axes')), true)
  const stretch = await ready(example(page, 'place-items', 'stretch-items'))
  expect(await geometry(stretch)).toMatchObject({ w: 132, h: 160, x: 0, y: 0 })
  expect(await geometry(stretch, '', 'peer')).toMatchObject({ w: 80, h: 64 })
  const demo = example(page, 'place-items', 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 300)
  expect(await geometry(frame)).toMatchObject({ w: 126, h: 160 })
  await viewport(demo, 900)
  await expect(frame.locator('#layout')).toHaveCSS('place-items', 'center')
  await centered(frame, true)
})

test('place-self separates the two axes and auto follows the parent default', async ({ page }) => {
  await page.goto('/en/reference/place-self')
  const end = await ready(example(page, 'place-self', 'align-one-item-on-both-axes'))
  await position(end, 52, 112, 'example-0-')
  await position(end, 0, 112, 'example-1-')
  const center = await ready(example(page, 'place-self', 'center-one-item'))
  await position(center, 18, 48)
  const demo = example(page, 'place-self', 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 300)
  await position(frame, 46, 112)
  await viewport(demo, 900)
  await expect(frame.locator('#target')).toHaveCSS('place-self', 'center')
  await position(frame, 26, 56)
  await position(frame, 200, 112, '', 'peer')
  await readings(frame)
})

for (const route of routes) {
  test(`alignment composition: ${route}`, async ({ page }, testInfo) => {
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
