import { expect, test, type FrameLocator, type Locator, type Page } from '@playwright/test'

const routes = ['color', 'background', 'background-color', 'background-image', 'background-attachment', 'background-blend-mode', 'background-clip', 'background-origin', 'background-position', 'background-repeat', 'background-size']
const example = (page: Page, route: string, section: string) => page.locator(`[data-demo-case="${route}#${section}"]`)
const target = (frame: FrameLocator, index?: number) => frame.locator(`#${index === undefined ? '' : `example-${index}-`}target`)
async function ready(demo: Locator) {
  await demo.scrollIntoViewIfNeeded()
  await expect(demo.locator('iframe')).toHaveAttribute('data-ready', 'true')
  for (const legend of await demo.locator('legend.sr-only').all()) await expect(legend).toHaveCSS('position', 'absolute')
  await demo.locator('iframe').evaluate(async (element: HTMLIFrameElement) => { await element.contentDocument!.fonts.ready })
  return demo.frameLocator('iframe')
}
async function scene(page: Page, route: string, section: string) { return ready(example(page, route, section)) }
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
async function keyboard(page: Page, item: Locator) {
  await item.focus(); await page.keyboard.press('ArrowRight')
  await expect(item).toBeFocused(); await expect(item).toHaveCSS('outline-style', 'solid')
}
async function conditional(page: Page, browserName: string, route: string, property: string, narrow: string, wide: string, printed = narrow) {
  const demo = example(page, route, 'apply-conditionally'), frame = await ready(demo), item = target(frame)
  await viewport(demo, 390); await expect(item).toHaveCSS(property, narrow)
  await viewport(demo, 900); await expect(item).toHaveCSS(property, wide)
  await print(page, browserName, item, property, printed)
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
const distance = (a: number[], b: number[]) => Math.max(...a.map((value, i) => Math.abs(value - b[i])))

test('foreground alpha, configured namespace and real keyboard/theme states agree', async ({ page, browserName }) => {
  await page.goto('/en/reference/color')
  const pair = await scene(page, 'color', 'with-opacity')
  await expect(target(pair, 1)).toHaveCSS('opacity', '1')
  expect(await target(pair, 1).evaluate(e => getComputedStyle(e).color)).toMatch(/(?:0?\.4|40%)/)
  const configured = await scene(page, 'color', 'use-custom-text-colors')
  expect(await target(configured, 0).evaluate(e => getComputedStyle(e).color)).toEqual(await target(configured, 1).evaluate(e => getComputedStyle(e).color))
  const demo = example(page, 'color', 'apply-conditionally'), frame = await ready(demo), item = target(frame)
  await expect(item).toHaveAccessibleName('Preview details')
  const before = await item.evaluate(e => getComputedStyle(e).color)
  await demo.getByRole('button', { name: 'Theme', exact: true }).click()
  await expect.poll(() => item.evaluate(e => getComputedStyle(e).color)).not.toBe(before)
  await keyboard(page, item)
  expect(await item.evaluate(e => getComputedStyle(e).color)).toBe(await item.evaluate(e => (() => { const probe = e.ownerDocument.createElement('span'); probe.style.color = 'var(--color-text-blue)'; e.append(probe); const color = getComputedStyle(probe).color; probe.remove(); return color })()))
  await print(page, browserName, item, 'color', 'oklch(0 0 none)')
})

test('focused longhands preserve the image while the native shorthand resets it', async ({ page, browserName }) => {
  await page.goto('/en/reference/background')
  const main = target(await scene(page, 'background', 'use-the-background-shorthand'))
  await expect(main).toHaveCSS('background-size', 'cover'); await expect(main).toHaveCSS('background-repeat', 'no-repeat')
  const pair = await scene(page, 'background', 'prefer-focused-utilities-for-simple-changes')
  for (const i of [0, 1]) {
    const item = target(pair, i)
    await expect(item).toHaveCSS('background-image', /landscape.svg/)
    await keyboard(page, item)
    await expect(item).toHaveCSS('background-image', i ? 'none' : /landscape.svg/)
    await expect(item).toHaveCSS('background-size', i ? 'auto' : '160px 100px')
    await expect(item).toHaveCSS('background-repeat', i ? 'repeat' : 'no-repeat')
  }
  const demo = example(page, 'background', 'apply-conditionally'), item = target(await ready(demo))
  await viewport(demo, 390); await expect(item).toHaveCSS('background-image', 'none')
  await viewport(demo, 900); await expect(item).toHaveCSS('background-image', /landscape.svg/)
  await print(page, browserName, item, 'background-image', 'none')
})

test('background alpha reveals the authored backing without dimming the foreground', async ({ page, browserName }) => {
  await page.goto('/en/reference/background-color')
  const pair = await scene(page, 'background-color', 'with-opacity')
  const samples = []
  for (const i of [0, 1]) {
    const item = target(pair, i); await expect(item).toHaveCSS('opacity', '1')
    samples.push(await pixels(page, item, [[5, 5], [Math.floor((await item.boundingBox())!.width) - 5, 5]]))
  }
  expect(distance(samples[0][0], samples[0][1])).toBeLessThan(2)
  expect(distance(samples[1][0], samples[1][1])).toBeGreaterThan(1)
  const item = target(await scene(page, 'background-color', 'apply-conditionally'))
  const before = await item.evaluate(e => getComputedStyle(e).backgroundColor)
  await keyboard(page, item); expect(await item.evaluate(e => getComputedStyle(e).backgroundColor)).not.toBe(before)
  await expect(item).toHaveAccessibleName('Preview details')
  await print(page, browserName, item, 'background-color', 'rgba(0, 0, 0, 0)')
})

test('background images load and real multilayer gradients retain authored ordering', async ({ page, browserName }) => {
  await page.goto('/en/reference/background-image')
  expect((await page.request.get('/demo/landscape.svg')).ok()).toBeTruthy()
  const pair = await scene(page, 'background-image', 'use-gradients')
  await expect(target(pair, 0)).toHaveCSS('background-image', /^linear-gradient\(/)
  await expect(target(pair, 1)).toHaveCSS('background-image', /^linear-gradient\(.+\), url\(.+landscape.svg/)
  const demo = example(page, 'background-image', 'apply-conditionally'), item = target(await ready(demo))
  await viewport(demo, 390); await expect(item).toHaveCSS('background-image', 'none')
  await viewport(demo, 900); await expect(item).toHaveCSS('background-image', /landscape.svg/)
  await print(page, browserName, item, 'background-image', 'none')
})

test('attachment preserves independent native element and viewport scrolling', async ({ page, browserName }, testInfo) => {
  await page.goto('/en/reference/background-attachment')
  for (const [id, value] of [['scroll-with-the-element', 'scroll'], ['fix-a-background-to-the-viewport', 'fixed'], ['attach-to-scrollable-content', 'local']]) {
    const demo = example(page, 'background-attachment', id), frame = await ready(demo), item = target(frame)
    await expect(item).toHaveCSS('background-attachment', value)
    expect(await item.evaluate(e => e.scrollHeight - e.clientHeight)).toBeGreaterThan(250)
    await item.focus(); await expect(item).toBeFocused()
    // Mobile WebKit automation does not implement arrow-key scrolling.
    // Use its native scroll API; Chromium verifies the actual keyboard path.
    if (browserName === 'webkit') await item.evaluate(e => e.scrollBy(0, 40))
    else await page.keyboard.press('ArrowDown')
    await expect.poll(() => item.evaluate(e => e.scrollTop)).toBeGreaterThan(0)
    await item.evaluate(e => e.scrollTop = 0)
    const width = (await item.boundingBox())!.width
    const samplePoints = [[Math.floor(width * .4), 100], [Math.floor(width * .7), 150], [Math.floor(width * .8), 100]]
    const initial = await pixels(page, item, samplePoints)
    await item.evaluate(e => e.scrollTop = 100)
    await expect.poll(() => item.evaluate(e => e.scrollTop)).toBe(100)
    const inner = await pixels(page, item, samplePoints)
    const innerDelta = Math.max(...initial.map((pixel, i) => distance(pixel, inner[i])))
    if (value === 'local') expect(innerDelta).toBeGreaterThan(30)
    else expect(innerDelta).toBeLessThan(3)
    await demo.locator('iframe').screenshot({ path: testInfo.outputPath(`${value}-inner-scroll.png`), scale: 'css' })
    await item.evaluate(e => e.scrollTop = 0)
    const points = [[100, 170], [160, 170], [200, 190]]
    const beforePage = await pixels(page, demo.locator('iframe'), points)
    await item.evaluate(e => { e.scrollTop = 0; e.ownerDocument.defaultView!.scrollTo(0, 80) })
    await expect.poll(() => item.evaluate(e => e.ownerDocument.defaultView!.scrollY)).toBe(80)
    await expect(item).toHaveCSS('background-attachment', value)
    if (browserName === 'chromium') {
      const afterPage = await pixels(page, demo.locator('iframe'), points)
      const pageDelta = Math.max(...beforePage.map((pixel, i) => distance(pixel, afterPage[i])))
      if (value === 'fixed') expect(pageDelta).toBeLessThan(3)
      else expect(pageDelta).toBeGreaterThan(30)
    }
    await demo.locator('iframe').screenshot({ path: testInfo.outputPath(`${value}-viewport-scroll.png`), scale: 'css' })
  }
  await conditional(page, browserName, 'background-attachment', 'background-attachment', 'local', 'fixed', 'scroll')
})

test('multiply changes actual background pixels and normal restores the source colors', async ({ page, browserName }) => {
  await page.goto('/en/reference/background-blend-mode')
  const pair = await scene(page, 'background-blend-mode', 'blend-background-layers')
  const normal = (await pixels(page, target(pair, 0), [[10, 10]]))[0], multiply = (await pixels(page, target(pair, 1), [[10, 10]]))[0]
  expect(distance(normal, [219, 234, 254])).toBeLessThan(3); expect(distance(normal, multiply)).toBeGreaterThan(20)
  const item = target(await scene(page, 'background-blend-mode', 'restore-normal-blending'))
  await expect(item).toHaveCSS('background-blend-mode', 'multiply'); await keyboard(page, item)
  await expect(item).toHaveCSS('background-blend-mode', 'normal')
  expect(distance((await pixels(page, item, [[10, 10]]))[0], normal)).toBeLessThan(3)
  await conditional(page, browserName, 'background-blend-mode', 'background-blend-mode', 'normal', 'multiply')
})

test('clipping changes paint without changing geometry and glyphs keep a solid print fallback', async ({ page, browserName }) => {
  await page.goto('/en/reference/background-clip')
  const pair = await scene(page, 'background-clip', 'clip-a-background-to-a-box')
  const widths = [], colors = []
  for (const [i, value] of ['border-box', 'padding-box', 'content-box'].entries()) {
    const item = target(pair, i); await expect(item).toHaveCSS('background-clip', value)
    widths.push((await item.boundingBox())!.width); colors.push((await pixels(page, item, [[16, 16]]))[0])
  }
  expect(new Set(widths).size).toBe(1); expect(distance(colors[0], colors[1])).toBeLessThan(3); expect(distance(colors[1], colors[2])).toBeGreaterThan(10)
  const glyph = target(await scene(page, 'background-clip', 'clip-a-background-to-text'))
  await expect(glyph).toHaveCSS('background-clip', 'text'); await expect(glyph).toHaveCSS('-webkit-text-fill-color', 'rgba(0, 0, 0, 0)')
  if (browserName === 'chromium') { await page.emulateMedia({ media: 'print' }); await expect(glyph).toHaveCSS('background-image', 'none'); expect(await glyph.evaluate(e => getComputedStyle(e).webkitTextFillColor)).not.toBe('rgba(0, 0, 0, 0)'); await page.emulateMedia({ media: 'screen' }) }
  await conditional(page, browserName, 'background-clip', 'background-clip', 'border-box', 'content-box')
})

test('origin changes image positioning independently of a constant clipping area', async ({ page, browserName }) => {
  await page.goto('/en/reference/background-origin')
  const pair = await scene(page, 'background-origin', 'choose-the-background-positioning-area')
  for (const [i, value] of ['border-box', 'padding-box', 'content-box'].entries()) {
    const item = target(pair, i)
    await expect(item).toHaveCSS('background-origin', value); await expect(item).toHaveCSS('background-clip', 'border-box')
    await expect(item).toHaveCSS('padding-top', '24px'); await expect(item).toHaveCSS('border-top-width', '8px')
    const offset = [0, 8, 32][i]
    const color = (await pixels(page, item, [[offset + 12, offset + 12]]))[0]
    expect(distance(color, [219, 234, 254])).toBeLessThan(3)
  }
  await conditional(page, browserName, 'background-origin', 'background-origin', 'padding-box', 'content-box')
})

test('positions distribute free space and responsive cover crops preserve image size', async ({ page, browserName }) => {
  await page.goto('/en/reference/background-position')
  const pair = await scene(page, 'background-position', 'use-explicit-positions')
  await expect(target(pair, 0)).toHaveCSS('background-position', '50% 25%'); await expect(target(pair, 1)).toHaveCSS('background-position', '24px 12px')
  const width = (await target(pair, 0).boundingBox())!.width
  const color = (await pixels(page, target(pair, 0), [[Math.round((width - 160) / 2) + 5, 20]]))[0]
  expect(distance(color, [219, 234, 254])).toBeLessThan(3)
  await conditional(page, browserName, 'background-position', 'background-position', '50% 50%', '50% 0%')
  await expect(target(await scene(page, 'background-position', 'apply-conditionally'))).toHaveCSS('background-size', 'cover')
})

test('repetition paints the requested axes with identical tile geometry', async ({ page, browserName }) => {
  await page.goto('/en/reference/background-repeat')
  const pair = await scene(page, 'background-repeat', 'repeat-on-one-axis')
  await expect(target(pair, 0)).toHaveCSS('background-repeat', 'repeat-x'); await expect(target(pair, 1)).toHaveCSS('background-repeat', 'repeat-y')
  const x = await pixels(page, target(pair, 0), [[85, 5], [5, 55]]), y = await pixels(page, target(pair, 1), [[85, 5], [5, 55]])
  expect(distance(x[0], [219, 234, 254])).toBeLessThan(3); expect(distance(y[1], [219, 234, 254])).toBeLessThan(3)
  expect(distance(x[0], x[1])).toBeGreaterThan(10); expect(distance(y[0], y[1])).toBeGreaterThan(10)
  await conditional(page, browserName, 'background-repeat', 'background-repeat', 'no-repeat', 'repeat')
})

test('size retains source ratio for contain and resolves measured units natively', async ({ page, browserName }) => {
  await page.goto('/en/reference/background-size')
  const contain = target(await scene(page, 'background-size', 'contain-an-image'))
  await expect(contain).toHaveCSS('background-size', 'contain'); await expect(contain).toHaveCSS('background-repeat', 'no-repeat')
  const pair = await scene(page, 'background-size', 'use-measured-sizes')
  await expect(target(pair, 0)).toHaveCSS('background-size', '160px auto')
  await expect(target(pair, 1)).toHaveCSS('background-size', '48px 48px')
  await conditional(page, browserName, 'background-size', 'background-size', 'contain', 'cover')
})

for (const route of routes) {
  test(`background composition: ${route}`, async ({ page }, testInfo) => {
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
