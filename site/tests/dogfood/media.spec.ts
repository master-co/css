import { expect, test, type FrameLocator, type Locator, type Page } from '@playwright/test'

const routes = ['object-fit', 'object-position', 'fill', 'stroke', 'stroke-width']
const example = (page: Page, route: string, section: string) => page.locator(`[data-demo-case="${route}#${section}"]`)
const target = (frame: FrameLocator, index?: number) => frame.locator(`#${index === undefined ? '' : `example-${index}-`}target`)
async function ready(demo: Locator) {
  await demo.scrollIntoViewIfNeeded()
  await expect(demo.locator('iframe')).toHaveAttribute('data-ready', 'true')
  for (const legend of await demo.locator('legend.sr-only').all()) await expect(legend).toHaveCSS('position', 'absolute')
  await demo.locator('iframe').evaluate(async (element: HTMLIFrameElement) => { await element.contentDocument!.fonts.ready; await Promise.all(Array.from(element.contentDocument!.images).map(image => image.decode())) })
  return demo.frameLocator('iframe')
}
async function scene(page: Page, route: string, section: string) { return ready(example(page, route, section)) }
async function keyboard(page: Page, item: Locator) {
  await item.focus(); await page.keyboard.press('ArrowRight'); await expect(item).toBeFocused()
  expect(await item.evaluate(e => e.matches(':focus-visible'))).toBe(true)
}
async function size(item: Locator) { return item.evaluate(e => { const { width, height } = e.getBoundingClientRect(); return { width, height } }) }
async function viewport(demo: Locator, width: number) {
  await demo.getByLabel('Viewport', { exact: true }).fill(String(width))
  await expect.poll(() => demo.locator('iframe').evaluate(e => e.clientWidth)).toBe(width)
}
async function print(page: Page, browserName: string, item: Locator, property: string, value: string) {
  if (browserName === 'chromium') {
    await page.emulateMedia({ media: 'print' }); await expect(item).toHaveCSS(property, value)
    await page.emulateMedia({ media: 'screen' })
  }
}
async function pixels(page: Page, item: Locator, points: number[][]) {
  const encoded = (await item.screenshot({ scale: 'css' })).toString('base64')
  return page.evaluate(async ({ encoded, points }) => {
    const image = new Image(); image.src = `data:image/png;base64,${encoded}`; await image.decode()
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height
    const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0)
    return points.map(([x, y]) => Array.from(context.getImageData(x, y, 1, 1).data).slice(0, 3))
  }, { encoded, points })
}
async function condition(page: Page, route: string) {
  const demo = example(page, route, 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 390)
  return { demo, item: target(frame) }
}
async function yellowBounds(page: Page, item: Locator) {
  const box = await size(item), width = Math.round(box.width), height = Math.round(box.height)
  const colors = await pixels(page, item, Array.from({ length: width * height }, (_, index) => [index % width, Math.floor(index / width)]))
  const xs: number[] = [], ys: number[] = []
  colors.forEach(([r, g, b], index) => { if (r > 180 && g > 100 && b < 100) { xs.push(index % width); ys.push(Math.floor(index / width)) } })
  expect(xs.length).toBeGreaterThan(0)
  return { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs) + 1, height: Math.max(...ys) - Math.min(...ys) + 1 }
}
async function thickness(page: Page, item: Locator) {
  const stroke = await item.evaluate(e => getComputedStyle(e).stroke)
  const foreground = await page.evaluate(color => {
    const canvas = document.createElement('canvas'), context = canvas.getContext('2d')!
    context.fillStyle = color; context.fillRect(0, 0, 1, 1)
    const [r, , b] = context.getImageData(0, 0, 1, 1).data
    return b - r
  }, stroke)
  const contrasts = (await pixels(page, item, Array.from({ length: 96 }, (_, y) => [48, y]))).map(([r, , b]) => b - r)
  const background = contrasts[0]
  // Integrate paint coverage so antialiased edges count by alpha, not as whole rows.
  return contrasts.reduce((sum, color) => sum + Math.max(0, Math.min(1, (color - background) / (foreground - background))), 0)
}

test('image fitting preserves the authored box and visibly scales or crops its source', async ({ page, browserName }) => {
  await page.goto('/en/reference/object-fit')
  const fixed = await scene(page, 'object-fit', 'cover-a-fixed-frame')
  for (const i of [0, 1]) {
    const item = target(fixed, i)
    await expect(item).toHaveAccessibleName('Blue and violet mountains beneath a yellow sun')
    expect(await item.evaluate((e: HTMLImageElement) => [e.naturalWidth, e.naturalHeight])).toEqual([320, 200])
    expect(await size(item)).toEqual({ width: 220, height: 220 })
  }
  await expect(target(fixed, 0)).toHaveCSS('object-fit', 'cover'); await expect(target(fixed, 1)).toHaveCSS('object-fit', 'fill')
  const circle = await yellowBounds(page, target(fixed, 0)), ellipse = await yellowBounds(page, target(fixed, 1))
  expect(Math.abs(circle.width - circle.height)).toBeLessThanOrEqual(2); expect(ellipse.width / ellipse.height).toBeLessThan(.7)
  const contained = await scene(page, 'object-fit', 'contain-the-full-media')
  await expect(target(contained, 0)).toHaveCSS('object-fit', 'contain')
  const bands = await pixels(page, target(contained, 0), [[10, 5], [10, 45], [10, 215]])
  expect(bands[0]).toEqual(bands[2]); expect(bands[0]).not.toEqual(bands[1])
  const intrinsic = await scene(page, 'object-fit', 'disable-object-fitting')
  await expect(target(intrinsic, 0)).toHaveCSS('object-fit', 'none'); await expect(target(intrinsic, 1)).toHaveCSS('object-fit', 'scale-down')
  const natural = await yellowBounds(page, target(intrinsic, 0)), smaller = await yellowBounds(page, target(intrinsic, 1))
  expect(natural.width).toBeGreaterThan(smaller.width); expect(natural.height).toBeGreaterThan(smaller.height)
  const { demo, item } = await condition(page, 'object-fit')
  await expect(item).toHaveCSS('object-fit', 'cover'); await viewport(demo, 900)
  await expect(item).toHaveCSS('object-fit', 'contain'); expect(await size(item)).toEqual({ width: 220, height: 220 })
  await print(page, browserName, item, 'object-fit', 'contain')
})

test('image position changes actual source crop and edge offsets without changing the box', async ({ page, browserName }) => {
  await page.goto('/en/reference/object-position')
  const centered = await scene(page, 'object-position', 'center-cropped-media')
  await expect(target(centered, 0)).toHaveCSS('object-position', '50% 50%')
  const center = await yellowBounds(page, target(centered, 0)), top = await yellowBounds(page, target(centered, 1))
  expect(top.y).toBeGreaterThan(center.y + 20)
  const edges = await scene(page, 'object-position', 'pin-the-top-of-an-image')
  await expect(target(edges, 1)).toHaveCSS('object-position', '50% 100%')
  expect((await yellowBounds(page, target(edges, 1))).height).toBeLessThan(top.height)
  const precise = await scene(page, 'object-position', 'use-precise-positions')
  const quarter = await yellowBounds(page, target(precise, 0)), offset = await yellowBounds(page, target(precise, 1))
  await expect(target(precise, 0)).toHaveCSS('object-position', '50% 25%')
  // CSS-pixel captures round fractional element positions and antialiased source edges.
  expect(Math.abs(top.y - quarter.y - 12.5)).toBeLessThanOrEqual(1.5)
  expect(Math.abs(offset.x - quarter.x - 12)).toBeLessThanOrEqual(1)
  expect(Math.abs(offset.y - top.y - 8)).toBeLessThanOrEqual(1)
  for (const i of [0, 1]) expect(await size(target(precise, i))).toEqual({ width: 240, height: 100 })
  const { demo, item } = await condition(page, 'object-position')
  await expect(item).toHaveCSS('object-position', '50% 50%'); await viewport(demo, 900)
  await expect(item).toHaveCSS('object-position', '50% 0%'); await print(page, browserName, item, 'object-position', '50% 50%')
})

for (const paint of ['fill', 'stroke']) {
  test(`${paint} preserves native paths, theme paint and named keyboard controls`, async ({ page, browserName }) => {
    await page.goto(`/en/reference/${paint}`)
    const base = await scene(page, paint, `set-svg-${paint}-color`)
    await expect(target(base, 0)).toHaveAccessibleName('Triangle')
    await expect(target(base, 0).locator('path')).toHaveCount(1)
    await expect(target(base, 1)).toHaveCSS(paint, 'none')
    if (paint === 'fill') {
      await expect(target(base, 2)).toHaveCSS('fill', /rgba\(0, 0, 0, 0\)/)
      const solid = await pixels(page, target(base, 0), [[48, 60]]), empty = await pixels(page, target(base, 1), [[48, 60]])
      expect(solid).not.toEqual(empty); expect(await pixels(page, target(base, 2), [[48, 60]])).toEqual(empty)
    }
    const demo = example(page, paint, 'use-theme-colors'), themed = await ready(demo)
    const dynamic = target(themed, 0), fixed = target(themed, 1)
    const dynamicBefore = await dynamic.evaluate((e, property) => getComputedStyle(e).getPropertyValue(property), paint)
    const fixedBefore = await fixed.evaluate((e, property) => getComputedStyle(e).getPropertyValue(property), paint)
    await demo.getByRole('button', { name: 'Theme', exact: true }).click()
    await expect.poll(() => dynamic.evaluate((e, property) => getComputedStyle(e).getPropertyValue(property), paint)).not.toBe(dynamicBefore)
    await expect(fixed).toHaveCSS(paint, fixedBefore)
    const interactive = await scene(page, paint, 'apply-conditionally'), button = target(interactive)
    await expect(button).toHaveAccessibleName(paint === 'fill' ? 'Save palette' : 'Open layers')
    await expect(button.locator('svg')).toHaveAttribute('aria-hidden', 'true')
    const initial = await button.evaluate((e, property) => getComputedStyle(e).getPropertyValue(property), paint)
    await keyboard(page, button)
    await expect.poll(() => button.evaluate((e, property) => getComputedStyle(e).getPropertyValue(property), paint)).not.toBe(initial)
    const active = await button.evaluate((e, property) => getComputedStyle(e).getPropertyValue(property), paint)
    await expect(button.locator('path')).toHaveCSS(paint, active)
    if (browserName === 'chromium') {
      await page.emulateMedia({ media: 'print' }); await expect(button).toHaveCSS(paint, initial)
      await page.emulateMedia({ media: 'screen' }); await expect(button).toHaveCSS(paint, active)
    }
    await button.evaluate(e => (e as HTMLElement).blur()); await page.mouse.move(0, 0)
    if (browserName === 'chromium') { await button.hover(); await expect(button).toHaveCSS(paint, active) }
  })
}

test('SVG stroke widths scale through the viewBox while a path vector effect preserves screen thickness', async ({ page, browserName }) => {
  await page.goto('/en/reference/stroke-width')
  const widths = await scene(page, 'stroke-width', 'set-svg-stroke-width')
  for (const i of [0, 1]) expect(await size(target(widths, i))).toEqual({ width: 96, height: 96 })
  await expect(target(widths, 0)).toHaveCSS('stroke-width', '1px'); await expect(target(widths, 1)).toHaveCSS('stroke-width', '2px')
  expect(await thickness(page, target(widths, 0))).toBeCloseTo(4, 1); expect(await thickness(page, target(widths, 1))).toBeCloseTo(8, 1)
  const effect = await scene(page, 'stroke-width', 'pair-width-with-stroke-color')
  const normal = await thickness(page, target(effect, 0)), stable = await thickness(page, target(effect, 1))
  expect(normal).toBeCloseTo(6, 1); expect(stable).toBeCloseTo(1.5, 1)
  await expect(target(effect, 1).locator('path')).toHaveCSS('vector-effect', 'non-scaling-stroke')
  const { demo, item } = await condition(page, 'stroke-width')
  await expect(item).toHaveCSS('stroke-width', '1px'); await viewport(demo, 900)
  await expect(item).toHaveCSS('stroke-width', '2px'); expect(await thickness(page, item)).toBeCloseTo(8, 1)
  await print(page, browserName, item, 'stroke-width', '1px')
})

for (const route of routes) {
  test(`media composition: ${route}`, async ({ page }, testInfo) => {
    const failures: string[] = []
    page.on('pageerror', error => failures.push(error.message))
    page.on('console', message => { if (message.type() === 'error' && /hydration|hydrate|mismatch/i.test(message.text())) failures.push(message.text()) })
    await page.goto(`/en/reference/${route}`)
    await page.addStyleTag({ content: 'nextjs-portal { visibility: hidden }' })
    for (const [index, demo] of (await page.locator('[data-demo-case]').all()).entries()) {
      const frame = await ready(demo)
      const dark = await page.locator('html').evaluate(e => e.classList.contains('dark'))
      await expect(frame.locator('html')).toHaveAttribute('class', dark ? 'dark' : 'light')
      expect(await frame.locator('body').evaluate(e => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1)
      for (const item of await frame.locator('[data-target]').all()) await expect(item).toHaveAttribute('data-appearance', 'plain')
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
