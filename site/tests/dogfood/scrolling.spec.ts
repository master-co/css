import { expect, test, type Locator, type Page } from '@playwright/test'

const example = (page: Page, route: string, section: string) => page.locator(`[data-demo-case="${route}#${section}"]`)
async function ready(demo: Locator) {
  await demo.scrollIntoViewIfNeeded()
  await expect(demo.locator('iframe')).toHaveAttribute('data-ready', 'true')
  await demo.locator('iframe').evaluate(async (element: HTMLIFrameElement) => { await element.contentDocument!.fonts.ready })
  return demo.frameLocator('iframe')
}
async function inset(target: Locator, horizontal = false) {
  return target.evaluate((element, x) => {
    const port = element.closest('#scrollport')!, a = element.getBoundingClientRect(), b = port.getBoundingClientRect()
    return Math.round(x ? a.left - b.left - port.clientLeft : a.top - b.top - port.clientTop)
  }, horizontal)
}

test('scroll margin offsets the target without changing its layout size', async ({ page }) => {
  await page.goto('/en/reference/scroll-margin')
  for (const [id, amount, horizontal] of [['offset-anchor-targets', 64, false], ['add-horizontal-snap-margin', 16, true], ['use-all-side-margin-for-compact-cases', 12, false]] as const) {
    const frame = await ready(example(page, 'scroll-margin', id))
    const target = frame.locator('[data-target]')
    const size = await target.evaluate(element => [element.clientWidth, element.clientHeight])
    await frame.getByRole('button', { name: horizontal ? 'Panel 2' : 'Details', exact: true }).click()
    await expect.poll(() => inset(target, horizontal)).toBe(amount)
    expect(await target.evaluate(element => [element.clientWidth, element.clientHeight])).toEqual(size)
    await expect(frame.locator('[data-scroll-offset]')).toHaveText(`${amount} px`)
  }
  const demo = example(page, 'scroll-margin', 'apply-conditionally')
  const frame = await ready(demo)
  for (const [width, amount] of [[300, 16], [900, 32]]) {
    await demo.getByLabel('Viewport', { exact: true }).fill(String(width))
    await frame.getByRole('button', { name: 'Details', exact: true }).click()
    await expect.poll(() => inset(frame.locator('[data-target]'))).toBe(amount)
  }
})

test('scroll padding changes the viewing region and ordinary padding creates edge space', async ({ page }) => {
  await page.goto('/en/reference/scroll-padding')
  for (const [id, amount, horizontal] of [['pad-the-scroll-container', 12, false], ['reserve-space-for-fixed-headers', 64, false], ['pad-horizontal-snapping', 16, true]] as const) {
    const frame = await ready(example(page, 'scroll-padding', id))
    if (horizontal) expect(await inset(frame.locator('#panel-1'), true)).toBe(16)
    await frame.getByRole('button', { name: horizontal ? 'Panel 2' : 'Details', exact: true }).click()
    await expect.poll(() => inset(frame.locator(horizontal ? '#panel-2' : '#details'), horizontal)).toBe(amount)
    await expect(frame.locator('[data-scroll-offset]')).toHaveText(`${amount} px`)
  }
  const demo = example(page, 'scroll-padding', 'apply-conditionally')
  const frame = await ready(demo)
  for (const [width, amount] of [[300, 12], [900, 32]]) {
    await demo.getByLabel('Viewport', { exact: true }).fill(String(width))
    await frame.getByRole('button', { name: 'Details', exact: true }).click()
    await expect.poll(() => inset(frame.locator('#details'))).toBe(amount)
  }
})

test('native destination links scroll within the specimen and respect reduced motion', async ({ page, browserName }) => {
  await page.goto('/en/reference/scroll-behavior')
  const demo = example(page, 'scroll-behavior', 'enable-smooth-anchor-scrolling')
  const frame = await ready(demo)
  const port = frame.locator('#scrollport')
  await expect(port).toHaveCSS('scroll-behavior', 'smooth')
  await demo.evaluate(element => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 96))
  const pageTop = await page.evaluate(() => scrollY)
  const before = await demo.locator('iframe').evaluate((element: HTMLIFrameElement) => element.contentWindow!.location.href)
  const samples = port.evaluate(element => new Promise<number[]>(resolve => {
    const values: number[] = []
    const end = performance.now() + 900
    const sample = () => { values.push(element.scrollTop); if (performance.now() < end) requestAnimationFrame(sample); else resolve(values) }
    sample()
  }))
  await frame.getByRole('link', { name: 'Details', exact: true }).click()
  await expect.poll(() => inset(frame.locator('#details'))).toBe(0)
  const offsets = await samples
  if (browserName === 'chromium') expect(new Set(offsets.filter(value => value > 0 && value < 256)).size).toBeGreaterThan(2)
  expect(await demo.locator('iframe').evaluate((element: HTMLIFrameElement) => element.contentWindow!.location.href)).toBe(before)
  expect(await page.evaluate(() => scrollY)).toBe(pageTop)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(port).toHaveCSS('scroll-behavior', 'auto')
  await expect(demo.locator('.demo-viewport-toolbar')).toContainText('scroll-behavior: auto')
  await frame.getByRole('link', { name: 'Overview', exact: true }).click()
  await expect.poll(() => port.evaluate(element => element.scrollTop)).toBe(0)
  const offsetDemo = example(page, 'scroll-behavior', 'combine-with-scroll-offsets')
  const offsetFrame = await ready(offsetDemo)
  await offsetFrame.getByRole('link', { name: 'Details', exact: true }).click()
  await expect.poll(() => inset(offsetFrame.locator('#details'))).toBe(64)
  const conditional = example(page, 'scroll-behavior', 'apply-conditionally')
  const conditionFrame = await ready(conditional)
  await conditional.getByLabel('Viewport', { exact: true }).fill('900')
  await expect(conditionFrame.locator('#scrollport')).toHaveCSS('scroll-behavior', 'auto')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(conditionFrame.locator('#scrollport')).toHaveCSS('scroll-behavior', 'smooth')
  await conditional.getByLabel('Viewport', { exact: true }).fill('300')
  await expect(conditionFrame.locator('#scrollport')).toHaveCSS('scroll-behavior', 'auto')
})

test('snap alignment chooses real start, center and non-snapping positions', async ({ page }) => {
  await page.goto('/en/reference/scroll-snap-align')
  const start = await ready(example(page, 'scroll-snap-align', 'align-a-snap-item-to-the-start'))
  await start.getByRole('button', { name: 'Panel 2', exact: true }).click()
  await expect.poll(() => inset(start.locator('#panel-2'), true)).toBe(0)
  const center = await ready(example(page, 'scroll-snap-align', 'center-snap-items'))
  await center.getByRole('button', { name: 'Panel 4', exact: true }).click()
  await expect.poll(() => center.locator('#panel-4').evaluate(element => {
    const box = element.getBoundingClientRect(), port = element.parentElement!.getBoundingClientRect()
    return Math.round(box.left + box.width / 2 - port.left - port.width / 2)
  })).toBe(0)
  const disabled = await ready(example(page, 'scroll-snap-align', 'disable-item-snapping'))
  await expect(disabled.locator('#panel-2')).toHaveCSS('scroll-snap-align', 'none')
  await disabled.getByRole('button', { name: 'Panel 2', exact: true }).click()
  expect(await inset(disabled.locator('#panel-2'), true)).not.toBe(0)
  const demo = example(page, 'scroll-snap-align', 'apply-conditionally')
  const frame = await ready(demo)
  await demo.getByLabel('Viewport', { exact: true }).fill('900')
  await expect(frame.locator('#panel-4')).toHaveCSS('scroll-snap-align', 'center')
  await frame.getByRole('button', { name: 'Panel 4', exact: true }).click()
  await expect.poll(() => frame.locator('#panel-4').evaluate(element => {
    const box = element.getBoundingClientRect(), port = element.parentElement!.getBoundingClientRect()
    return Math.round(box.left + box.width / 2 - port.left - port.width / 2)
  })).toBe(0)
})

test('relative native scrolling honors deliberate stops and permits normal pass-through', async ({ page }) => {
  await page.goto('/en/reference/scroll-snap-stop')
  const positions: number[] = []
  for (const id of ['force-a-snap-stop', 'keep-normal-scroll-momentum', 'use-sparingly']) {
    const frame = await ready(example(page, 'scroll-snap-stop', id))
    await frame.getByRole('button', { name: 'Reset', exact: true }).click()
    await frame.getByRole('button', { name: 'Advance', exact: true }).focus()
    await page.keyboard.press('Enter')
    const expected = id === 'keep-normal-scroll-momentum'
      ? await frame.locator('#scrollport').evaluate(element => Math.min(624, element.scrollWidth - element.clientWidth))
      : 208
    await expect.poll(() => frame.locator('#scrollport').evaluate(element => element.scrollLeft)).toBe(expected)
    positions.push(await frame.locator('#scrollport').evaluate(element => element.scrollLeft))
    await expect(frame.locator('[data-scroll-readout]')).toContainText(`x ${expected}`)
  }
  expect(positions[0]).toBe(208)
  expect(positions[1]).toBeGreaterThan(208)
  expect(positions[2]).toBe(208)
  const demo = example(page, 'scroll-snap-stop', 'apply-conditionally')
  const frame = await ready(demo)
  await demo.getByLabel('Viewport', { exact: true }).fill('900')
  await expect(frame.locator('#panel-2')).toHaveCSS('scroll-snap-stop', 'always')
  await frame.getByRole('button', { name: 'Advance', exact: true }).click()
  await expect.poll(() => frame.locator('#scrollport').evaluate(element => element.scrollLeft)).toBe(208)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await frame.getByRole('button', { name: 'Reset', exact: true }).click()
  await frame.getByRole('button', { name: 'Advance', exact: true }).click()
  await expect.poll(() => frame.locator('#scrollport').evaluate(element => element.scrollLeft)).toBe(208)
})

test('responsive snapping changes the actual track direction and overflow axis', async ({ page }) => {
  await page.goto('/en/reference/scroll-snap-type')
  const demo = example(page, 'scroll-snap-type', 'apply-conditionally')
  const frame = await ready(demo)
  const port = frame.locator('#scrollport')
  await demo.getByLabel('Viewport', { exact: true }).fill('300')
  await expect(port).toHaveCSS('scroll-snap-type', /^x(?: proximity)?$/)
  await expect(port).toHaveCSS('flex-direction', 'row')
  await frame.getByRole('button', { name: 'Panel 2', exact: true }).click()
  await expect.poll(() => port.evaluate(element => element.scrollLeft)).toBe(208)
  await demo.getByLabel('Viewport', { exact: true }).fill('900')
  await expect(port).toHaveCSS('scroll-snap-type', 'y mandatory')
  await expect(port).toHaveCSS('flex-direction', 'column')
  await frame.getByRole('button', { name: 'Panel 2', exact: true }).click()
  await expect.poll(() => port.evaluate(element => element.scrollTop)).toBe(240)
  expect(await port.evaluate(element => element.scrollWidth - element.clientWidth)).toBe(0)
})

test('overscroll contains real vertical and horizontal wheel chaining', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Mobile WebKit has no native wheel API; gesture chaining is verified in Chromium.')
  await page.goto('/en/reference/overscroll-behavior')
  for (const [id, horizontal] of [['contain-nested-scrolling', false], ['keep-horizontal-gestures-local', true]] as const) {
    const frame = await ready(example(page, 'overscroll-behavior', id))
    for (const prefix of ['auto', 'class']) {
      await frame.locator(`[data-scroll-container="${prefix}-inner"]`).click()
      const inner = frame.locator(`#${prefix}-inner`), outer = frame.locator(`#${prefix}-outer`)
      await inner.hover()
      const before = await outer.evaluate(element => element.scrollLeft + element.scrollTop)
      await page.mouse.wheel(horizontal ? 160 : 0, horizontal ? 0 : 160)
      if (prefix === 'auto') await expect.poll(() => outer.evaluate(element => element.scrollLeft + element.scrollTop)).toBeGreaterThan(before)
      else {
        // Check after a following animation frame so queued wheel input is processed.
        await outer.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
        expect(await outer.evaluate(element => element.scrollLeft + element.scrollTop)).toBe(before)
      }
    }
  }
})

test('overscroll conditions change the real property and readings follow native offsets', async ({ page }) => {
  await page.goto('/en/reference/overscroll-behavior')
  const demo = example(page, 'overscroll-behavior', 'apply-conditionally')
  const frame = await ready(demo)
  await demo.getByLabel('Viewport', { exact: true }).fill('300')
  await expect(frame.locator('[data-target]')).toHaveCSS('overscroll-behavior-y', 'contain')
  await frame.locator('[data-scroll-container="class-inner"]').focus()
  await page.keyboard.press('Enter')
  await expect(frame.locator('[data-scroll-readout="class-inner"]')).toHaveText('x 0 · y 176 px')
  await demo.getByLabel('Viewport', { exact: true }).fill('900')
  await expect(frame.locator('[data-target]')).toHaveCSS('overscroll-behavior-y', 'auto')
})

for (const route of ['overscroll-behavior', 'scroll-behavior', 'scroll-margin', 'scroll-padding', 'scroll-snap-align', 'scroll-snap-stop', 'scroll-snap-type']) {
  test(`scrolling composition: ${route}`, async ({ page }, testInfo) => {
    const failures: string[] = []
    page.on('pageerror', error => failures.push(error.message))
    page.on('console', message => { if (message.type() === 'error' && /hydration|hydrate|mismatch/i.test(message.text())) failures.push(message.text()) })
    await page.goto(`/en/reference/${route}`)
    await page.addStyleTag({ content: 'nextjs-portal { visibility: hidden }' })
    for (const [index, demo] of (await page.locator('.site-demo').all()).entries()) {
      if (await demo.locator('iframe').count()) await ready(demo)
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
