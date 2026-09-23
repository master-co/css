import { expect, test, type FrameLocator, type Locator, type Page } from '@playwright/test'

const routes = ['shape-outside', 'shape-margin', 'shape-image-threshold']
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
async function gradientContrast(page: Page, item: Locator) {
  const encoded = (await item.screenshot({ scale: 'css' })).toString('base64')
  const foreground = await item.evaluate(e => getComputedStyle(e.closest('article')!).color)
  return page.evaluate(async ({ encoded, foreground }) => {
    const image = new Image(); image.src = `data:image/png;base64,${encoded}`; await image.decode()
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height
    const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0)
    // Between text lines, just above the first line that enters the faded image.
    const background = Array.from(context.getImageData(8, 25, 1, 1).data).slice(0, 3)
    context.clearRect(0, 0, 1, 1); context.fillStyle = foreground; context.fillRect(0, 0, 1, 1)
    const text = Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3)
    const luminance = (rgb: number[]) => rgb.map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0)
    const values = [luminance(background), luminance(text)].sort((a, b) => a - b)
    return (values[1] + .05) / (values[0] + .05)
  }, { encoded, foreground })
}
async function condition(page: Page, route: string) {
  const demo = example(page, route, 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 390)
  return { demo, item: target(frame) }
}
async function lines(item: Locator) {
  return item.evaluate(e => {
    const article = e.closest('article')!, text = article.querySelector('p')!.firstChild!, range = e.ownerDocument.createRange(), box = article.getBoundingClientRect()
    const lines: { x: number, y: number }[] = []
    for (const match of text.textContent!.matchAll(/\S+/g)) {
      range.setStart(text, match.index); range.setEnd(text, match.index + match[0].length)
      const rect = range.getBoundingClientRect()
      if (!lines.some(line => Math.abs(line.y - (rect.y - box.y)) < .5)) lines.push({ x: rect.x - box.x, y: rect.y - box.y })
    }
    return lines
  })
}
const indentation = (flow: { x: number, y: number }[]) => flow.filter(line => line.y < 144).reduce((sum, line) => sum + line.x, 0)
async function shapeBox(item: Locator) {
  expect(await size(item)).toEqual({ width: 120, height: 120 })
  await expect(item).toHaveCSS('float', 'left')
  expect(await item.evaluate(e => e.closest('article')!.querySelectorAll(':scope > *').length)).toBe(2)
  expect((await lines(item)).some(line => line.y >= 160 && line.x === 0)).toBe(true)
}

test('native circle and inset shapes move text lines without changing float paint or geometry', async ({ page, browserName }) => {
  await page.goto('/en/reference/shape-outside')
  const circle = await scene(page, 'shape-outside', 'wrap-text-around-a-circle')
  for (const i of [0, 1]) { await shapeBox(target(circle, i)); await expect(target(circle, i)).toHaveAccessibleName('Blue circle'); await expect(target(circle, i).locator('circle')).toHaveAttribute('r', '48') }
  const rectangleLines = await lines(target(circle, 0)), curvedLines = await lines(target(circle, 1))
  expect(rectangleLines.filter(line => line.y < 120).every(line => line.x === 120)).toBe(true)
  expect(indentation(curvedLines)).toBeLessThan(indentation(rectangleLines))
  expect(new Set(curvedLines.filter(line => line.y < 120).map(line => Math.round(line.x))).size).toBeGreaterThan(2)
  const inset = await scene(page, 'shape-outside', 'use-an-inset-shape')
  for (const i of [0, 1]) { await shapeBox(target(inset, i)); await expect(target(inset, i).locator('rect')).toHaveAttribute('width', '72') }
  expect((await lines(target(inset, 1))).filter(line => line.y < 120).every(line => line.x === 96)).toBe(true)
  const reset = await scene(page, 'shape-outside', 'remove-shape-wrapping')
  await print(page, browserName, target(reset), 'shape-outside', 'none')
  const { demo, item } = await condition(page, 'shape-outside')
  await expect(item).toHaveCSS('shape-outside', 'none'); const narrow = await lines(item)
  await viewport(demo, 900); await expect(item).toHaveCSS('shape-outside', /circle\(48px\)/)
  expect(indentation(await lines(item))).toBeLessThan(indentation(narrow))
  await print(page, browserName, item, 'shape-outside', 'none')
})

test('shape margins expand the actual wrap contour inside unchanged ordinary float margins', async ({ page, browserName }) => {
  await page.goto('/en/reference/shape-margin')
  const base = await scene(page, 'shape-margin', 'add-space-around-a-shape')
  const wide = await scene(page, 'shape-margin', 'increase-margin-for-large-media')
  for (const frame of [base, wide]) for (const i of [0, 1]) {
    const item = target(frame, i); await shapeBox(item)
    await expect(item).toHaveCSS('margin-right', '32px'); await expect(item).toHaveCSS('margin-bottom', '32px')
    await expect(item.locator('circle')).toHaveAttribute('r', '40')
  }
  const zero = indentation(await lines(target(base, 0))), medium = indentation(await lines(target(base, 1))), large = indentation(await lines(target(wide, 1)))
  expect(medium).toBeGreaterThan(zero); expect(large).toBeGreaterThan(medium)
  expect(await lines(target(base, 1))).toEqual(await lines(target(wide, 0)))
  const pair = await scene(page, 'shape-margin', 'pair-with-shape-outside')
  expect((await lines(target(pair, 0))).filter(line => line.y < 152).every(line => line.x === 152)).toBe(true)
  expect(indentation(await lines(target(pair, 1)))).toBe(medium)
  const { demo, item } = await condition(page, 'shape-margin')
  await expect(item).toHaveCSS('shape-margin', '16px'); const narrow = await lines(item)
  await viewport(demo, 900); await expect(item).toHaveCSS('shape-margin', '32px')
  expect(indentation(await lines(item))).toBeGreaterThan(indentation(narrow))
  await print(page, browserName, item, 'shape-margin', '0px')
})

test('image alpha thresholds change real text flow while basic shapes ignore the threshold', async ({ page, browserName }) => {
  await page.goto('/en/reference/shape-image-threshold')
  const base = await scene(page, 'shape-image-threshold', 'set-the-alpha-threshold')
  for (const i of [0, 1]) {
    const item = target(base, i); await shapeBox(item)
    await expect(item).toHaveAccessibleName('Opaque blue center with a translucent outer ring')
    await expect(item).toHaveAttribute('src', '/demo/mask.svg')
    expect(await item.evaluate(e => (e as HTMLImageElement).naturalWidth)).toBe(160)
  }
  const outer = indentation(await lines(target(base, 0))), inner = indentation(await lines(target(base, 1)))
  expect(outer).toBeGreaterThan(inner)
  const soft = await scene(page, 'shape-image-threshold', 'use-lower-thresholds-for-soft-masks')
  expect(indentation(await lines(target(soft, 0)))).toBeGreaterThan(indentation(await lines(target(soft, 1))))
  for (const i of [0, 1]) { await shapeBox(target(soft, i)); await expect(target(soft, i)).toHaveAccessibleName('Blue fading from opaque to transparent') }
  expect(await gradientContrast(page, target(soft, 1))).toBeGreaterThanOrEqual(4.5)
  const geometric = await scene(page, 'shape-image-threshold', 'use-with-image-shapes')
  // A rasterized alpha outline and a mathematical circle can differ at their edge;
  // both must free the transparent corners and preserve the displayed SVG.
  expect(Math.abs(indentation(await lines(target(geometric, 0))) - indentation(await lines(target(geometric, 1))))).toBeLessThan(10)
  await expect(target(geometric, 1)).toHaveCSS('shape-outside', /circle\(36px\)/)
  await expect(target(geometric, 1)).toHaveCSS('shape-image-threshold', '0.8')
  const { demo, item } = await condition(page, 'shape-image-threshold')
  await expect(item).toHaveCSS('shape-image-threshold', '0.5'); const narrow = await lines(item)
  await viewport(demo, 900); await expect(item).toHaveCSS('shape-image-threshold', '0.2')
  expect(indentation(await lines(item))).toBeGreaterThan(indentation(narrow))
  await print(page, browserName, item, 'shape-image-threshold', '0.5')
})

for (const route of routes) {
  test(`shapes composition: ${route}`, async ({ page }, testInfo) => {
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
