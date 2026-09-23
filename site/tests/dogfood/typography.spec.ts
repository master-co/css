import { expect, test, type FrameLocator, type Locator, type Page } from '@playwright/test'

const routes = ['font-family', 'font-size', 'font-weight', 'font-style', 'font-feature-settings', 'font-variant-numeric', 'font-smooth', 'letter-spacing', 'line-height', 'word-spacing', 'vertical-align', 'text-size']
const example = (page: Page, route: string, section: string) => page.locator(`[data-demo-case="${route}#${section}"]`)
async function ready(demo: Locator) {
  await demo.scrollIntoViewIfNeeded()
  await expect(demo.locator('iframe')).toHaveAttribute('data-ready', 'true')
  await demo.locator('iframe').evaluate(async (element: HTMLIFrameElement) => { await element.contentDocument!.fonts.ready })
  return demo.frameLocator('iframe')
}
const target = (frame: FrameLocator, index?: number) => frame.locator(`#${index === undefined ? '' : `example-${index}-`}target`)
async function viewport(demo: Locator, width: number) {
  await demo.getByLabel('Viewport', { exact: true }).fill(String(width))
  await expect.poll(() => demo.locator('iframe').evaluate(e => e.clientWidth)).toBe(width)
}
async function width(element: Locator) { return element.evaluate(e => e.getBoundingClientRect().width) }
async function height(element: Locator) { return element.evaluate(e => e.getBoundingClientRect().height) }
async function runs(frame: FrameLocator, prefix = '') {
  return { ones: await width(frame.locator(`#${prefix}ones`)), eights: await width(frame.locator(`#${prefix}eights`)) }
}
async function numberCSS(element: Locator, property: string, expected: number) {
  // WebKit serializes some computed lengths with float noise below one thousandth of a pixel.
  await expect.poll(() => element.evaluate((e, p) => parseFloat(getComputedStyle(e).getPropertyValue(p)), property)).toBeCloseTo(expected, 3)
}
async function state(page: Page, route: string, property: string, before: string, after: string) {
  const frame = await ready(example(page, route, 'apply-conditionally')), item = target(frame)
  const assertValue = async (value: string) => {
    if (/^-?[\d.]+px$/.test(value)) await numberCSS(item, property, parseFloat(value))
    else await expect(item).toHaveCSS(property, value)
  }
  await assertValue(before)
  if (await page.evaluate(() => matchMedia('(hover: hover)').matches)) {
    await item.hover()
    await assertValue(after)
    await page.mouse.move(0, 0)
    await assertValue(before)
  }
  await item.focus()
  // Switch to keyboard modality without relying on Safari's optional Tab-to-buttons setting.
  await page.keyboard.press('ArrowRight')
  await expect(item).toBeFocused()
  await expect(item).toHaveCSS('outline-width', '2px')
  await assertValue(after)
  return frame
}

test('font family keeps inheritance, literal spaces and real font resources', async ({ page }) => {
  // A denied remote stylesheet must report fallback, never a claimed loaded font.
  await page.route('https://fonts.googleapis.com/**', route => route.abort())
  await page.goto('/en/reference/font-family')
  const basic = await ready(example(page, 'font-family', 'basic-usage'))
  await expect(target(basic, 0)).toHaveCSS('font-family', /sans-serif/)
  await expect(target(basic, 1)).toHaveCSS('font-family', /serif/)
  await expect(target(basic, 2)).toHaveCSS('font-family', /monospace/)
  const explicit = await ready(example(page, 'font-family', 'set-the-font-family'))
  await expect(target(explicit)).toHaveCSS('font-family', 'cursive')
  const global = await ready(example(page, 'font-family', 'apply-fonts-globally'))
  expect(await target(global).evaluate(e => getComputedStyle(e).fontFamily)).toBe(await global.locator('body').evaluate(e => getComputedStyle(e).fontFamily))
  const selected = await ready(example(page, 'font-family', 'apply-fonts-to-specified-elements'))
  await expect(target(selected)).toHaveCSS('font-family', /sans-serif/)
  await expect(selected.locator('#code')).toHaveCSS('font-family', /monospace/)
  const escaped = await ready(example(page, 'font-family', 'resolve-whitespaces-in-the-value'))
  await expect(target(escaped, 0)).toHaveCSS('font-family', /^"?IBM Plex Mono"?$/)
  expect(await target(escaped, 0).evaluate(e => {
    const r = e.ownerDocument.createRange(); r.selectNodeContents(e); return r.getBoundingClientRect().width
  })).toBeCloseTo(await target(escaped, 1).evaluate(e => {
    const r = e.ownerDocument.createRange(); r.selectNodeContents(e); return r.getBoundingClientRect().width
  }), 1)
  const custom = await ready(example(page, 'font-family', 'use-custom-fonts'))
  await expect(target(custom)).toHaveCSS('font-family', /^Geist,/)
  await expect(custom.locator('#code')).toHaveCSS('font-family', /^"?IBM Plex Mono"?,/)
  const hosted = await ready(example(page, 'font-family', 'google-fonts'))
  await expect(hosted.locator('[data-font-status]')).toHaveText('Unavailable · fallback')
  await expect(hosted.locator('head link[rel="stylesheet"]')).toHaveAttribute('href', /fonts.googleapis.com/)
  const local = await ready(example(page, 'font-family', 'self-hosted-fonts'))
  await expect(local.locator('[data-font-status]')).toHaveText('Loaded')
  await expect(target(local)).toHaveCSS('font-weight', '550')
  const condition = await ready(example(page, 'font-family', 'apply-conditionally'))
  const button = condition.getByRole('button', { name: 'Focus or hover to compare' })
  await button.focus(); await page.keyboard.press('ArrowRight')
  await expect(button).toHaveCSS('font-family', /monospace/)
})

test('font size preserves the independent leading and clamps a real viewport value', async ({ page, browserName }) => {
  await page.goto('/en/reference/font-size')
  const basic = await ready(example(page, 'font-size', 'basic-usage'))
  for (const [index, value] of [12, 14, 16, 18, 20, 24].entries()) await expect(target(basic, index)).toHaveCSS('font-size', `${value}px`)
  const leading = await ready(example(page, 'font-size', 'with-line-height'))
  await numberCSS(target(leading, 0), 'line-height', 19.2)
  await numberCSS(target(leading, 1), 'line-height', 28.8)
  const fluidDemo = example(page, 'font-size', 'use-an-explicit-font-size'), fluid = await ready(fluidDemo)
  for (const [w, font] of [[360, 20], [1200, 24], [1600, 32]]) {
    await viewport(fluidDemo, w); await expect(target(fluid)).toHaveCSS('font-size', `${font}px`)
  }
  const demo = example(page, 'font-size', 'apply-conditionally'), frame = await ready(demo)
  for (const [w, font] of [[360, 14], [900, 16], [1400, 18]]) {
    await viewport(demo, w); await expect(target(frame)).toHaveCSS('font-size', `${font}px`)
  }
  await expect(demo.getByRole('button', { name: 'Print preview' })).toHaveCount(1)
  if (browserName === 'chromium') { await page.emulateMedia({ media: 'print' }); await expect(target(frame)).toHaveCSS('font-size', '14px') }
})

test('font weight uses the loaded variable range and preserves an intermediate weight', async ({ page }) => {
  await page.goto('/en/reference/font-weight')
  const basic = await ready(example(page, 'font-weight', 'basic-usage'))
  for (let i = 0; i < 9; i++) await expect(target(basic, i)).toHaveCSS('font-weight', String((i + 1) * 100))
  const widths = await basic.locator('[data-target]').evaluateAll(elements => elements.map(e => {
    const r = document.createRange(); r.selectNodeContents(e); return r.getBoundingClientRect().width
  }))
  expect(widths[8]).toBeGreaterThan(widths[0] + 10)
  const explicit = await ready(example(page, 'font-weight', 'use-explicit-weights'))
  await expect(target(explicit, 1)).toHaveCSS('font-weight', '550')
  await state(page, 'font-weight', 'font-weight', '400', '600')
})

test('font style retains semantic emphasis and local inheritance resets', async ({ page }) => {
  await page.goto('/en/reference/font-style')
  const emphasis = await ready(example(page, 'font-style', 'italicize-emphasis'))
  await expect(emphasis.locator('em')).toHaveCSS('font-style', 'italic')
  await expect(target(emphasis)).toHaveCSS('font-style', 'italic')
  await expect(emphasis.locator('#context')).toHaveCSS('font-style', 'normal')
  const oblique = await ready(example(page, 'font-style', 'use-oblique-text'))
  await expect(target(oblique, 0)).toHaveCSS('font-style', 'normal')
  await expect(target(oblique, 1)).toHaveCSS('font-style', 'oblique')
  const reset = await ready(example(page, 'font-style', 'reset-font-style'))
  await expect(reset.locator('#context')).toHaveCSS('font-style', 'italic')
  await expect(target(reset)).toHaveCSS('font-style', 'normal')
  await state(page, 'font-style', 'font-style', 'normal', 'italic')
})

test('raw OpenType settings affect glyph advances and reset only the child request', async ({ page }) => {
  await page.goto('/en/reference/font-feature-settings')
  const feature = await ready(example(page, 'font-feature-settings', 'enable-a-font-feature'))
  const normal = await runs(feature, 'example-0-'), tabular = await runs(feature, 'example-1-')
  expect(normal.eights - normal.ones).toBeGreaterThan(20)
  expect(tabular.ones).toBeCloseTo(tabular.eights, 1)
  const reset = await ready(example(page, 'font-feature-settings', 'reset-features')), child = await runs(reset)
  expect(await width(reset.locator('#inherited'))).toBeGreaterThan(child.ones + 20)
  expect(child.eights - child.ones).toBeGreaterThan(20)
  const semantic = await ready(example(page, 'font-feature-settings', 'prefer-semantic-numeric-utilities'))
  expect(await runs(semantic, 'example-0-')).toEqual(await runs(semantic, 'example-1-'))
  const token = await ready(example(page, 'font-feature-settings', 'use-feature-tokens'))
  expect((await runs(token)).ones).toBeCloseTo((await runs(token)).eights, 1)
  const frame = await state(page, 'font-feature-settings', 'font-feature-settings', 'normal', '"tnum"')
  expect((await runs(frame)).ones).toBeCloseTo((await runs(frame)).eights, 1)
})

test('numeric variants have visible supported glyphs and real inherited resets', async ({ page }) => {
  await page.goto('/en/reference/font-variant-numeric')
  const basic = await ready(example(page, 'font-variant-numeric', 'align-tabular-numbers'))
  const proportional = await runs(basic, 'example-0-'), tabular = await runs(basic, 'example-1-')
  expect(proportional.eights - proportional.ones).toBeGreaterThan(20)
  expect(tabular.ones).toBeCloseTo(tabular.eights, 1)
  const zero = await ready(example(page, 'font-variant-numeric', 'show-slashed-zeroes'))
  await expect(zero.locator('[data-font-status]')).toHaveText(['Loaded', 'Loaded'])
  await expect(target(zero, 1)).toHaveCSS('font-variant-numeric', 'slashed-zero')
  // Same box, face, text and paint: the only change is the native glyph feature.
  const slashed = await target(zero, 1).screenshot()
  await target(zero, 1).evaluate((e: HTMLElement) => { e.style.fontVariantNumeric = 'normal' })
  expect(slashed.equals(await target(zero, 1).screenshot())).toBe(false)
  const reset = await ready(example(page, 'font-variant-numeric', 'reset-numeric-variants'))
  expect(await width(reset.locator('#inherited'))).toBeGreaterThan((await runs(reset)).ones + 20)
  await expect(target(reset)).toHaveCSS('font-variant-numeric', 'normal')
  const frame = await state(page, 'font-variant-numeric', 'font-variant-numeric', 'proportional-nums', 'tabular-nums')
  expect((await runs(frame)).ones).toBeCloseTo((await runs(frame)).eights, 1)
})

test('smoothing reports native platform properties without simulating an effect', async ({ page }) => {
  await page.goto('/en/reference/font-smooth')
  const basic = await ready(example(page, 'font-smooth', 'use-antialiased-text'))
  await expect(target(basic, 0)).toHaveCSS('-webkit-font-smoothing', 'auto')
  await expect(target(basic, 1)).toHaveCSS('-webkit-font-smoothing', 'antialiased')
  await expect(basic.locator('[data-style-property="-moz-osx-font-smoothing"]')).toHaveText(['Not exposed', 'Not exposed'])
  const reset = await ready(example(page, 'font-smooth', 'restore-subpixel-antialiasing'))
  await expect(target(reset)).toHaveCSS('-webkit-font-smoothing', 'auto')
  const surfaces = await ready(example(page, 'font-smooth', 'use-sparingly'))
  expect(await target(surfaces, 0).evaluate(e => getComputedStyle(e).backgroundColor)).not.toBe(await target(surfaces, 1).evaluate(e => getComputedStyle(e).backgroundColor))
  const demo = example(page, 'font-smooth', 'apply-conditionally'), frame = await ready(demo)
  const toggle = demo.getByRole('button', { name: 'Theme', exact: true })
  const dark = await toggle.getAttribute('aria-pressed') === 'true'
  await expect(target(frame)).toHaveCSS('-webkit-font-smoothing', dark ? 'antialiased' : 'auto')
  await toggle.click()
  await expect(target(frame)).toHaveCSS('-webkit-font-smoothing', dark ? 'auto' : 'antialiased')
})

test('tracking uses consistent type size and a measured em adjustment', async ({ page }) => {
  await page.goto('/en/reference/letter-spacing')
  const basic = await ready(example(page, 'letter-spacing', 'basic-usage'))
  for (const [index, value] of [-1.296, -.72, -.36, 0, .36, .72, 2.16].entries()) {
    if (value === 0) await expect(target(basic, index)).toHaveCSS('letter-spacing', 'normal')
    else await numberCSS(target(basic, index), 'letter-spacing', value)
  }
  const custom = await ready(example(page, 'letter-spacing', 'use-a-custom-value'))
  await numberCSS(target(custom), 'letter-spacing', 0.6)
  await expect(custom.locator('[data-size-readout]')).toContainText('px')
  await state(page, 'letter-spacing', 'letter-spacing', 'normal', '0.32px')
})

test('leading preserves multiline rhythm and unitless versus fixed inheritance', async ({ page, browserName }) => {
  await page.goto('/en/reference/line-height')
  const basic = await ready(example(page, 'line-height', 'basic-usage'))
  for (const [index, value] of [19.2, 22.4, 25.6, 28.8, 32].entries()) await numberCSS(target(basic, index), 'line-height', value)
  const pair = await ready(example(page, 'line-height', 'set-line-height-with-font-size'))
  await numberCSS(target(pair), 'line-height', 28.8)
  const display = await ready(example(page, 'line-height', 'tighten-display-text'))
  await expect(target(display)).toHaveCSS('line-height', '40px')
  expect(await height(target(display))).toBe(80)
  const inherit = await ready(example(page, 'line-height', 'use-explicit-values'))
  expect(await height(target(inherit, 0))).toBe(72)
  expect(await height(target(inherit, 1))).toBe(48)
  const demo = example(page, 'line-height', 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 360); await numberCSS(target(frame), 'line-height', 22.4)
  await viewport(demo, 900); await numberCSS(target(frame), 'line-height', 25.6)
  if (browserName === 'chromium') { await page.emulateMedia({ media: 'print' }); await numberCSS(target(frame), 'line-height', 28.8) }
})

test('word spacing measures three real separators and leaves natural spaces intact', async ({ page }) => {
  await page.goto('/en/reference/word-spacing')
  const basic = await ready(example(page, 'word-spacing', 'add-space-between-words'))
  expect(await width(target(basic, 1)) - await width(target(basic, 0))).toBeCloseTo(12, 1)
  const fixed = await ready(example(page, 'word-spacing', 'use-fixed-spacing-when-needed'))
  for (const i of [0, 1]) await expect(target(fixed, i)).toHaveCSS('word-spacing', '4px')
  const paragraph = await ready(example(page, 'word-spacing', 'avoid-overusing-wide-spacing'))
  expect(await height(target(paragraph, 1))).toBeGreaterThanOrEqual(await height(target(paragraph, 0)))
  await state(page, 'word-spacing', 'word-spacing', '0px', '4px')
})

test('vertical alignment uses inline geometry, a real icon and complete table cells', async ({ page }) => {
  await page.goto('/en/reference/vertical-align')
  const inline = await ready(example(page, 'vertical-align', 'align-inline-content'))
  await expect(target(inline, 0)).toHaveCSS('display', 'inline-block')
  expect(await width(target(inline, 0))).toBe(32)
  expect(await height(target(inline, 0))).toBe(32)
  await expect(target(inline, 0)).toHaveCSS('vertical-align', 'baseline')
  await expect(target(inline, 1)).toHaveCSS('vertical-align', 'middle')
  const icon = await ready(example(page, 'vertical-align', 'align-icons-with-text'))
  await expect(icon.getByRole('button', { name: 'Layers', exact: true })).toHaveCount(2)
  expect(await width(target(icon, 0))).toBe(32)
  expect(await height(target(icon, 0))).toBe(32)
  await expect(target(icon, 0).locator('path')).toHaveAttribute('d', /M4/)
  const offsets = await icon.locator('[data-target]').evaluateAll(elements => elements.map(e => {
    const text = e.nextSibling!, r = e.ownerDocument.createRange(); r.selectNode(text)
    return e.getBoundingClientRect().top - r.getBoundingClientRect().top
  }))
  expect(offsets[1]).toBeGreaterThan(offsets[0] + 5)
  const table = await ready(example(page, 'vertical-align', 'align-table-cells'))
  await expect(table.getByRole('table')).toHaveAccessibleName('Cell content within a 128px row')
  const tops = await table.locator('tbody span').evaluateAll(elements => elements.map(e => e.getBoundingClientRect().top))
  expect(tops[1] - tops[0]).toBeGreaterThan(30)
  expect(tops[2] - tops[1]).toBeGreaterThan(30)
  const demo = example(page, 'vertical-align', 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 360); await expect(target(frame)).toHaveCSS('vertical-align', 'baseline')
  await viewport(demo, 900); await expect(target(frame)).toHaveCSS('vertical-align', 'middle')
})

test('text size computes all three properties and updates them at a real breakpoint', async ({ page, browserName }) => {
  await page.goto('/en/reference/text-size')
  for (const [section, values] of [['body-text', [14, 16, 18]], ['headings', [18, 20, 24]], ['page-titles-hero-sections', [32, 36]]] as const) {
    const frame = await ready(example(page, 'text-size', section))
    for (const [index, font] of values.entries()) await expect(target(frame, index)).toHaveCSS('font-size', `${font}px`)
  }
  const explicit = await ready(example(page, 'text-size', 'use-a-precise-size'))
  await expect(target(explicit)).toHaveCSS('font-size', '17px')
  await numberCSS(target(explicit), 'line-height', 29.48)
  await numberCSS(target(explicit), 'letter-spacing', -0.048)
  await expect(explicit.locator('[data-style-property="letter-spacing"]')).toHaveText('-0.048px')
  const demo = example(page, 'text-size', 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 360); await expect(target(frame)).toHaveCSS('font-size', '24px')
  await viewport(demo, 900); await expect(target(frame)).toHaveCSS('font-size', '36px')
  await numberCSS(target(frame), 'line-height', 42.4)
  await numberCSS(target(frame), 'letter-spacing', -0.96)
  if (browserName === 'chromium') { await page.emulateMedia({ media: 'print' }); await expect(target(frame)).toHaveCSS('font-size', '20px') }
})

for (const route of [...routes, 'guide/typography']) {
  test(`typography composition: ${route}`, async ({ page }, testInfo) => {
    const failures: string[] = []
    page.on('pageerror', error => failures.push(error.message))
    page.on('console', message => { if (message.type() === 'error' && /hydration|hydrate|mismatch/i.test(message.text())) failures.push(message.text()) })
    await page.goto(`/en/${route.startsWith('guide/') ? route : `reference/${route}`}`)
    await page.addStyleTag({ content: 'nextjs-portal { visibility: hidden }' })
    for (const [index, demo] of (await page.locator('[data-demo-case]').all()).entries()) {
      const frame = await ready(demo)
      expect(await frame.locator('body').evaluate(e => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1)
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
