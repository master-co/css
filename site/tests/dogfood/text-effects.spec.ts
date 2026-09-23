import { expect, test, type FrameLocator, type Locator, type Page } from '@playwright/test'

const routes = ['text-decoration', 'text-decoration-color', 'text-decoration-line', 'text-decoration-style', 'text-decoration-thickness', 'text-underline-offset', 'text-fill-color', 'text-shadow', 'text-stroke', 'text-stroke-color', 'text-stroke-width']
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
const css = (item: Locator, property: string) => item.evaluate((e, property) => getComputedStyle(e).getPropertyValue(property), property)
const box = (item: Locator) => item.evaluate(e => { const r = e.getBoundingClientRect(); return { width: r.width, height: r.height } })
async function sameGeometry(a: Locator, b: Locator) { expect(await box(a)).toEqual(await box(b)) }
async function state(page: Page, item: Locator, property: string, before: string, after?: string) {
  await expect(item).toHaveCSS(property, before)
  const dimensions = await box(item)
  if (await page.evaluate(() => matchMedia('(hover:hover)').matches)) {
    await item.hover()
    if (after) await expect(item).toHaveCSS(property, after)
    else await expect(item).not.toHaveCSS(property, before)
    await page.mouse.move(0, 0); await expect(item).toHaveCSS(property, before)
  }
  await item.focus(); await page.keyboard.press('ArrowRight')
  await expect(item).toBeFocused(); await expect(item).toHaveCSS('outline-width', '2px')
  if (after) await expect(item).toHaveCSS(property, after)
  else await expect(item).not.toHaveCSS(property, before)
  expect(await box(item)).toEqual(dimensions)
}
async function printed(page: Page, browserName: string, item: Locator, property: string, value: string) {
  if (browserName === 'chromium') {
    await page.emulateMedia({ media: 'print' }); await expect(item).toHaveCSS(property, value)
    await page.emulateMedia({ media: 'screen' })
  }
}

test('decoration shorthand paints all parts and none must target the origin', async ({ page, browserName }) => {
  await page.goto('/en/reference/text-decoration')
  const full = target(await scene(page, 'text-decoration', 'set-a-complete-decoration'))
  await expect(full).toHaveCSS('text-decoration-line', 'underline'); await expect(full).toHaveCSS('text-decoration-style', 'wavy')
  await expect(full).toHaveCSS('text-decoration-thickness', '2px')
  expect(await css(full, 'text-decoration-color')).not.toBe(await css(full, 'color'))
  const aliases = await scene(page, 'text-decoration', 'use-line-aliases')
  for (const [i, line] of ['underline', 'line-through', 'overline'].entries()) {
    await expect(target(aliases, i)).toHaveCSS('text-decoration-line', line)
    await expect(target(aliases, i)).toHaveCSS('text-decoration-style', 'solid')
  }
  const origin = await scene(page, 'text-decoration', 'remove-decoration')
  await expect(target(origin, 0)).toHaveCSS('text-decoration-line', 'underline'); await expect(target(origin, 1)).toHaveCSS('text-decoration-line', 'none')
  for (const i of [0, 1]) await expect(origin.locator(`#example-${i}-child`)).toHaveCSS('text-decoration-line', 'none')
  await sameGeometry(target(origin, 0), target(origin, 1))
  // Both inline children compute none. Their actual pixels differ because only the first receives the ancestor's line.
  expect(await origin.locator('#example-0-child').screenshot()).not.toEqual(await origin.locator('#example-1-child').screenshot())
  const item = target(await scene(page, 'text-decoration', 'apply-conditionally'))
  await expect(item).toHaveAccessibleName('Design together')
  await state(page, item, 'text-decoration-line', 'none', 'underline')
  await printed(page, browserName, item, 'text-decoration-line', 'none')
})

test('decoration color stays independent and transparency preserves text and geometry', async ({ page, browserName }) => {
  await page.goto('/en/reference/text-decoration-color')
  const color = await scene(page, 'text-decoration-color', 'set-decoration-color')
  expect(await css(target(color, 0), 'text-decoration-color')).toBe(await css(target(color, 0), 'color'))
  expect(await css(target(color, 1), 'text-decoration-color')).not.toBe(await css(target(color, 1), 'color'))
  await sameGeometry(target(color, 0), target(color, 1))
  const current = await scene(page, 'text-decoration-color', 'follow-the-current-text-color')
  for (const i of [0, 1]) expect(await css(target(current, i), 'text-decoration-color')).toBe(await css(target(current, i), 'color'))
  const transparent = await scene(page, 'text-decoration-color', 'hide-decoration-color')
  await expect(target(transparent, 1)).toHaveCSS('text-decoration-color', 'rgba(0, 0, 0, 0)')
  await expect(target(transparent, 1)).toHaveCSS('text-decoration-line', 'underline')
  await expect(target(transparent, 1)).not.toHaveCSS('color', 'rgba(0, 0, 0, 0)')
  await sameGeometry(target(transparent, 0), target(transparent, 1))
  const item = target(await scene(page, 'text-decoration-color', 'apply-conditionally')), before = await css(item, 'color')
  await state(page, item, 'text-decoration-color', before)
  await printed(page, browserName, item, 'text-decoration-color', before)
})

test('decoration line longhand preserves color style and thickness', async ({ page, browserName }) => {
  await page.goto('/en/reference/text-decoration-line')
  const underline = target(await scene(page, 'text-decoration-line', 'underline-text'))
  await expect(underline).toHaveCSS('text-decoration-line', 'underline'); await expect(underline).toHaveCSS('text-decoration-style', 'wavy')
  await expect(underline).toHaveCSS('text-decoration-thickness', '2px')
  const combined = target(await scene(page, 'text-decoration-line', 'combine-line-values'))
  await expect(combined).toHaveCSS('text-decoration-line', 'underline overline')
  const aliases = await scene(page, 'text-decoration-line', 'use-shorthand-aliases-for-common-cases')
  for (const [i, line] of ['underline', 'line-through', 'overline'].entries()) await expect(target(aliases, i)).toHaveCSS('text-decoration-line', line)
  const item = target(await scene(page, 'text-decoration-line', 'apply-conditionally')), color = await css(item, 'text-decoration-color')
  await state(page, item, 'text-decoration-line', 'underline', 'underline overline')
  await expect(item).toHaveCSS('text-decoration-color', color); await expect(item).toHaveCSS('text-decoration-thickness', '2px')
  await printed(page, browserName, item, 'text-decoration-line', 'underline')
})

test('decoration styles keep a real line across pointer keyboard and viewport conditions', async ({ page, browserName }) => {
  await page.goto('/en/reference/text-decoration-style')
  for (const [section, styles] of [['use-a-wavy-decoration', ['solid', 'wavy']], ['use-dashed-or-dotted-lines', ['dashed', 'dotted', 'double']]] as const) {
    const frame = await scene(page, 'text-decoration-style', section)
    for (const [i, style] of styles.entries()) {
      await expect(target(frame, i)).toHaveCSS('text-decoration-line', 'underline')
      await expect(target(frame, i)).toHaveCSS('text-decoration-style', style)
      await expect(target(frame, i)).toHaveCSS('text-decoration-thickness', '2px')
    }
  }
  await state(page, target(await scene(page, 'text-decoration-style', 'return-to-solid-lines')), 'text-decoration-style', 'wavy', 'solid')
  const demo = example(page, 'text-decoration-style', 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 360); await expect(target(frame)).toHaveCSS('text-decoration-style', 'solid')
  await viewport(demo, 900); await expect(target(frame)).toHaveCSS('text-decoration-style', 'dashed')
  await expect(target(frame)).toHaveCSS('text-decoration-line', 'underline')
  await printed(page, browserName, target(frame), 'text-decoration-style', 'solid')
})

test('thickness and offset change paint without enlarging layout boxes', async ({ page, browserName }) => {
  await page.goto('/en/reference/text-decoration-thickness')
  const thickness = await scene(page, 'text-decoration-thickness', 'set-decoration-thickness')
  for (const [i, value] of ['1px', '3px'].entries()) {
    await expect(target(thickness, i)).toHaveCSS('text-decoration-thickness', value)
    await expect(target(thickness, i)).toHaveCSS('text-decoration-line', 'underline')
  }
  await sameGeometry(target(thickness, 0), target(thickness, 1))
  const font = await scene(page, 'text-decoration-thickness', 'use-font-provided-thickness')
  for (const [i, value] of ['auto', 'from-font'].entries()) {
    await expect(target(font, i)).toHaveCSS('text-decoration-thickness', value)
    await expect(target(font, i)).toHaveCSS('text-decoration-line', 'underline')
  }
  const offset = await scene(page, 'text-decoration-thickness', 'pair-with-underline-offset')
  for (const [i, value] of ['2px', '6px'].entries()) await expect(target(offset, i)).toHaveCSS('text-underline-offset', value)
  await sameGeometry(target(offset, 0), target(offset, 1))
  const item = target(await scene(page, 'text-decoration-thickness', 'apply-conditionally'))
  await state(page, item, 'text-decoration-thickness', '1px', '3px')
  await printed(page, browserName, item, 'text-decoration-thickness', '1px')
})

test('underline offset follows the actual property and resets to zero rather than auto', async ({ page, browserName }) => {
  await page.goto('/en/reference/text-underline-offset')
  const offset = await scene(page, 'text-underline-offset', 'move-underline-away-from-text')
  for (const [i, value] of ['2px', '6px'].entries()) await expect(target(offset, i)).toHaveCSS('text-underline-offset', value)
  await sameGeometry(target(offset, 0), target(offset, 1))
  const pair = await scene(page, 'text-underline-offset', 'pair-with-decoration-thickness')
  for (const i of [0, 1]) await expect(target(pair, i)).toHaveCSS('text-underline-offset', '4px')
  const demo = example(page, 'text-underline-offset', 'reset-in-compact-contexts'), frame = await ready(demo)
  await viewport(demo, 360); await expect(target(frame)).toHaveCSS('text-underline-offset', '6px')
  await viewport(demo, 900); await expect(target(frame)).toHaveCSS('text-underline-offset', '0px')
  const item = target(await scene(page, 'text-underline-offset', 'apply-conditionally'))
  await state(page, item, 'text-underline-offset', '2px', '6px')
  await printed(page, browserName, item, 'text-underline-offset', '2px')
})

test('glyph fill preserves inheritance and clips a genuine gradient with a print fallback', async ({ page, browserName }) => {
  await page.goto('/en/reference/text-fill-color')
  const fill = await scene(page, 'text-fill-color', 'fill-text-with-a-color')
  expect(await css(target(fill, 0), '-webkit-text-fill-color')).toBe(await css(target(fill, 0), 'color'))
  expect(await css(target(fill, 1), '-webkit-text-fill-color')).not.toBe(await css(target(fill, 1), 'color'))
  await sameGeometry(target(fill, 0), target(fill, 1))
  const gradient = target(await scene(page, 'text-fill-color', 'make-text-fill-transparent'))
  await expect(gradient).toHaveCSS('-webkit-text-fill-color', 'rgba(0, 0, 0, 0)')
  await expect(gradient).toHaveCSS('background-clip', 'text')
  expect(await css(gradient, 'background-image')).toContain('linear-gradient')
  await expect(gradient).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  if (browserName === 'chromium') {
    await page.emulateMedia({ media: 'print' })
    expect(await css(gradient, '-webkit-text-fill-color')).toBe(await css(gradient, 'color'))
    await expect(gradient).toHaveCSS('background-image', 'none'); await page.emulateMedia({ media: 'screen' })
  }
  const child = target(await scene(page, 'text-fill-color', 'use-the-current-color'))
  expect(await css(child, '-webkit-text-fill-color')).toBe(await css(child, 'color'))
  expect(await child.evaluate(e => getComputedStyle(e.parentElement!).webkitTextFillColor)).not.toBe(await css(child, '-webkit-text-fill-color'))
  const item = target(await scene(page, 'text-fill-color', 'apply-conditionally')), before = await css(item, 'color')
  await state(page, item, '-webkit-text-fill-color', before)
  await printed(page, browserName, item, '-webkit-text-fill-color', before)
})

test('glyph shadows preserve box geometry and use an authored dark backdrop', async ({ page, browserName }) => {
  await page.goto('/en/reference/text-shadow')
  const shadow = await scene(page, 'text-shadow', 'add-a-text-shadow')
  await expect(target(shadow, 0)).toHaveCSS('text-shadow', 'none'); expect(await css(target(shadow, 1), 'text-shadow')).toContain('2px 4px')
  await sameGeometry(target(shadow, 0), target(shadow, 1))
  const backdrop = await scene(page, 'text-shadow', 'use-text-shadows-sparingly')
  expect(await target(backdrop, 0).evaluate(e => getComputedStyle(e.parentElement!).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)')
  await expect(target(backdrop, 1)).toHaveCSS('color', 'oklch(1 0 none)')
  await sameGeometry(target(backdrop, 0), target(backdrop, 1))
  const demo = example(page, 'text-shadow', 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 360); await expect(target(frame)).toHaveCSS('text-shadow', 'none')
  await viewport(demo, 900); await expect(target(frame)).not.toHaveCSS('text-shadow', 'none')
  await printed(page, browserName, target(frame), 'text-shadow', 'none')
})

test('stroke shorthand keeps real fill and edge paints in independent states', async ({ page, browserName }) => {
  await page.goto('/en/reference/text-stroke')
  const pair = await scene(page, 'text-stroke', 'set-stroke-width-and-color-together')
  await expect(target(pair, 0)).toHaveCSS('-webkit-text-stroke-width', '0px'); await expect(target(pair, 1)).toHaveCSS('-webkit-text-stroke-width', '1px')
  await sameGeometry(target(pair, 0), target(pair, 1))
  const outline = await scene(page, 'text-stroke', 'combine-stroke-with-transparent-fill')
  await expect(target(outline, 1)).toHaveCSS('-webkit-text-fill-color', 'rgba(0, 0, 0, 0)')
  await expect(target(outline, 1)).toHaveCSS('-webkit-text-stroke-width', '1px')
  expect(await css(target(outline, 1), '-webkit-text-stroke-color')).toBe(await css(target(outline, 1), 'color'))
  const item = target(await scene(page, 'text-stroke', 'split-width-and-color-when-states-differ'))
  await state(page, item, '-webkit-text-stroke-color', await css(item, '-webkit-text-stroke-color'), 'rgba(0, 0, 0, 0)')
  await expect(item).toHaveCSS('-webkit-text-stroke-width', '1px'); await expect(item).not.toHaveCSS('-webkit-text-fill-color', 'rgba(0, 0, 0, 0)')
  const demo = example(page, 'text-stroke', 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 360); await expect(target(frame)).toHaveCSS('-webkit-text-stroke-width', '1px')
  await viewport(demo, 900); await expect(target(frame)).toHaveCSS('-webkit-text-stroke-width', '2px')
  await printed(page, browserName, target(frame), '-webkit-text-stroke-width', '0px')
})

test('stroke color has a nonzero edge and transparent edges retain a solid label', async ({ page, browserName }) => {
  await page.goto('/en/reference/text-stroke-color')
  const pair = await scene(page, 'text-stroke-color', 'set-text-stroke-color')
  expect(await css(target(pair, 0), '-webkit-text-stroke-color')).not.toBe(await css(target(pair, 1), '-webkit-text-stroke-color'))
  const current = await scene(page, 'text-stroke-color', 'use-the-current-color')
  for (const i of [0, 1]) {
    await expect(target(current, i)).toHaveCSS('-webkit-text-stroke-width', '1px')
    expect(await css(target(current, i), '-webkit-text-stroke-color')).toBe(await css(target(current, i), 'color'))
  }
  const transparent = await scene(page, 'text-stroke-color', 'make-the-stroke-transparent')
  await expect(target(transparent, 1)).toHaveCSS('-webkit-text-stroke-color', 'rgba(0, 0, 0, 0)')
  await expect(target(transparent, 1)).not.toHaveCSS('-webkit-text-fill-color', 'rgba(0, 0, 0, 0)')
  await sameGeometry(target(transparent, 0), target(transparent, 1))
  const item = target(await scene(page, 'text-stroke-color', 'apply-conditionally'))
  await state(page, item, '-webkit-text-stroke-color', await css(item, '-webkit-text-stroke-color'))
  await printed(page, browserName, item, '-webkit-text-stroke-color', 'rgba(0, 0, 0, 0)')
})

test('stroke widths leave font geometry unchanged and zero width removes the edge in print', async ({ page, browserName }) => {
  await page.goto('/en/reference/text-stroke-width')
  const widths = await scene(page, 'text-stroke-width', 'set-text-stroke-width')
  for (const [i, width] of ['0px', '1px', '2px'].entries()) {
    await expect(target(widths, i)).toHaveCSS('-webkit-text-stroke-width', width)
    await sameGeometry(target(widths, 0), target(widths, i))
  }
  const aliases = await scene(page, 'text-stroke-width', 'use-the-explicit-property-name')
  for (const i of [0, 1]) await expect(target(aliases, i)).toHaveCSS('-webkit-text-stroke-width', '1px')
  const reset = target(await scene(page, 'text-stroke-width', 'remove-the-stroke-width'))
  await expect(reset).toHaveCSS('-webkit-text-stroke-width', '1px')
  await printed(page, browserName, reset, '-webkit-text-stroke-width', '0px')
  const item = target(await scene(page, 'text-stroke-width', 'apply-conditionally'))
  await expect(item).toHaveAccessibleName('Outline')
  await state(page, item, '-webkit-text-stroke-width', '1px', '2px')
  await printed(page, browserName, item, '-webkit-text-stroke-width', '0px')
})

for (const route of routes) {
  test(`text-effects composition: ${route}`, async ({ page }, testInfo) => {
    const failures: string[] = []
    page.on('pageerror', error => failures.push(error.message))
    page.on('console', message => { if (message.type() === 'error' && /hydration|hydrate|mismatch/i.test(message.text())) failures.push(message.text()) })
    await page.goto(`/en/reference/${route}`)
    await page.addStyleTag({ content: 'nextjs-portal { visibility: hidden }' })
    for (const [index, demo] of (await page.locator('[data-demo-case]').all()).entries()) {
      const frame = await ready(demo)
      expect(await frame.locator('body').evaluate(e => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1)
      for (const item of await frame.locator('[data-target]').all()) {
        await expect(item).toHaveAttribute('data-appearance', 'plain')
        await expect(item).toHaveCSS('outline-style', 'none')
      }
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
