import { expect, test, type FrameLocator, type Locator, type Page } from '@playwright/test'

const routes = ['transform', 'transform-origin', 'transform-box', 'transform-style', 'will-change']
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
async function condition(page: Page, route: string) {
  const demo = example(page, route, 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 390)
  return { demo, item: target(frame) }
}
async function relative(item: Locator) {
  return item.evaluate(e => {
    const box = e.getBoundingClientRect(), parent = e.parentElement!.getBoundingClientRect()
    return { x: box.x - parent.x, y: box.y - parent.y, width: box.width, height: box.height }
  })
}
async function matrix(item: Locator) {
  return item.evaluate(e => { const value = new DOMMatrixReadOnly(getComputedStyle(e).transform); return { a: value.a, b: value.b, c: value.c, d: value.d, x: value.e, y: value.f } })
}
async function original(item: Locator) {
  expect(await item.evaluate(e => [(e as HTMLElement).offsetWidth, (e as HTMLElement).offsetHeight])).toEqual([160, 96])
  expect(await size(item.locator('..'))).toEqual({ width: 160, height: 96 })
}
async function near(actual: Promise<Record<string, number>>, expected: Record<string, number>) {
  const received = await actual
  for (const key of Object.keys(expected)) expect(received[key]).toBeCloseTo(expected[key], 2)
}
async function press(page: Page, item: Locator, property: string, value: string) {
  await keyboard(page, item); await page.keyboard.down('Space')
  try { await expect(item).toHaveCSS(property, value) } finally { await page.keyboard.up('Space') }
}
async function front(frame: FrameLocator, index?: number) {
  return frame.locator(`#${index === undefined ? '' : `example-${index}-`}front`).evaluate(e => {
    const rect = e.getBoundingClientRect(), root = e.parentElement!.parentElement!.getBoundingClientRect()
    return { x: rect.x - root.x, y: rect.y - root.y, width: rect.width, height: rect.height }
  })
}

test('transforms preserve the original layout while native focus and pressing change visual geometry', async ({ page, browserName }) => {
  await page.goto('/en/reference/transform')
  const move = await scene(page, 'transform', 'move-an-element'), button = target(move)
  await expect(button).toHaveAccessibleName('Lift layer'); await original(button)
  const initial = await relative(button)
  await keyboard(page, button); await expect(button).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, -8)')
  expect((await relative(button)).y).toBeCloseTo(initial.y - 8, 2); await original(button)
  await expect(button).toHaveCSS('outline-style', 'solid')
  await expect(button).toHaveCSS('transition-duration', '0.15s')
  await page.emulateMedia({ reducedMotion: 'reduce' }); await expect(button).toHaveCSS('transition-duration', '0s')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  // Returning from a preference change must not leave a native transition paused.
  await button.evaluate(e => (e as HTMLElement).blur()); await page.mouse.move(0, 0)
  await expect(button).toHaveCSS('transform', 'none')
  await keyboard(page, button); await expect(button).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, -8)')
  await expect(move.locator('[data-style-property="transform"]')).toHaveText('matrix(1, 0, 0, 1, 0, -8)')
  await print(page, browserName, button, 'transform', 'none')
  const pressed = target(await scene(page, 'transform', 'scale-pressed-controls'))
  await expect(pressed).toHaveAccessibleName('Press and hold')
  await pressed.evaluate(e => e.addEventListener('click', () => e.setAttribute('data-native-activated', 'true')))
  await press(page, pressed, 'transform', 'matrix(0.9, 0, 0, 0.9, 0, 0)')
  await expect(pressed).toHaveAttribute('data-native-activated', 'true'); await expect(pressed).toHaveCSS('transform', 'none'); await original(pressed)
  const decorative = await scene(page, 'transform', 'rotate-or-skew-decorative-elements')
  await near(matrix(target(decorative, 0)), { a: Math.cos(Math.PI / 15), b: Math.sin(Math.PI / 15) })
  await near(matrix(target(decorative, 1)), { a: 1, c: -Math.tan(Math.PI / 15) })
  const pivot = target(await scene(page, 'transform', 'set-the-pivot-separately'))
  await near(relative(pivot), { x: 40, y: 0, width: 120, height: 72 }); await original(pivot)
  const { demo, item } = await condition(page, 'transform')
  await expect(item).toHaveCSS('transform', 'none'); await viewport(demo, 900)
  await expect(item).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 24, 0)'); await near(relative(item), { x: 24, y: 0 })
  await print(page, browserName, item, 'transform', 'none')
})

test('origin examples keep reference dimensions and explicit pivot markers while changing the anchor', async ({ page, browserName }) => {
  await page.goto('/en/reference/transform-origin')
  const base = await scene(page, 'transform-origin', 'set-the-pivot-point')
  await near(relative(target(base, 0)), { x: 20, y: 12, width: 120, height: 72 })
  await near(relative(target(base, 1)), { x: 0, y: 0, width: 120, height: 72 })
  for (const i of [0, 1]) {
    await original(target(base, i))
    const marker = target(base, i).locator('..').locator('span[aria-hidden="true"]')
    await expect(marker).toHaveCSS('transform', 'none'); await expect(marker).toHaveCSS('pointer-events', 'none')
  }
  const axes = await scene(page, 'transform-origin', 'use-two-axis-origins')
  await expect(target(axes, 0)).toHaveCSS('transform-origin', '160px 0px')
  await expect(target(axes, 1)).toHaveCSS('transform-origin', '40px 72px')
  await near(relative(target(axes, 1)), { x: 10, y: 18 })
  const preview = target(await scene(page, 'transform-origin', 'match-the-origin-to-the-interaction'))
  await expect(preview).toHaveAccessibleName('Preview layer'); await near(relative(preview), { x: 0, y: 0, width: 128, height: 76.8 })
  await keyboard(page, preview); await expect(preview).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')
  await near(relative(preview), { x: 0, y: 0, width: 160, height: 96 })
  const previewFrame = example(page, 'transform-origin', 'match-the-origin-to-the-interaction').frameLocator('iframe')
  await expect(previewFrame.locator('[data-size-readout]')).toHaveText('160 × 96 px')
  await preview.evaluate(e => (e as HTMLElement).blur()); await page.mouse.move(0, 0)
  await expect(previewFrame.locator('[data-size-readout]')).toHaveText('128 × 76.8 px')
  const { demo, item } = await condition(page, 'transform-origin')
  await near(relative(item), { x: 20, y: 12 }); await viewport(demo, 900)
  await expect(item).toHaveCSS('transform-origin', '160px 0px'); await near(relative(item), { x: 40, y: 0 })
  await print(page, browserName, item, 'transform-origin', '80px 48px')
})

test('SVG and HTML transform reference boxes drive actual percentage translations and pivots', async ({ page, browserName }) => {
  await page.goto('/en/reference/transform-box')
  const reference = await scene(page, 'transform-box', 'choose-the-transform-reference-box')
  for (const [i, x] of [56, 64, 144].entries()) {
    await near(relative(target(reference, i)), { x, y: 60, width: 64, height: 40 })
    expect(await target(reference, i).evaluate(e => { const box = (e as SVGGraphicsElement).getBBox(); return [box.x, box.y, box.width, box.height] })).toEqual([24, 60, 64, 40])
    await expect(target(reference, i).locator('..')).toHaveAccessibleName('Rectangle translated from its dashed source bounds')
  }
  const html = await scene(page, 'transform-box', 'use-the-border-box-for-html-elements')
  // Chromium's resolved transform serialization can use the border dimensions for
  // content-box percentages; actual client geometry remains the behavior under test.
  await near(relative(target(html, 0)), { x: 80, y: 0, width: 160, height: 100 })
  await near(relative(target(html, 1)), { x: 54, y: 0, width: 160, height: 100 })
  const origins = await scene(page, 'transform-box', 'pair-with-transform-origin')
  await near(relative(target(origins, 0)), { x: 36, y: 44, width: 72, height: 72 })
  await near(relative(target(origins, 1)), { x: 48, y: 56, width: 72, height: 72 })
  const { demo, item } = await condition(page, 'transform-box')
  await near(relative(item), { x: 56 }); await viewport(demo, 900)
  await expect(item).toHaveCSS('transform-box', 'view-box'); await near(relative(item), { x: 144 })
  await print(page, browserName, item, 'transform-box', 'fill-box')
})

test('3D children preserve depth, grouping forces flattening and perspective changes projected size', async ({ page, browserName }) => {
  await page.goto('/en/reference/transform-style')
  const base = await scene(page, 'transform-style', 'preserve-3d-children')
  const flat = await front(base, 0), preserved = await front(base, 1)
  expect(preserved.x - flat.x).toBeGreaterThan(20); expect(preserved.height).toBeGreaterThan(flat.height)
  const grouping = await scene(page, 'transform-style', 'flatten-nested-transforms')
  await expect(target(grouping, 1)).toHaveCSS('transform-style', 'preserve-3d')
  await expect(target(grouping, 1)).toHaveCSS('opacity', '0.8')
  await near(front(grouping, 1), await front(grouping, 0))
  const perspective = await scene(page, 'transform-style', 'combine-with-perspective')
  expect((await front(perspective, 1)).height).toBeGreaterThan((await front(perspective, 0)).height + 10)
  const { demo, item } = await condition(page, 'transform-style'), frame = demo.frameLocator('iframe')
  await expect(item).toHaveCSS('transform-style', 'flat'); const initial = await front(frame)
  await viewport(demo, 900); await expect(item).toHaveCSS('transform-style', 'preserve-3d')
  expect((await front(frame)).x - initial.x).toBeGreaterThan(20)
  await print(page, browserName, item, 'transform-style', 'flat')
})

test('will-change exposes native hints without hiding controls or replacing actual interaction', async ({ page, browserName }) => {
  await page.goto('/en/reference/will-change')
  const prepared = target(await scene(page, 'will-change', 'hint-an-upcoming-transform'))
  await expect(prepared).toHaveAccessibleName('Move preview'); await expect(prepared).toHaveCSS('will-change', 'transform')
  await press(page, prepared, 'transform', 'matrix(1, 0, 0, 1, 0, -8)')
  await expect(prepared).toHaveCSS('transform', 'none')
  const faded = target(await scene(page, 'will-change', 'hint-opacity-changes'))
  await expect(faded).toHaveAccessibleName('Preview overlay'); await expect(faded).toHaveCSS('opacity', '1')
  await press(page, faded, 'opacity', '0.64'); await expect(faded).toHaveCSS('opacity', '1')
  const reset = target(await scene(page, 'will-change', 'reset-when-the-hint-is-no-longer-useful'))
  await expect(reset).toHaveCSS('will-change', 'auto'); await keyboard(page, reset)
  await expect(reset).toHaveCSS('will-change', 'transform'); await expect(reset).toHaveCSS('transform', 'none')
  await reset.evaluate(e => (e as HTMLElement).blur()); await page.mouse.move(0, 0)
  await expect(reset).toHaveCSS('will-change', 'auto')
  if (browserName === 'chromium') {
    await reset.hover(); await expect(reset).toHaveCSS('will-change', 'transform')
    await page.mouse.move(0, 0); await expect(reset).toHaveCSS('will-change', 'auto')
  }
  const { demo, item } = await condition(page, 'will-change')
  await expect(item).toHaveCSS('will-change', 'auto'); await viewport(demo, 900)
  await expect(item).toHaveCSS('will-change', 'opacity'); await expect(item).toHaveCSS('opacity', '1')
  await print(page, browserName, item, 'will-change', 'auto')
})

for (const route of routes) {
  test(`transforms composition: ${route}`, async ({ page }, testInfo) => {
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
