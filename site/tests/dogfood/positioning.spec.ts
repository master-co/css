import { expect, test, type Locator, type Page } from '@playwright/test'

async function ready(demo: Locator) {
  await demo.scrollIntoViewIfNeeded()
  await expect(demo.locator('iframe')).toHaveAttribute('data-ready', 'true')
  await demo.locator('iframe').evaluate(async (element: HTMLIFrameElement) => { await element.contentDocument!.fonts.ready })
  return demo.frameLocator('iframe')
}

const example = (page: Page, route: string, section: string) => page.locator(`[data-demo-case="${route}#${section}"]`)

async function scrollWithInput(scroller: Locator, page: Page, browserName: string, isMobile: boolean, horizontal = false) {
  await scroller.focus()
  await expect(scroller).toBeFocused()
  // WebKit automation ignores arrow scrolling and has no mobile wheel API.
  // Mobile geometry uses the native scroll API; real touch gestures need a device.
  if (browserName === 'webkit' && isMobile) {
    await scroller.evaluate((element, x) => element.scrollBy(x ? 120 : 0, x ? 0 : 120), horizontal)
  } else if (browserName === 'webkit') {
    await scroller.hover()
    await page.mouse.wheel(horizontal ? 120 : 0, horizontal ? 0 : 120)
  } else await scroller.press(horizontal ? 'ArrowRight' : 'ArrowDown')
  await expect.poll(() => scroller.evaluate(element => element.scrollTop + element.scrollLeft)).toBeGreaterThan(0)
}

test('static ignores insets and relative preserves its original flow slot', async ({ page }) => {
  await page.goto('/en/reference/position')
  for (const [kind, offset] of [['static', 0], ['relative', 20]] as const) {
    const frame = await ready(example(page, 'position', `positioning-elements-as-${kind}`))
    const geometry = await frame.locator('[data-ui="original-slot"]').evaluate(element => {
      const slot = element.getBoundingClientRect()
      const target = element.firstElementChild!.getBoundingClientRect()
      const next = element.nextElementSibling!.getBoundingClientRect()
      return { x: target.left - slot.left, y: target.top - slot.top, gap: next.top - slot.bottom, height: slot.height }
    })
    expect(geometry).toEqual({ x: offset, y: offset, gap: 24, height: 64 })
  }
  const demo = example(page, 'position', 'apply-conditionally')
  const frame = await ready(demo)
  await demo.getByLabel('Viewport', { exact: true }).fill('300')
  const target = frame.locator('[data-target]')
  await expect(target).toHaveCSS('position', 'static')
  const before = await target.boundingBox()
  await target.focus()
  await expect(target).toHaveCSS('position', 'absolute')
  expect((await target.boundingBox())!.y).toBeGreaterThan(before!.y)
  await page.keyboard.press('Tab')
  await demo.getByLabel('Viewport', { exact: true }).fill('900')
  await expect(target).toHaveCSS('position', 'absolute')
})

test('fixed and sticky use their actual viewport and scroll container', async ({ page, browserName, isMobile }) => {
  await page.goto('/en/reference/position')
  const fixed = await ready(example(page, 'position', 'positioning-elements-as-fixed'))
  const input = fixed.getByRole('searchbox', { name: 'Filter assets' })
  const before = await input.evaluate(element => element.getBoundingClientRect().top)
  await input.evaluate(element => element.ownerDocument.defaultView!.scrollTo(0, 300))
  await expect.poll(() => input.evaluate(element => element.ownerDocument.defaultView!.scrollY)).toBe(300)
  expect(await input.evaluate(element => element.getBoundingClientRect().top)).toBe(before)
  const sticky = await ready(example(page, 'position', 'positioning-elements-as-sticky'))
  const scroller = sticky.getByLabel('Scrollable asset list')
  await scrollWithInput(scroller, page, browserName, isMobile)
  await scroller.evaluate(element => { element.scrollTop = 160 })
  expect(await scroller.evaluate(element => element.querySelector('[data-target]')!.getBoundingClientRect().top - element.getBoundingClientRect().top)).toBe(1)
})

test('inset stretches automatic dimensions and changes all four real edges', async ({ page }) => {
  await page.goto('/en/reference/inset')
  for (const [id, inset] of [['pin-all-sides', 16], ['center-overlays-with-inset', 0]] as const) {
    const frame = await ready(example(page, 'inset', id))
    const edges = await frame.locator('[data-target]').evaluate(element => {
      const box = element.getBoundingClientRect(), parent = element.parentElement!.getBoundingClientRect()
      return [box.top - parent.top, parent.right - box.right, parent.bottom - box.bottom, box.left - parent.left]
    })
    expect(edges).toEqual([inset, inset, inset, inset])
  }
  const demo = example(page, 'inset', 'apply-conditionally')
  const target = (await ready(demo)).locator('[data-target]')
  await demo.getByLabel('Viewport', { exact: true }).fill('300')
  await expect(target).toHaveCSS('top', '12px')
  await target.focus()
  await expect(target).toHaveCSS('top', '32px')
  await page.keyboard.press('Tab')
  await demo.getByLabel('Viewport', { exact: true }).fill('900')
  await expect(target).toHaveCSS('top', '24px')
})

test('stacking contexts constrain children and focus changes actual paint order', async ({ page }) => {
  await page.goto('/en/reference/z-index')
  const local = await ready(example(page, 'z-index', 'prefer-local-stacking-contexts'))
  expect(await local.getByText('Child 99', { exact: true }).evaluate(element => {
    const rect = element.getBoundingClientRect()
    return element.ownerDocument.elementFromPoint(rect.left + 64, rect.top + 64)?.textContent
  })).toBe('Sibling 1')
  const demo = example(page, 'z-index', 'apply-conditionally')
  const frame = await ready(demo)
  await demo.getByLabel('Viewport', { exact: true }).fill('300')
  const blue = frame.locator('[data-target]')
  const painted = () => blue.evaluate(element => {
    const box = element.getBoundingClientRect()
    return element.ownerDocument.elementFromPoint(box.left + 64, box.top + 64)?.textContent
  })
  expect(await painted()).toBe('Layer 10')
  await blue.focus()
  await expect(blue).toHaveCSS('z-index', '20')
  expect(await painted()).toBe('Focus with Tab')
  await page.keyboard.press('Tab')
  await demo.getByLabel('Viewport', { exact: true }).fill('900')
  expect(await painted()).toBe('Focus with Tab')
})

test('isolation excludes the external backdrop and resets with a real condition', async ({ page }) => {
  await page.goto('/en/reference/isolation')
  const frame = await ready(example(page, 'isolation', 'create-a-stacking-context'))
  await expect(frame.locator('[data-target]')).toHaveCSS('isolation', 'isolate')
  const layers = frame.locator('[data-ui="blend-layer"]')
  await expect(layers.first()).toHaveCSS('mix-blend-mode', 'multiply')
  const colors = await layers.evaluateAll(elements => elements.map(element => getComputedStyle(element).backgroundColor))
  expect(colors[0]).toBe(colors[1])
  // Identical source colors produce different pixels because the backdrop is external.
  expect(await layers.first().screenshot()).not.toEqual(await layers.last().screenshot())
  const demo = example(page, 'isolation', 'return-to-automatic-isolation')
  const target = (await ready(demo)).locator('[data-target]')
  await demo.getByLabel('Viewport', { exact: true }).fill('300')
  await expect(target).toHaveCSS('isolation', 'isolate')
  await demo.getByLabel('Viewport', { exact: true }).fill('900')
  await expect(target).toHaveCSS('isolation', 'auto')
  const conditional = example(page, 'isolation', 'apply-conditionally')
  const focusTarget = (await ready(conditional)).locator('[data-target]')
  await conditional.getByLabel('Viewport', { exact: true }).fill('300')
  await expect(focusTarget).toHaveCSS('isolation', 'auto')
  await focusTarget.focus()
  await expect(focusTarget).toHaveCSS('isolation', 'isolate')
})

test('hidden scrolls programmatically while clip does not; overflow conditions respect print', async ({ page, browserName, isMobile }) => {
  await page.goto('/en/reference/overflow')
  for (const [id, scrolls] of [['hide-overflowing-content', true], ['clip-without-scrolling', false]] as const) {
    const frame = await ready(example(page, 'overflow', id))
    const target = frame.locator('[data-target]')
    await frame.getByRole('button', { name: 'Scroll to end' }).focus()
    await page.keyboard.press('Enter')
    const offsets = await target.evaluate(element => [element.scrollLeft, element.scrollTop])
    expect(offsets.every(value => value > 0)).toBe(scrolls)
    if (!scrolls) expect(offsets).toEqual([0, 0])
    await frame.getByRole('button', { name: 'Reset' }).click()
    expect(await target.evaluate(element => [element.scrollLeft, element.scrollTop])).toEqual([0, 0])
  }
  const scrollers = await ready(example(page, 'overflow', 'create-a-scroll-container'))
  for (const label of ['Vertical collection', 'Horizontal collection']) {
    const scroller = scrollers.getByLabel(label, { exact: true })
    await scrollWithInput(scroller, page, browserName, isMobile, label.startsWith('Horizontal'))
  }
  const ellipsis = (await ready(example(page, 'overflow', 'truncate-a-single-line'))).locator('[data-target]')
  await expect(ellipsis).toHaveCSS('text-overflow', 'ellipsis')
  expect(await ellipsis.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true)
  const demo = example(page, 'overflow', 'apply-conditionally')
  const target = (await ready(demo)).locator('[data-target]')
  await demo.getByLabel('Viewport', { exact: true }).fill('300')
  await expect(target).toHaveCSS('overflow', 'hidden')
  await demo.getByLabel('Viewport', { exact: true }).fill('900')
  await expect(target).toHaveCSS('overflow', 'auto')
  await page.emulateMedia({ media: 'print' })
  await expect(target).toHaveCSS('overflow', 'visible')
})

for (const route of ['position', 'inset', 'z-index', 'isolation', 'overflow']) {
  test(`positioning composition: ${route}`, async ({ page }, testInfo) => {
    const failures: string[] = []
    page.on('pageerror', error => failures.push(error.message))
    await page.goto(`/en/reference/${route}`)
    await page.addStyleTag({ content: 'nextjs-portal { visibility: hidden }' })
    for (const [index, demo] of (await page.locator('.site-demo').all()).entries()) {
      if (await demo.locator('iframe').count()) await ready(demo)
      await demo.evaluate(element => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 96))
      await demo.screenshot({ path: testInfo.outputPath(`demo-${index}.png`), scale: 'css' })
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
    expect(failures).toEqual([])
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: testInfo.outputPath('page.png'), fullPage: true, scale: 'css' })
  })
}

for (const width of [390, 768, 1280]) {
  test(`positioning gallery at ${width}px`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-light' && testInfo.project.name !== 'desktop-dark', 'Gallery captures use the desktop browser at explicit widths.')
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/en/design-system')
    await page.addStyleTag({ content: 'nextjs-portal { visibility: hidden }' })
    for (const [index, recipe] of (await page.locator('.demo-recipe').all()).entries()) {
      const summary = recipe.locator(':scope > summary')
      await summary.focus()
      await summary.press('Enter')
      await ready(recipe)
      await recipe.evaluate(element => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 96))
      await recipe.screenshot({ path: testInfo.outputPath(`recipe-${index}.png`), scale: 'css', caret: 'initial' })
      await summary.press('Enter')
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  })
}
