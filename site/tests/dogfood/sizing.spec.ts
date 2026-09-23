import { expect, test, type FrameLocator, type Locator, type Page } from '@playwright/test'

const routes = ['width', 'height', 'size', 'min-width', 'min-height', 'min-size', 'max-width', 'max-height', 'max-size', 'aspect-ratio', 'gap', 'margin', 'padding']
const example = (page: Page, route: string, section: string) => page.locator(`[data-demo-case="${route}#${section}"]`)
async function ready(demo: Locator) {
  await demo.scrollIntoViewIfNeeded()
  await expect(demo.locator('iframe')).toHaveAttribute('data-ready', 'true')
  await demo.locator('iframe').evaluate(async (element: HTMLIFrameElement) => {
    const doc = element.contentDocument!
    await doc.fonts.ready
    await Promise.all([...doc.images].map(image => image.decode()))
  })
  return demo.frameLocator('iframe')
}
function id(name: string, index?: number) { return `#${index === undefined ? '' : `example-${index}-`}${name}` }
async function box(frame: FrameLocator, name = 'target', index?: number) {
  return frame.locator(id(name, index)).evaluate((element, originId) => {
    const r = element.getBoundingClientRect(), p = element.ownerDocument.querySelector(originId)!.getBoundingClientRect()
    return { w: r.width, h: r.height, x: r.left - p.left, y: r.top - p.top }
  }, id('layout', index))
}
async function bounds(frame: FrameLocator, expected: Partial<Awaited<ReturnType<typeof box>>>, name = 'target', index?: number) {
  const actual = await box(frame, name, index)
  for (const [key, value] of Object.entries(expected)) expect(actual[key as keyof typeof actual], `${id(name, index)} ${key}`).toBeCloseTo(value, 1)
}
async function intrinsicWidths(frame: FrameLocator) {
  // Read the actual glyphs: the preset mono stack differs across browser platforms.
  const metrics = await frame.locator(id('target', 2)).evaluate(element => {
    const context = element.ownerDocument.createElement('canvas').getContext('2d')!
    context.font = getComputedStyle(element).font
    return { phrase: context.measureText('Design systems').width, word: context.measureText('systems').width }
  })
  await bounds(frame, { w: metrics.word + 24, h: 72 }, 'target', 0)
  await bounds(frame, { w: 112, h: 72 }, 'target', 1)
  await bounds(frame, { w: metrics.phrase + 24, h: 48 }, 'target', 2)
}
async function viewport(demo: Locator, width: number) {
  await demo.getByLabel('Viewport', { exact: true }).fill(String(width))
  await expect.poll(() => demo.locator('iframe').evaluate(element => element.clientWidth)).toBe(width)
}
async function condition(page: Page, route: string, before: { w?: number, h?: number }, after: { w?: number, h?: number }) {
  const demo = example(page, route, 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 360)
  await bounds(frame, before)
  await viewport(demo, 900)
  await expect.poll(() => box(frame)).toMatchObject(after)
  return { demo, frame }
}
async function scroll(page: Page, frame: FrameLocator, name: string) {
  const port = frame.getByRole('region', { name })
  await port.focus()
  await expect(port).toBeFocused()
  await expect(port).toHaveCSS('outline-width', '2px')
  // Give WebKit a real key-hold interval for its native scrolling animation.
  await page.keyboard.press('ArrowDown', { delay: 100 })
  await expect.poll(() => port.evaluate(element => element.scrollTop)).toBeGreaterThan(0)
  await port.evaluate(element => element.scrollTo({ top: element.scrollHeight, behavior: 'instant' }))
  await expect.poll(() => port.evaluate(element => element.scrollTop)).toBeGreaterThan(20)
  const offset = await port.evaluate(element => Math.round(element.scrollTop))
  await expect(frame.locator('[data-scroll-readout]')).toHaveText(`x 0 · y ${offset} px`)
}

test('width separates fixed, percentage, intrinsic and capped fluid sizes', async ({ page }) => {
  await page.goto('/en/reference/width')
  const fixed = await ready(example(page, 'width', 'set-a-fixed-or-fluid-width'))
  await bounds(fixed, { w: 192 }, 'target', 0)
  await bounds(fixed, { w: 280 }, 'target', 1)
  const percentage = await ready(example(page, 'width', 'use-percentages-for-proportional-layout'))
  await bounds(percentage, { w: 140 }, 'target', 0)
  await bounds(percentage, { w: 100 }, 'target', 1)
  const intrinsic = await ready(example(page, 'width', 'use-intrinsic-width-keywords'))
  await intrinsicWidths(intrinsic)
  const wrapper = example(page, 'width', 'use-container-widths-for-wrappers'), frame = await ready(wrapper)
  await viewport(wrapper, 300)
  await bounds(frame, { w: 256, x: 6 })
  await viewport(wrapper, 240)
  await expect.poll(() => box(frame)).toMatchObject({ w: 208, x: 0 })
  await condition(page, 'width', { w: 280 }, { w: 140 })
})

test('height distinguishes definite percentages, content height and actual viewport units', async ({ page }) => {
  await page.goto('/en/reference/height')
  await bounds(await ready(example(page, 'height', 'set-a-fixed-height')), { h: 48 })
  const parent = await ready(example(page, 'height', 'fill-a-parent-height'))
  await bounds(parent, { h: 160 }, 'target', 0)
  await bounds(parent, { h: 44 }, 'target', 1)
  const viewportDemo = example(page, 'height', 'use-viewport-and-intrinsic-values'), view = await ready(viewportDemo)
  await expect(viewportDemo.locator('iframe')).toHaveAttribute('data-sizing', 'viewport')
  expect(await viewportDemo.locator('iframe').evaluate(e => e.clientHeight)).toBe(320)
  await bounds(view, { h: 160 }, 'target', 0)
  await bounds(view, { h: 64 }, 'target', 1)
  const control = await ready(example(page, 'height', 'size-both-axes-together'))
  await bounds(control, { w: 40, h: 40 })
  await expect(control.getByRole('button', { name: 'Add layer' })).toHaveCount(1)
  await condition(page, 'height', { h: 48 }, { h: 80 })
})

test('size demonstrates paired physical dimensions, logical axes and intrinsic content', async ({ page }) => {
  await page.goto('/en/reference/size')
  const button = await ready(example(page, 'size', 'set-width-and-height-together'))
  await bounds(button, { w: 40, h: 40 })
  await expect(button.getByRole('button', { name: 'Add layer' })).toHaveCount(1)
  const media = await ready(example(page, 'size', 'build-square-media-and-controls'))
  await bounds(media, { w: 64, h: 64 })
  await expect(media.getByRole('img')).toHaveCSS('object-fit', 'cover')
  const axes = await ready(example(page, 'size', 'set-one-logical-axis'))
  await bounds(axes, { w: 160, h: 80 }, 'target', 0)
  await bounds(axes, { w: 80, h: 160 }, 'target', 1)
  const full = await ready(example(page, 'size', 'use-the-full-static-utility'))
  await bounds(full, { w: 240, h: 120 }, 'target', 0)
  await bounds(full, { w: 240, h: 44 }, 'target', 1)
  const fit = await ready(example(page, 'size', 'use-intrinsic-static-utilities'))
  const compact = await box(fit, 'target', 0), wrapping = await box(fit, 'target', 1)
  expect(compact.w).toBeLessThan(240)
  expect(wrapping.w).toBe(240)
  expect(wrapping.h).toBeGreaterThan(compact.h)
  await condition(page, 'size', { w: 48, h: 48 }, { w: 80, h: 80 })
})

test('minimum width handles flex automatic minimums and conflicting bounds', async ({ page }) => {
  await page.goto('/en/reference/min-width')
  const button = await ready(example(page, 'min-width', 'preserve-a-minimum-inline-size'))
  await bounds(button, { w: 128 })
  await expect(button.getByRole('button', { name: 'Continue' })).toHaveCount(1)
  const flex = await ready(example(page, 'min-width', 'allow-flexible-children-to-shrink'))
  await bounds(flex, { w: 224, x: 64 }, 'target', 0)
  await bounds(flex, { w: 176, x: 64 }, 'target', 1)
  for (const index of [0, 1]) {
    await bounds(flex, { w: 224 }, 'item-3', index)
    await expect(flex.locator(id('target', index))).toHaveCSS('overflow', 'clip')
  }
  const limits = await ready(example(page, 'min-width', 'combine-with-width-and-max-width'))
  for (const [index, w] of [160, 200, 224].entries()) await bounds(limits, { w }, 'target', index)
  const intrinsic = await ready(example(page, 'min-width', 'use-intrinsic-keywords'))
  await intrinsicWidths(intrinsic)
  await condition(page, 'min-width', { w: 80 }, { w: 160 })
})

test('minimum height grows with real content and uses a bounded viewport reference', async ({ page }) => {
  await page.goto('/en/reference/min-height')
  const baseline = await ready(example(page, 'min-height', 'set-a-baseline-height'))
  await bounds(baseline, { h: 80 }, 'target', 0)
  await bounds(baseline, { h: 104 }, 'target', 1)
  const demo = example(page, 'min-height', 'build-viewport-sections'), view = await ready(demo)
  await expect(demo.locator('iframe')).toHaveAttribute('data-sizing', 'viewport')
  expect(await demo.locator('iframe').evaluate(e => e.clientHeight)).toBe(320)
  await bounds(view, { h: 320 })
  const content = await ready(example(page, 'min-height', 'let-content-define-the-final-size'))
  await bounds(content, { h: 80 }, 'target', 0)
  await bounds(content, { h: 104 }, 'target', 1)
  expect(await content.locator(id('target', 0)).evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true)
  await condition(page, 'min-height', { h: 64 }, { h: 112 })
})

test('minimum size preserves floors, named targets and logical percentage references', async ({ page }) => {
  await page.goto('/en/reference/min-size')
  const control = await ready(example(page, 'min-size', 'set-minimum-width-and-height-together'))
  await bounds(control, { w: 40, h: 40 })
  await expect(control.getByRole('button', { name: 'Add layer' })).toHaveCount(1)
  const touch = await ready(example(page, 'min-size', 'preserve-touch-targets'))
  const short = await box(touch, 'target', 0), long = await box(touch, 'target', 1)
  expect(short.w).toBeGreaterThanOrEqual(44)
  expect(short.h).toBeGreaterThanOrEqual(44)
  expect(long.w).toBeGreaterThan(short.w)
  await expect(touch.getByRole('button', { name: 'Save all changes' })).toHaveCount(1)
  const axes = await ready(example(page, 'min-size', 'set-one-logical-axis'))
  await bounds(axes, { w: 120, h: 64 }, 'target', 0)
  await bounds(axes, { w: 64, h: 120 }, 'target', 1)
  const percent = await ready(example(page, 'min-size', 'use-percentages-with-care'))
  await bounds(percent, { w: 120, h: 80 }, 'target', 0)
  await bounds(percent, { w: 120, h: 32 }, 'target', 1)
  await condition(page, 'min-size', { w: 48, h: 48 }, { w: 80, h: 80 })
})

test('maximum width caps preferred sizes without forcing growth or upscaling media', async ({ page }) => {
  await page.goto('/en/reference/max-width')
  const caps = await ready(example(page, 'max-width', 'cap-a-fluid-element'))
  await bounds(caps, { w: 192, x: 44 }, 'target', 0)
  await bounds(caps, { w: 80, x: 100 }, 'target', 1)
  const measure = await ready(example(page, 'max-width', 'set-a-readable-measure'))
  const zeroWidth = await measure.locator('#target').evaluate(element => {
    const context = element.ownerDocument.createElement('canvas').getContext('2d')!
    context.font = getComputedStyle(element).font
    return context.measureText('0').width
  })
  await bounds(measure, { w: zeroWidth * 24 })
  const image = await ready(example(page, 'max-width', 'keep-media-responsive'))
  await bounds(image, { w: 240, h: 150 })
  await image.locator('#layout').evaluate(element => (element as HTMLElement).style.width = '500px')
  await bounds(image, { w: 320, h: 200 })
  const demo = example(page, 'max-width', 'use-viewport-and-container-caps'), view = await ready(demo)
  await viewport(demo, 360)
  await bounds(view, { w: 360 }, 'target', 0)
  await bounds(view, { w: 240 }, 'target', 1)
  await viewport(demo, 600)
  await expect.poll(() => box(view, 'target', 0)).toMatchObject({ w: 600 })
  await bounds(view, { w: 240 }, 'target', 1)
  await condition(page, 'max-width', { w: 160 }, { w: 240 })
})

test('maximum height keeps capped content reachable and separates fitting from box size', async ({ page }) => {
  await page.goto('/en/reference/max-height')
  const region = await ready(example(page, 'max-height', 'cap-a-vertical-region'))
  await bounds(region, { h: 96 })
  await bounds(region, { h: 144 }, 'item-3')
  await scroll(page, region, 'Layer notes')
  const media = await ready(example(page, 'max-height', 'keep-media-inside-a-frame'))
  for (const index of [0, 1]) await bounds(media, { w: 240, h: 96 }, 'target', index)
  await expect(media.locator(id('target', 0))).toHaveCSS('object-fit', 'contain')
  await expect(media.locator(id('target', 1))).toHaveCSS('object-fit', 'cover')
  const demo = example(page, 'max-height', 'use-viewport-caps'), view = await ready(demo)
  await expect(demo.locator('iframe')).toHaveAttribute('data-sizing', 'viewport')
  await bounds(view, { h: 160 })
  await bounds(view, { h: 280 }, 'item-3')
  await scroll(page, view, 'Viewport-capped notes')
  await condition(page, 'max-height', { h: 80 }, { h: 128 })
})

test('maximum size distinguishes paired bounds from a forced square', async ({ page }) => {
  await page.goto('/en/reference/max-size')
  await bounds(await ready(example(page, 'max-size', 'cap-width-and-height-together')), { w: 96, h: 60 })
  await bounds(await ready(example(page, 'max-size', 'keep-square-media-bounded')), { w: 160, h: 160 })
  const axes = await ready(example(page, 'max-size', 'cap-one-logical-axis'))
  await bounds(axes, { w: 120, h: 64 }, 'target', 0)
  await bounds(axes, { w: 64, h: 120 }, 'target', 1)
  await bounds(await ready(example(page, 'max-size', 'use-one-axis-caps-for-layout')), { w: 160, h: 120 })
  await condition(page, 'max-size', { w: 64, h: 64 }, { w: 96, h: 96 })
})

test('aspect ratio derives automatic dimensions while two definite dimensions prevail', async ({ page }) => {
  await page.goto('/en/reference/aspect-ratio')
  await bounds(await ready(example(page, 'aspect-ratio', 'set-a-custom-ratio')), { w: 240, h: 180 })
  const shortcuts = await ready(example(page, 'aspect-ratio', 'use-square-and-video-shortcuts'))
  await bounds(shortcuts, { w: 160, h: 160 }, 'target', 0)
  await bounds(shortcuts, { w: 160, h: 90 }, 'target', 1)
  const preferred = await ready(example(page, 'aspect-ratio', 'pair-with-one-explicit-axis'))
  await bounds(preferred, { w: 240, h: 135 }, 'target', 0)
  await bounds(preferred, { w: 240, h: 80 }, 'target', 1)
  const video = await ready(example(page, 'aspect-ratio', 'use-the-video-shortcut'))
  await bounds(video, { w: 240, h: 135 })
  await bounds(video, { w: 240, h: 135 }, 'peer')
  await expect(video.locator('#target')).toHaveCSS('margin', '0px')
  const control = await ready(example(page, 'aspect-ratio', 'choose-size-for-fixed-squares'))
  await bounds(control, { w: 40, h: 40 })
  await expect(control.getByRole('button', { name: 'Add layer' })).toHaveCount(1)
  await condition(page, 'aspect-ratio', { w: 240, h: 240 }, { w: 240, h: 180 })
})

test('gap uses actual grid tracks and flex children with no outside gap', async ({ page }) => {
  await page.goto('/en/reference/gap')
  const equal = await ready(example(page, 'gap', 'add-the-same-gap-on-both-axes'))
  await bounds(equal, { x: 0, y: 0, w: 248 / 3, h: 48 })
  await bounds(equal, { y: 64 }, 'item-4')
  const separate = await ready(example(page, 'gap', 'set-row-and-column-gaps-separately'))
  for (const index of [0, 1]) {
    await bounds(separate, { x: 0, y: 0, w: 256 / 3 }, 'target', index)
    await bounds(separate, { y: 72 }, 'item-4', index)
    await expect(separate.locator(id('layout', index))).toHaveCSS('gap', '24px 12px')
  }
  const flex = await ready(example(page, 'gap', 'use-gap-for-component-internals'))
  await expect(flex.locator('#layout')).toHaveCSS('display', 'flex')
  await bounds(flex, { w: 32, h: 32, x: 0 })
  const avatar = await box(flex), label = await box(flex, 'peer')
  expect(label.x).toBe(44)
  expect(label.y + label.h / 2).toBeCloseTo(avatar.y + avatar.h / 2, 1)
  const demo = example(page, 'gap', 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 360)
  await bounds(frame, { w: 88, h: 48 })
  await viewport(demo, 900)
  await expect(frame.locator('#layout')).toHaveCSS('gap', '24px')
  await bounds(frame, { w: 232 / 3 })
})

test('margin demonstrates external size, actual sibling collapse and logical directions', async ({ page }) => {
  await page.goto('/en/reference/margin')
  const all = await ready(example(page, 'margin', 'add-margin-on-every-side'))
  await bounds(all, { w: 160, h: 64, x: 16, y: 16 })
  await bounds(all, { h: 96 }, 'layout')
  const sides = await ready(example(page, 'margin', 'set-one-side'))
  await bounds(sides, { x: 16, y: 0, h: 48 })
  await bounds(sides, { x: 0, y: 72 }, 'peer')
  const axes = await ready(example(page, 'margin', 'set-horizontal-or-vertical-margins'))
  await bounds(axes, { x: 60, y: 12, w: 160, h: 64 }, 'target', 0)
  await bounds(axes, { x: 84, y: 16, w: 64, h: 96 }, 'target', 1)
  const internals = await ready(example(page, 'margin', 'avoid-margin-for-internal-spacing'))
  await bounds(internals, { x: 16, y: 16 })
  const first = await box(internals), second = await box(internals, 'peer')
  expect(second.x - first.x - first.w).toBeCloseTo(12, 1)
  await expect(internals.locator('#target')).toHaveCSS('margin', '0px')
  const { frame } = await condition(page, 'margin', { w: 160, h: 64 }, { w: 160, h: 64 })
  await bounds(frame, { x: 16, y: 16 })
})

test('padding measures content insets, physical sides and logical writing directions', async ({ page }) => {
  await page.goto('/en/reference/padding')
  const quick = await ready(example(page, 'padding', 'quick-answer'))
  await bounds(quick, { w: 64, h: 52 })
  await expect(quick.getByRole('button', { name: 'Save' })).toHaveCount(1)
  const multiple = await ready(example(page, 'padding', 'multiple-values'))
  await bounds(multiple, { w: 168, h: 80 }, 'target', 0)
  await bounds(multiple, { x: 24, y: 16 }, 'item-3', 0)
  await bounds(multiple, { w: 136, h: 48 }, 'target', 1)
  await bounds(multiple, { x: 16, y: 0 }, 'item-3', 1)
  await bounds(multiple, { w: 136, h: 48 }, 'target', 2)
  await bounds(multiple, { x: 0, y: 0 }, 'item-3', 2)
  const all = await ready(example(page, 'padding', 'add-padding-on-every-side'))
  await bounds(all, { w: 192, h: 80 })
  await bounds(all, { w: 160, h: 48, x: 16, y: 16 }, 'item-3')
  const sides = await ready(example(page, 'padding', 'set-one-side'))
  await bounds(sides, { w: 148, h: 104 })
  await bounds(sides, { x: 12, y: 24 }, 'item-3')
  const logical = await ready(example(page, 'padding', 'set-inline-or-block-padding'))
  await bounds(logical, { w: 152, h: 72 }, 'target', 0)
  await bounds(logical, { x: 16, y: 12 }, 'item-3', 0)
  await bounds(logical, { w: 144, h: 80 }, 'target', 1)
  await bounds(logical, { x: 12, y: 16 }, 'item-3', 1)
  const { frame } = await condition(page, 'padding', { w: 192, h: 80 }, { w: 160, h: 48 })
  await bounds(frame, { x: 0, y: 0 }, 'item-3')
  await expect(page.locator('#set-horizontal-or-vertical-padding')).toHaveCount(1)
})

for (const route of routes) {
  test(`sizing composition: ${route}`, async ({ page }, testInfo) => {
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
