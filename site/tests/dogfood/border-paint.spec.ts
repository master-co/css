import { expect, test, type FrameLocator, type Locator, type Page } from '@playwright/test'

const routes = ['border-collapse', 'border-image', 'border-image-source', 'border-image-slice', 'border-image-width', 'border-image-outset', 'border-image-repeat', 'box-decoration-break']
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
const distance = (a: number[], b: number[]) => Math.max(...a.map((value, i) => Math.abs(value - b[i])))

async function condition(page: Page, route: string) {
  const demo = example(page, route, 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 390)
  return { demo, item: target(frame) }
}
async function gap(item: Locator) {
  return item.evaluate(e => { const cells = e.querySelectorAll('tr:first-child > *'); return cells[1].getBoundingClientRect().left - cells[0].getBoundingClientRect().right })
}
async function outside(page: Page, item: Locator) {
  const surface = item.locator('xpath=..'), outer = (await surface.boundingBox())!, inner = (await item.boundingBox())!
  return (await pixels(page, surface, [[Math.round(inner.x - outer.x + 60), Math.round(inner.y - outer.y - 6)]]))[0]
}
async function glyphOffsets(item: Locator) {
  return item.evaluate(e => {
    const fragments = Array.from(e.getClientRects()), text = Array.from(e.childNodes).find(node => node.nodeType === Node.TEXT_NODE)!
    const lines = new Map<number, number>()
    for (let i = 0; i < text.textContent!.length; i++) {
      if (!text.textContent![i].trim()) continue
      const range = document.createRange(); range.setStart(text, i); range.setEnd(text, i + 1)
      const r = range.getBoundingClientRect(), y = Math.round(r.y)
      lines.set(y, Math.min(lines.get(y) ?? Infinity, r.x))
    }
    return [...lines].map(([y, x]) => x - fragments.find(r => y >= r.top - 1 && y <= r.bottom)!.left)
  })
}

test('native tables preserve adjacent cell borders and expose actual separate spacing', async ({ page, browserName }) => {
  await page.goto('/en/reference/border-collapse')
  const collapsed = target(await scene(page, 'border-collapse', 'collapse-table-borders'))
  await expect(collapsed).toHaveAccessibleName('Project assets'); await expect(collapsed.getByRole('rowheader')).toHaveCount(2)
  await expect(collapsed.locator('td').first()).toHaveCSS('border-left-width', '2px'); expect(await gap(collapsed)).toBe(0)
  const separate = target(await scene(page, 'border-collapse', 'separate-table-borders'))
  await expect(separate).toHaveCSS('border-collapse', 'separate'); expect(await gap(separate)).toBe(0)
  expect((await size(separate)).height).toBeGreaterThan((await size(collapsed)).height)
  const pair = await scene(page, 'border-collapse', 'match-border-spacing-to-the-mode')
  for (const i of [0, 1]) await expect(target(pair, i)).toHaveCSS('border-spacing', '8px')
  expect(await gap(target(pair, 0))).toBe(0); expect(await gap(target(pair, 1))).toBe(8)
  const { demo, item } = await condition(page, 'border-collapse')
  await expect(item).toHaveCSS('border-collapse', 'collapse'); await viewport(demo, 900)
  await expect(item).toHaveCSS('border-collapse', 'separate'); expect(await gap(item)).toBe(8)
  await print(page, browserName, item, 'border-collapse', 'collapse')
})

test('border image shorthand distinguishes source slices and explicit width multipliers', async ({ page, browserName }) => {
  await page.goto('/en/reference/border-image')
  const gradient = target(await scene(page, 'border-image', 'draw-a-gradient-border-image'))
  await expect(gradient).toHaveCSS('border-image-source', /linear-gradient/); await expect(gradient).toHaveCSS('border-image-slice', '1'); await expect(gradient).toHaveCSS('border-image-width', '1')
  const pair = await scene(page, 'border-image', 'include-width-and-repeat')
  await expect(target(pair, 0)).toHaveCSS('border-image-width', '2'); await expect(target(pair, 1)).toHaveCSS('border-image-width', '16px')
  expect(await size(target(pair, 0))).toEqual({ width: 250, height: 130 }); expect(await size(target(pair, 1))).toEqual(await size(target(pair, 0)))
  const { demo, item } = await condition(page, 'border-image')
  await expect(item).toHaveCSS('border-image-source', 'none'); await viewport(demo, 900)
  await expect(item).toHaveCSS('border-image-source', /border-grid\.svg/); await expect(item).toHaveCSS('border-image-repeat', 'round')
  await print(page, browserName, item, 'border-image-source', 'none')
})

test('changing image sources retains prerequisites and exposes the real fallback border', async ({ page, browserName }) => {
  await page.goto('/en/reference/border-image-source')
  const pair = await scene(page, 'border-image-source', 'use-no-source')
  await expect(target(pair, 1)).toHaveCSS('border-image-source', 'none')
  for (const i of [0, 1]) { await expect(target(pair, i)).toHaveCSS('border-width', '12px'); await expect(target(pair, i)).toHaveCSS('border-image-slice', '24') }
  const a = await pixels(page, target(pair, 0), [[3, 3]]), b = await pixels(page, target(pair, 1), [[3, 3]])
  expect(distance(a[0], b[0])).toBeGreaterThan(30)
  const { demo, item } = await condition(page, 'border-image-source')
  await expect(item).toHaveCSS('border-image-source', /linear-gradient/); await viewport(demo, 900)
  await expect(item).toHaveCSS('border-image-source', /border-grid\.svg/); await print(page, browserName, item, 'border-image-source', 'none')
})

test('source slice percentages match native coordinates and fill paints the actual center', async ({ page, browserName }) => {
  await page.goto('/en/reference/border-image-slice')
  const pair = await scene(page, 'border-image-slice', 'slice-the-source-image'), image = pair.getByRole('img')
  expect(await image.evaluate((e: HTMLImageElement) => [e.naturalWidth, e.naturalHeight])).toEqual([96, 96])
  const points = [[3, 3], [60, 6], [35, 40]]
  expect(await pixels(page, target(pair, 0), points)).toEqual(await pixels(page, target(pair, 1), points))
  const fill = await scene(page, 'border-image-slice', 'preserve-the-center-with-fill')
  const a = await pixels(page, target(fill, 0), [[35, 40]]), b = await pixels(page, target(fill, 1), [[35, 40]])
  expect(distance(a[0], b[0])).toBeGreaterThan(20)
  expect(await size(target(fill, 0))).toEqual(await size(target(fill, 1)))
  const { demo, item } = await condition(page, 'border-image-slice')
  await expect(item).toHaveCSS('border-image-slice', '24'); await viewport(demo, 900)
  await expect(item).toHaveCSS('border-image-slice', '24 fill'); await print(page, browserName, item, 'border-image-slice', '24')
})

test('image width changes native paint while auto follows the intrinsic source slices', async ({ page, browserName }) => {
  await page.goto('/en/reference/border-image-width')
  const pair = await scene(page, 'border-image-width', 'set-the-border-image-width')
  for (const [i, value] of ['1', '2', '16px'].entries()) { await expect(target(pair, i)).toHaveCSS('border-image-width', value); expect(await size(target(pair, i))).toEqual({ width: 250, height: 130 }) }
  const a = await pixels(page, target(pair, 0), [[60, 18]]), b = await pixels(page, target(pair, 1), [[60, 18]])
  expect(distance(a[0], b[0])).toBeGreaterThan(30)
  const auto = await scene(page, 'border-image-width', 'use-automatic-width')
  await expect(target(auto, 0)).toHaveCSS('border-image-width', 'auto')
  const points = [[60, 18], [60, 26], [3, 3]]
  expect(await pixels(page, target(auto, 0), points)).toEqual(await pixels(page, target(auto, 1), points))
  const { demo, item } = await condition(page, 'border-image-width')
  await expect(item).toHaveCSS('border-image-width', '1'); await viewport(demo, 900)
  await expect(item).toHaveCSS('border-image-width', '2'); await print(page, browserName, item, 'border-image-width', '1')
})

test('outset extends actual paint into reserved space without enlarging the box', async ({ page, browserName }) => {
  await page.goto('/en/reference/border-image-outset')
  const pair = await scene(page, 'border-image-outset', 'extend-the-border-image-outside-the-box')
  for (const i of [0, 1]) expect(await size(target(pair, i))).toEqual({ width: 220, height: 130 })
  expect(distance(await outside(page, target(pair, 0)), await outside(page, target(pair, 1)))).toBeGreaterThan(30)
  const axes = target(await scene(page, 'border-image-outset', 'use-separate-vertical-and-horizontal-values'))
  await expect(axes).toHaveCSS('border-image-outset', '8px 16px')
  const { demo, item } = await condition(page, 'border-image-outset')
  await expect(item).toHaveCSS('border-image-outset', '0'); await viewport(demo, 900)
  await expect(item).toHaveCSS('border-image-outset', '12px'); await print(page, browserName, item, 'border-image-outset', '0')
})

test('repeat modes change patterned tiles and pairs use horizontal then vertical order', async ({ page, browserName }) => {
  await page.goto('/en/reference/border-image-repeat')
  const modes = await scene(page, 'border-image-repeat', 'round-repeated-edge-slices'), rows: number[][][] = []
  for (const [i, value] of ['stretch', 'repeat', 'round', 'space'].entries()) {
    await expect(target(modes, i)).toHaveCSS('border-image-repeat', value)
    rows.push(await pixels(page, target(modes, i), Array.from({ length: 210 }, (_, x) => [20 + x, 6])))
  }
  for (const row of rows.slice(1)) expect(row).not.toEqual(rows[0])
  expect(rows[1]).not.toEqual(rows[2]); expect(rows[2]).not.toEqual(rows[3])
  const pair = target(await scene(page, 'border-image-repeat', 'set-vertical-and-horizontal-behavior'))
  await expect(pair).toHaveCSS('border-image-repeat', 'round stretch')
  const { demo, item } = await condition(page, 'border-image-repeat')
  await expect(item).toHaveCSS('border-image-repeat', 'stretch'); await viewport(demo, 900)
  await expect(item).toHaveCSS('border-image-repeat', 'round'); await print(page, browserName, item, 'border-image-repeat', 'stretch')
})

test('native inline fragments repeat padding only with clone and retain accessible navigation', async ({ page, browserName }) => {
  await page.goto('/en/reference/box-decoration-break')
  const pair = await scene(page, 'box-decoration-break', 'clone')
  const slice = await glyphOffsets(target(pair, 0)), clone = await glyphOffsets(target(pair, 1))
  expect(slice.length).toBeGreaterThan(1); expect(clone.length).toBeGreaterThan(1)
  expect(slice[1]).toBeCloseTo(0, 0); expect(clone[1]).toBeCloseTo(9, 0)
  const linked = await scene(page, 'box-decoration-break', 'use-on-inline-content'), link = target(linked)
  await expect(link).toHaveAccessibleName('Read the full selection notes and source details.')
  await keyboard(page, link); await page.keyboard.press('Enter'); await expect(linked.locator('#notes')).toBeFocused()
  const { demo, item } = await condition(page, 'box-decoration-break')
  await expect(item).toHaveCSS('-webkit-box-decoration-break', 'slice'); expect((await glyphOffsets(item)).length).toBeGreaterThan(1); await viewport(demo, 900)
  await expect(item).toHaveCSS('-webkit-box-decoration-break', 'clone'); expect((await glyphOffsets(item)).length).toBeGreaterThan(1); await print(page, browserName, item, '-webkit-box-decoration-break', 'slice')
})

for (const route of routes) {
  test(`border paint composition: ${route}`, async ({ page }, testInfo) => {
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
