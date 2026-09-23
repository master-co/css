import { expect, test, type FrameLocator, type Locator, type Page } from '@playwright/test'

const routes = ['border', 'border-color', 'border-style', 'border-width', 'border-radius', 'outline', 'outline-color', 'outline-style', 'outline-width', 'outline-offset', 'box-shadow']
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
async function sameColor(item: Locator, property: string) {
  expect(await item.evaluate((e, p) => getComputedStyle(e).getPropertyValue(p), property)).toBe(await item.evaluate(e => getComputedStyle(e).color))
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

test('border shorthand resets components and logical axes follow writing mode', async ({ page, browserName }) => {
  await page.goto('/en/reference/border')
  const main = target(await scene(page, 'border', 'set-width-style-and-color-together'))
  await expect(main).toHaveCSS('border-top-width', '2px'); expect(await size(main)).toEqual({ width: 240, height: 96 })
  const axes = await scene(page, 'border', 'set-one-side-or-one-axis')
  await expect(target(axes, 0)).toHaveCSS('border-bottom-width', '3px'); await expect(target(axes, 0)).toHaveCSS('border-top-width', '0px')
  await expect(target(axes, 1)).toHaveCSS('border-left-width', '3px'); await expect(target(axes, 1)).toHaveCSS('border-top-width', '0px')
  await expect(target(axes, 2)).toHaveCSS('writing-mode', 'vertical-rl'); await expect(target(axes, 2)).toHaveCSS('border-top-width', '3px'); await expect(target(axes, 2)).toHaveCSS('border-left-width', '0px')
  const pair = await scene(page, 'border', 'use-focused-border-utilities')
  for (const i of [0, 1]) {
    const item = target(pair, i), before = await size(item), color = await item.evaluate(e => getComputedStyle(e).borderTopColor)
    await keyboard(page, item)
    await expect(item).toHaveCSS('border-top-style', i ? 'solid' : 'dashed')
    if (i) await sameColor(item, 'border-top-color')
    else { await expect(item).toHaveCSS('border-top-width', '6px'); await expect(item).toHaveCSS('border-top-color', color) }
    expect((await size(item)).width).toBeGreaterThan(before.width)
  }
  const condition = target(await scene(page, 'border', 'apply-conditionally'))
  await keyboard(page, condition); await expect(condition).toHaveCSS('border-top-style', 'dashed')
  await print(page, browserName, condition, 'border-top-width', '0px')
})

test('border color preserves geometry, currentColor and configured theme scope', async ({ page, browserName }) => {
  await page.goto('/en/reference/border-color')
  const pair = await scene(page, 'border-color', 'use-side-specific-color-utilities')
  expect(await size(target(pair, 0))).toEqual(await size(target(pair, 1)))
  await expect(target(pair, 1)).toHaveCSS('border-top-width', '6px'); await expect(target(pair, 1)).toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)')
  const current = target(await scene(page, 'border-color', 'follow-the-current-text-color'))
  await sameColor(current, 'border-top-color'); const before = await current.evaluate(e => getComputedStyle(e).color)
  await keyboard(page, current); await sameColor(current, 'border-top-color'); await expect(current).not.toHaveCSS('color', before)
  const demo = example(page, 'border-color', 'apply-conditionally'), responsive = target(await ready(demo))
  await viewport(demo, 390); const narrow = await responsive.evaluate(e => getComputedStyle(e).borderTopColor)
  await viewport(demo, 900); await sameColor(responsive, 'border-top-color'); await expect(responsive).not.toHaveCSS('border-top-color', narrow)
  await print(page, browserName, responsive, 'border-top-color', 'rgba(0, 0, 0, 0)')
  const configured = example(page, 'border-color', 'customize-line-colors'), item = target(await ready(configured)), first = await item.evaluate(e => getComputedStyle(e).borderTopColor)
  await expect(item).toHaveCSS('border-top-style', 'solid'); await expect(item).toHaveCSS('border-top-width', '2px')
  await configured.getByRole('button', { name: 'Theme', exact: true }).click(); await expect(item).not.toHaveCSS('border-top-color', first)
  expect(await item.evaluate(e => getComputedStyle(e).getPropertyValue('--color-line-divider'))).not.toBe('')
})

test('border styles expose actual patterns and zero used widths without hidden prerequisites', async ({ page, browserName }) => {
  await page.goto('/en/reference/border-style')
  const patterns = await scene(page, 'border-style', 'use-dashed-or-dotted-borders')
  await expect(target(patterns, 0)).toHaveCSS('border-top-style', 'dashed'); await expect(target(patterns, 1)).toHaveCSS('border-top-style', 'dotted')
  const removed = await scene(page, 'border-style', 'remove-border-style')
  expect(await size(target(removed, 0))).toEqual({ width: 204, height: 92 })
  for (const i of [1, 2]) { await expect(target(removed, i)).toHaveCSS('border-top-width', '0px'); expect(await size(target(removed, i))).toEqual({ width: 192, height: 80 }) }
  const condition = target(await scene(page, 'border-style', 'apply-conditionally')), before = await size(condition)
  await keyboard(page, condition); await expect(condition).toHaveCSS('border-top-style', 'dashed'); expect(await size(condition)).toEqual(before)
  await print(page, browserName, condition, 'border-top-width', '0px')
})

test('border widths change the authored content area and respect physical versus block axes', async ({ page, browserName }) => {
  await page.goto('/en/reference/border-width')
  const pair = await scene(page, 'border-width', 'set-border-width')
  expect(await size(target(pair, 0))).toEqual(await size(target(pair, 1)))
  await expect(target(pair, 1)).toHaveCSS('border-top-width', '8px')
  const axes = await scene(page, 'border-width', 'set-one-side-or-axis')
  await expect(target(axes, 0)).toHaveCSS('border-top-width', '6px'); await expect(target(axes, 0)).toHaveCSS('border-bottom-width', '0px')
  await expect(target(axes, 1)).toHaveCSS('border-top-width', '6px'); await expect(target(axes, 1)).toHaveCSS('border-left-width', '0px')
  await expect(target(axes, 2)).toHaveCSS('border-left-width', '6px'); await expect(target(axes, 2)).toHaveCSS('border-top-width', '0px')
  const demo = example(page, 'border-width', 'apply-conditionally'), item = target(await ready(demo)), before = await size(item)
  await viewport(demo, 390); await expect(item).toHaveCSS('border-top-width', '0px')
  await viewport(demo, 900); await expect(item).toHaveCSS('border-top-width', '6px'); expect(await size(item)).toEqual(before)
  await print(page, browserName, item, 'border-top-width', '0px')
})

test('radius preserves includes, accessible controls, aspect ratio and explicit child clipping', async ({ page, browserName }) => {
  await page.goto('/en/reference/border-radius')
  const icon = target(await scene(page, 'border-radius', 'create-an-icon-button'))
  await expect(icon).toHaveAccessibleName('Move up'); await expect(icon).toHaveCSS('aspect-ratio', '1 / 1'); expect(await size(icon)).toEqual({ width: 48, height: 48 })
  await keyboard(page, icon); await expect(icon).toHaveCSS('outline-style', 'solid')
  const pill = target(await scene(page, 'border-radius', 'create-a-pill-button'))
  await expect(pill).toHaveAccessibleName('Submit'); expect((await size(pill)).width).toBeGreaterThan((await size(pill)).height)
  const clip = await scene(page, 'border-radius', 'use-a-radius-token')
  for (const i of [0, 1]) { await expect(target(clip, i)).toHaveCSS('border-radius', '16px'); expect(await target(clip, i).locator('img').evaluate((e: HTMLImageElement) => e.naturalWidth)).toBe(320) }
  await expect(target(clip, 0)).toHaveCSS('overflow', 'visible'); await expect(target(clip, 1)).toHaveCSS('overflow', 'hidden')
  const squarePixels = await pixels(page, target(clip, 0), [[2, 2], [30, 2]]), roundPixels = await pixels(page, target(clip, 1), [[2, 2], [30, 2]])
  expect(distance(squarePixels[0], squarePixels[1])).toBeLessThan(2); expect(distance(roundPixels[0], roundPixels[1])).toBeGreaterThan(20)
  const corners = await scene(page, 'border-radius', 'round-individual-corners')
  await expect(target(corners, 0)).toHaveCSS('border-bottom-left-radius', '0px'); await expect(target(corners, 1)).toHaveCSS('border-top-left-radius', '0px')
  const custom = target(await scene(page, 'border-radius', 'use-custom-border-radius')); await expect(custom).toHaveCSS('border-radius', '18px')
  const demo = example(page, 'border-radius', 'apply-conditionally'), item = target(await ready(demo))
  await viewport(demo, 390); await expect(item).toHaveCSS('border-radius', '4px')
  await viewport(demo, 900); await expect(item).toHaveCSS('border-radius', '12px')
  await print(page, browserName, item, 'border-radius', '0px')
})

test('outline shorthand resets independent components while actual keyboard focus keeps geometry', async ({ page, browserName }) => {
  await page.goto('/en/reference/outline')
  const pair = await scene(page, 'outline', 'set-the-full-outline-shorthand')
  await expect(target(pair, 0)).toHaveCSS('outline-width', '4px'); await sameColor(target(pair, 1), 'outline-color'); await expect(target(pair, 1)).toHaveCSS('outline-offset', '4px')
  expect(await size(target(pair, 0))).toEqual(await size(target(pair, 1)))
  const focus = target(await scene(page, 'outline', 'keep-outlines-for-focus')), before = await size(focus)
  await expect(focus).toHaveAccessibleName('Save changes'); await expect(focus).toHaveCSS('outline-color', 'rgba(0, 0, 0, 0)')
  await keyboard(page, focus); await expect(focus).not.toHaveCSS('outline-color', 'rgba(0, 0, 0, 0)'); expect(await size(focus)).toEqual(before)
  const condition = target(await scene(page, 'outline', 'apply-conditionally'))
  await keyboard(page, condition); await expect(condition).toHaveCSS('outline-width', '3px')
  await print(page, browserName, condition, 'outline-width', '0px')
})

test('outline color follows its own foreground and uses real focus and forced colors', async ({ page, browserName }) => {
  await page.goto('/en/reference/outline-color')
  const current = target(await scene(page, 'outline-color', 'inherit-the-text-color'))
  await sameColor(current, 'outline-color'); const before = await current.evaluate(e => getComputedStyle(e).color)
  await keyboard(page, current); await sameColor(current, 'outline-color'); await expect(current).not.toHaveCSS('color', before)
  const condition = target(await scene(page, 'outline-color', 'apply-conditionally'))
  await expect(condition).toHaveCSS('outline-color', 'rgba(0, 0, 0, 0)'); await keyboard(page, condition)
  await expect(condition).not.toHaveCSS('outline-color', 'rgba(0, 0, 0, 0)'); await expect(condition).toHaveCSS('outline-width', '3px')
  if (browserName === 'chromium') {
    await page.emulateMedia({ media: 'print' }); await sameColor(condition, 'outline-color')
    await page.emulateMedia({ media: 'screen', forcedColors: 'active' }); await expect(condition).toHaveCSS('outline-style', 'solid'); await expect(condition).not.toHaveCSS('outline-color', 'rgba(0, 0, 0, 0)')
    await page.emulateMedia({ forcedColors: 'none' })
  }
})

test('outline style uses real longhands and a working native skip link', async ({ page, browserName }) => {
  await page.goto('/en/reference/outline-style')
  const pair = await scene(page, 'outline-style', 'set-outline-style')
  await expect(target(pair, 0)).toHaveCSS('outline-style', 'solid'); await expect(target(pair, 1)).toHaveCSS('outline-style', 'dashed')
  for (const i of [0, 1]) await expect(target(pair, i)).toHaveCSS('outline-width', '3px')
  const linkFrame = await scene(page, 'outline-style', 'use-dashed-focus-indicators'), link = target(linkFrame)
  await expect(link).toHaveAccessibleName('Skip to content'); await expect(link).toHaveAttribute('href', 'about:srcdoc#destination')
  await keyboard(page, link); await expect(link).toHaveCSS('outline-style', 'dashed'); await page.keyboard.press('Enter')
  await expect(linkFrame.locator('#destination')).toBeFocused()
  const condition = target(await scene(page, 'outline-style', 'apply-conditionally'))
  await keyboard(page, condition); await expect(condition).toHaveCSS('outline-style', 'dotted'); await expect(condition).toHaveCSS('outline-width', '3px')
  await print(page, browserName, condition, 'outline-style', 'none')
})

test('outline widths report actual native keywords without altering layout boxes', async ({ page, browserName }) => {
  await page.goto('/en/reference/outline-width')
  const pair = await scene(page, 'outline-width', 'set-outline-width')
  expect(await size(target(pair, 0))).toEqual(await size(target(pair, 1)))
  await expect(target(pair, 1)).toHaveCSS('outline-width', '6px')
  const keywords = await scene(page, 'outline-width', 'use-keyword-widths'), widths = []
  for (const i of [0, 1, 2]) { await expect(target(keywords, i)).toHaveCSS('outline-style', 'solid'); widths.push(await target(keywords, i).evaluate(e => parseFloat(getComputedStyle(e).outlineWidth))) }
  expect(widths[0]).toBeGreaterThan(0); expect(widths[1]).toBeGreaterThanOrEqual(widths[0]); expect(widths[2]).toBeGreaterThanOrEqual(widths[1])
  const condition = target(await scene(page, 'outline-width', 'apply-conditionally')), before = await size(condition)
  await keyboard(page, condition); await expect(condition).toHaveCSS('outline-width', '4px'); expect(await size(condition)).toEqual(before)
  await print(page, browserName, condition, 'outline-width', '0px')
})

test('positive and negative outline offsets move paint without resizing native controls', async ({ page, browserName }) => {
  await page.goto('/en/reference/outline-offset')
  const outward = await scene(page, 'outline-offset', 'move-an-outline-away-from-the-element')
  await expect(target(outward, 1)).toHaveCSS('outline-offset', '8px'); expect(await size(target(outward, 0))).toEqual(await size(target(outward, 1)))
  const inward = await scene(page, 'outline-offset', 'pull-an-outline-inward')
  await expect(target(inward, 1)).toHaveCSS('outline-offset', '-4px'); expect(await size(target(inward, 0))).toEqual(await size(target(inward, 1)))
  const condition = target(await scene(page, 'outline-offset', 'apply-conditionally')), before = await size(condition)
  await keyboard(page, condition); await expect(condition).toHaveCSS('outline-offset', '8px'); expect(await size(condition)).toEqual(before)
  await print(page, browserName, condition, 'outline-offset', '0px')
})

test('shadow tokens compile their real theme while raw and inset layers remain explicit', async ({ page, browserName }) => {
  await page.goto('/en/reference/box-shadow')
  for (const id of ['use-shadow-tokens', 'customize-mode-specific-tokens']) {
    const demo = example(page, 'box-shadow', id), frame = await ready(demo), item = target(frame, id === 'use-shadow-tokens' ? 0 : undefined), before = await item.evaluate(e => getComputedStyle(e).boxShadow), box = await size(item)
    expect(before).not.toBe('none'); await demo.getByRole('button', { name: 'Theme', exact: true }).click()
    await expect(item).not.toHaveCSS('box-shadow', before); expect(await size(item)).toEqual(box)
  }
  const rawDemo = example(page, 'box-shadow', 'use-raw-values'), raw = target(await ready(rawDemo)), before = await raw.evaluate(e => getComputedStyle(e).boxShadow)
  await rawDemo.getByRole('button', { name: 'Theme', exact: true }).click(); await expect(raw).toHaveCSS('box-shadow', before)
  const inset = await scene(page, 'box-shadow', 'use-inset-shadows')
  await expect(target(inset, 0)).not.toHaveCSS('box-shadow', /inset/); await expect(target(inset, 1)).toHaveCSS('box-shadow', /inset/); expect(await size(target(inset, 0))).toEqual(await size(target(inset, 1)))
  const condition = target(await scene(page, 'box-shadow', 'apply-conditionally')), initial = await condition.evaluate(e => getComputedStyle(e).boxShadow), box = await size(condition)
  await keyboard(page, condition); await expect(condition).not.toHaveCSS('box-shadow', initial); expect(await size(condition)).toEqual(box)
  await expect(condition).toHaveCSS('outline-style', 'solid'); await print(page, browserName, condition, 'box-shadow', 'none')
})

for (const route of routes) {
  test(`edge composition: ${route}`, async ({ page }, testInfo) => {
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
