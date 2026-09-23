import { expect, test, type FrameLocator, type Locator, type Page } from '@playwright/test'

const routes = ['filter', 'backdrop-filter', 'clip-path', 'mask-image', 'mix-blend-mode', 'opacity']
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
async function hit(item: Locator, x: number, y: number) {
  return item.evaluate((e, { x, y }) => { const box = e.getBoundingClientRect(); const found = e.ownerDocument.elementFromPoint(box.x + x, box.y + y); return found === e || e.contains(found) }, { x, y })
}
function distance(a: number[], b: number[]) { return Math.max(...a.map((value, i) => Math.abs(value - b[i]))) }

test('filters preserve layout, follow transparent silhouettes and respond to native focus and print', async ({ page, browserName }) => {
  await page.goto('/en/reference/filter')
  const base = await scene(page, 'filter', 'apply-filter-functions')
  for (const i of [0, 1]) expect(await size(target(base, i))).toEqual({ width: 220, height: 137.5 })
  await expect(target(base, 1)).toHaveCSS('filter', 'blur(4px) brightness(0.8)')
  const clean = await pixels(page, target(base, 0), [[20, 10]])
  const dim = await pixels(page, target(base, 1), [[20, 10]])
  for (let i = 0; i < 3; i++) expect(Math.abs(dim[0][i] - clean[0][i] * .8)).toBeLessThanOrEqual(2)
  const shadows = await scene(page, 'filter', 'use-drop-shadow-for-transparent-images')
  const drop = target(shadows, 0), box = target(shadows, 1)
  await expect(drop).toHaveAccessibleName('Circle and diamond')
  await expect(drop).toHaveCSS('filter', /drop-shadow/); await expect(box).toHaveCSS('filter', 'none')
  // The SVG ends 152px below its surface top; only a box shadow paints this empty corner.
  const alphaPaint = await pixels(page, drop.locator('..'), [[34, 154], [10, 10]])
  const boxPaint = await pixels(page, box.locator('..'), [[34, 154], [10, 10]])
  expect(distance(alphaPaint[0], alphaPaint[1])).toBeLessThanOrEqual(1)
  expect(distance(boxPaint[0], boxPaint[1])).toBeGreaterThan(10)
  const reset = await scene(page, 'filter', 'reset-filters')
  await print(page, browserName, target(reset), 'filter', 'none')
  const interactive = await scene(page, 'filter', 'apply-conditionally'), button = target(interactive)
  await expect(button).toHaveAccessibleName('Preview artwork'); await expect(button).toHaveCSS('filter', 'grayscale(1)')
  await keyboard(page, button); await expect(button).toHaveCSS('filter', 'none')
  await expect(button).toHaveCSS('outline-style', 'solid')
  await print(page, browserName, button, 'filter', 'none')
  await button.evaluate(e => (e as HTMLElement).blur()); await page.mouse.move(0, 0)
  await expect(button).toHaveCSS('filter', 'grayscale(1)')
  if (browserName === 'chromium') { await button.hover(); await expect(button).toHaveCSS('filter', 'none') }
})

test('backdrop filters change background pixels independently of foreground paint and panel alpha', async ({ page, browserName }, testInfo) => {
  await page.goto('/en/reference/backdrop-filter')
  const base = await scene(page, 'backdrop-filter', 'blur-content-behind-an-element')
  await expect(target(base, 0)).toHaveCSS('backdrop-filter', 'none')
  await expect(target(base, 1)).toHaveCSS('backdrop-filter', 'blur(8px)')
  expect(await size(target(base, 0))).toEqual(await size(target(base, 1)))
  const sample = [[12, 44], [24, 64], [130, 24], [170, 20], [180, 80]]
  const clear = await pixels(page, target(base, 0), sample), blurred = await pixels(page, target(base, 1), sample)
  if (browserName === 'chromium') expect(Math.max(...clear.map((color, i) => distance(color, blurred[i])))).toBeGreaterThan(5)
  else testInfo.annotations.push({ type: 'platform limitation', description: 'This headless mobile WebKit does not paint backdrop filters, including in an independent native HTML probe. Computed declarations, geometry and fallback readability remain checked; Chromium verifies actual filtering pixels.' })
  for (const i of [0, 1]) await expect(target(base, i)).toHaveCSS('filter', 'none')
  const alpha = await scene(page, 'backdrop-filter', 'combine-with-translucent-backgrounds')
  for (const i of [0, 1]) await expect(target(alpha, i)).toHaveCSS('backdrop-filter', 'saturate(0)')
  const translucent = await pixels(page, target(alpha, 0), [[12, 12], [180, 104]])
  const opaque = await pixels(page, target(alpha, 1), [[12, 12], [180, 104]])
  expect(distance(opaque[0], opaque[1])).toBeLessThanOrEqual(1)
  expect(distance(translucent[0], translucent[1])).toBeGreaterThan(10)
  const reset = await scene(page, 'backdrop-filter', 'reset-backdrop-filters')
  await print(page, browserName, target(reset), 'backdrop-filter', 'none')
  const { demo, item } = await condition(page, 'backdrop-filter')
  await expect(item).toHaveCSS('backdrop-filter', 'none'); await viewport(demo, 900)
  await expect(item).toHaveCSS('backdrop-filter', 'blur(8px)'); await print(page, browserName, item, 'backdrop-filter', 'none')
})

test('clipping preserves layout while removing native paint and pointer hit regions', async ({ page, browserName }) => {
  await page.goto('/en/reference/clip-path')
  const circle = await scene(page, 'clip-path', 'clip-to-a-circle')
  for (const i of [0, 1]) expect(await size(target(circle, i))).toEqual({ width: 160, height: 160 })
  expect(await hit(target(circle, 0), 5, 5)).toBe(true)
  expect(await hit(target(circle, 1), 5, 5)).toBe(false); expect(await hit(target(circle, 1), 80, 80)).toBe(true)
  await expect(target(circle, 1)).toHaveCSS('clip-path', 'circle(60px)')
  const panels = await scene(page, 'clip-path', 'clip-with-an-inset')
  expect(await size(target(panels, 0))).toEqual(await size(target(panels, 1)))
  expect(await hit(target(panels, 1), 10, 60)).toBe(false); expect(await hit(target(panels, 1), 40, 60)).toBe(true)
  const border = await pixels(page, target(panels, 0), [[1, 60]]), removed = await pixels(page, target(panels, 1), [[1, 60]])
  expect(distance(border[0], removed[0])).toBeGreaterThan(20)
  const restored = example(page, 'clip-path', 'remove-clipping'), restoredFrame = await ready(restored)
  await viewport(restored, 390); await expect(target(restoredFrame)).toHaveCSS('clip-path', 'circle(60px)')
  await viewport(restored, 900); await expect(target(restoredFrame)).toHaveCSS('clip-path', 'none')
  await print(page, browserName, target(restoredFrame), 'clip-path', 'none')
  const { demo, item } = await condition(page, 'clip-path')
  await expect(item).toHaveCSS('clip-path', 'none'); await viewport(demo, 900)
  await expect(item).toHaveCSS('clip-path', 'inset(8px 24px round 12px)'); await print(page, browserName, item, 'clip-path', 'none')
})

test('alpha masks fade real pixels without removing CSS-box hit testing or native scroll access', async ({ page, browserName }) => {
  await page.goto('/en/reference/mask-image')
  const base = await scene(page, 'mask-image', 'apply-a-mask-image')
  for (const i of [0, 1]) expect(await size(target(base, i))).toEqual({ width: 240, height: 150 })
  await expect(target(base, 1)).toHaveCSS('mask-mode', 'alpha')
  const sample = [[120, 5], [120, 140]]
  const clean = await pixels(page, target(base, 0), sample), faded = await pixels(page, target(base, 1), sample)
  expect(distance(clean[0], faded[0])).toBeLessThan(15)
  expect(distance(clean[1], faded[1])).toBeGreaterThan(40)
  expect(await hit(target(base, 1), 120, 149)).toBe(true)
  const scroll = await scene(page, 'mask-image', 'fade-overflowing-media'), region = target(scroll)
  await expect(region).toHaveAccessibleName('Layer list')
  await expect(region).toHaveAccessibleDescription('Eight layers. Scroll or follow the links below.')
  expect(await region.evaluate(e => e.scrollHeight)).toBeGreaterThan(160)
  await keyboard(page, region)
  await expect(region.locator('..')).toHaveCSS('outline-style', 'solid')
  await expect(region.locator('..')).toHaveCSS('outline-width', '2px')
  if (browserName === 'chromium') {
    await page.keyboard.press('ArrowDown')
    await expect.poll(() => region.evaluate(e => e.scrollTop)).toBeGreaterThan(0)
    // Let the native key-scroll finish before a fragment navigation starts.
    await region.evaluate(e => new Promise<void>(resolve => {
      let previous = e.scrollTop, stableSince = performance.now()
      const observe = () => {
        if (e.scrollTop !== previous) { previous = e.scrollTop; stableSince = performance.now() }
        if (performance.now() - stableSince >= 100) resolve()
        else requestAnimationFrame(observe)
      }
      requestAnimationFrame(observe)
    }))
  }
  const last = scroll.getByRole('link', { name: 'Last layer', exact: true })
  await keyboard(page, last); await page.keyboard.press('Enter')
  await expect.poll(() => region.evaluate(e => e.scrollTop)).toBeGreaterThan(100)
  expect(await region.evaluate(e => (() => { const range = e.ownerDocument.createRange(); range.selectNodeContents(e.querySelector('#last-layer')!); return range.getBoundingClientRect().bottom - e.getBoundingClientRect().top })())).toBeLessThanOrEqual(96)
  const first = scroll.getByRole('link', { name: 'First layer', exact: true })
  await keyboard(page, first); await page.keyboard.press('Enter')
  await expect.poll(() => region.evaluate(e => e.scrollTop)).toBe(0)
  const { demo, item } = await condition(page, 'mask-image')
  await expect(item).toHaveCSS('mask-image', 'none'); await viewport(demo, 900)
  await expect(item).toHaveCSS('mask-image', /linear-gradient/); await print(page, browserName, item, 'mask-image', 'none')
})

test('isolated mix blending combines the real foreground with both authored backdrops', async ({ page, browserName }) => {
  await page.goto('/en/reference/mix-blend-mode')
  const base = await scene(page, 'mix-blend-mode', 'blend-an-element-with-its-backdrop')
  for (const i of [0, 1]) {
    await expect(target(base, i)).toHaveAccessibleName('Blue foreground across two backdrops')
    expect(await size(target(base, i))).toEqual({ width: 96, height: 96 })
    await expect(target(base, i).locator('..')).toHaveCSS('isolation', 'isolate')
  }
  const normal = await pixels(page, target(base, 0), [[20, 48], [76, 48]])
  expect(normal).toEqual([[37, 99, 235], [37, 99, 235]])
  const multiply = await pixels(page, target(base, 1), [[20, 48], [76, 48]])
  for (const [i, background] of [[226, 232, 240], [196, 181, 253]].entries()) {
    for (let channel = 0; channel < 3; channel++) expect(Math.abs(multiply[i][channel] - Math.round(normal[i][channel] * background[channel] / 255))).toBeLessThanOrEqual(1)
  }
  const reset = await scene(page, 'mix-blend-mode', 'restore-normal-blending')
  await print(page, browserName, target(reset), 'mix-blend-mode', 'normal')
  const { demo, item } = await condition(page, 'mix-blend-mode')
  await expect(item).toHaveCSS('mix-blend-mode', 'normal'); await viewport(demo, 900)
  await expect(item).toHaveCSS('mix-blend-mode', 'multiply'); await print(page, browserName, item, 'mix-blend-mode', 'normal')
})

test('opacity preserves native disclosure and checkbox interaction while background alpha leaves text opaque', async ({ page, browserName }) => {
  await page.goto('/en/reference/opacity')
  const base = await scene(page, 'opacity', 'fade-an-entire-element')
  for (const i of [0, 1]) {
    const summary = target(base, i)
    await expect(summary).toHaveAccessibleName('Preview details'); await keyboard(page, summary)
    await page.keyboard.press('Enter'); await expect(summary.locator('..')).toHaveAttribute('open', '')
    await page.keyboard.press('Space'); await expect(summary.locator('..')).not.toHaveAttribute('open', '')
  }
  await expect(target(base, 1)).toHaveCSS('opacity', '0.5')
  const alpha = await scene(page, 'opacity', 'prefer-color-alpha-for-surfaces')
  await expect(target(alpha, 0)).toHaveCSS('opacity', '0.5'); await expect(target(alpha, 1)).toHaveCSS('opacity', '1')
  const background = await pixels(page, target(alpha, 0), [[8, 8]]), colorAlpha = await pixels(page, target(alpha, 1), [[8, 8]])
  expect(distance(background[0], colorAlpha[0])).toBeLessThanOrEqual(1)
  expect(await target(alpha, 1).evaluate(e => {
    const context = e.ownerDocument.createElement('canvas').getContext('2d')!
    context.fillStyle = getComputedStyle(e).color; context.fillRect(0, 0, 1, 1)
    return Array.from(context.getImageData(0, 0, 1, 1).data)
  })).toEqual([0, 0, 0, 255])
  const linear = colorAlpha[0].map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
  const luminance = linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722
  expect((luminance + .05) / .05).toBeGreaterThanOrEqual(4.5)
  const interactive = await scene(page, 'opacity', 'apply-conditionally'), label = target(interactive), checkbox = label.getByRole('checkbox', { name: 'Show preview' })
  await expect(label).toHaveCSS('opacity', '1'); await keyboard(page, checkbox)
  await expect(label).toHaveCSS('opacity', '0.72'); await page.keyboard.press('Space'); await expect(checkbox).toBeChecked()
  await page.keyboard.press('Space'); await expect(checkbox).not.toBeChecked()
  await print(page, browserName, label, 'opacity', '1')
  await checkbox.evaluate(e => (e as HTMLElement).blur()); await page.mouse.move(0, 0)
  await expect(label).toHaveCSS('opacity', '1')
  if (browserName === 'chromium') { await label.hover(); await expect(label).toHaveCSS('opacity', '0.72') }
})

for (const route of routes) {
  test(`effects composition: ${route}`, async ({ page }, testInfo) => {
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
