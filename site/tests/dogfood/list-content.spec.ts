import { expect, test, type FrameLocator, type Locator, type Page } from '@playwright/test'

const routes = ['content', 'counter-increment', 'counter-reset', 'counter-set', 'list-style', 'list-style-image', 'list-style-position', 'list-style-type']
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
const pseudo = (item: Locator) => item.evaluate(e => getComputedStyle(e, '::after').content)
async function print(page: Page, browserName: string, item: Locator, property: string, value: string) {
  if (browserName === 'chromium') {
    await page.emulateMedia({ media: 'print' }); await expect(item).toHaveCSS(property, value)
    await page.emulateMedia({ media: 'screen' })
  }
}
async function prefixes(items: Locator, values: string[]) {
  await expect(items).toHaveCount(values.length)
  for (const [i, value] of values.entries()) {
    const measured = await items.nth(i).evaluate((element, value) => {
      const text = Array.from(element.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent!.trim())!
      const range = element.ownerDocument.createRange(); range.setStart(text, 0); range.setEnd(text, 1)
      const context = element.ownerDocument.createElement('canvas').getContext('2d')!
      const computed = getComputedStyle(element); context.font = computed.font
      return { actual: range.getBoundingClientRect().left - element.getBoundingClientRect().left, expected: context.measureText(value).width }
    }, value)
    expect(Math.abs(measured.actual - measured.expected)).toBeLessThan(1.1)
  }
}
// CSSOM and Playwright's ARIA snapshot do not resolve counter() text. Chromium's
// layout snapshot exposes the actual counter glyph runs; mobile also checks geometry.
async function resolvedCounters(page: Page, browserName: string, demo: Locator, expected: string[]) {
  if (browserName !== 'chromium') return
  const title = await demo.locator('iframe').getAttribute('title')
  const session = await page.context().newCDPSession(page)
  try {
    const snapshot = await session.send('DOMSnapshot.captureSnapshot', { computedStyles: [] })
    for (const doc of snapshot.documents.slice(1)) {
      const owner = await session.send('DOM.getFrameOwner', { frameId: snapshot.strings[doc.frameId] })
      const { node } = await session.send('DOM.describeNode', { backendNodeId: owner.backendNodeId })
      const index = node.attributes!.indexOf('title')
      if (node.attributes![index + 1] !== title) continue
      const numbers = doc.layout.text.map(i => snapshot.strings[i]).filter(text => /^\d+$/.test(text))
      expect(numbers).toEqual(expected); return
    }
    throw new Error(`Missing native layout snapshot for ${title}`)
  } finally { await session.detach() }
}

test('generated content retains descendant scope, real links, tokens and keyboard states', async ({ page, browserName }) => {
  await page.goto('/en/reference/content')
  const descendant = await scene(page, 'content', 'add-indicators-for-external-links')
  await expect(target(descendant)).toHaveAttribute('href', 'https://www.example.com')
  await expect(target(descendant)).toHaveAccessibleName('project website ↗')
  const contrast = await target(descendant).evaluate(e => {
    const context = e.ownerDocument.createElement('canvas').getContext('2d')!
    function luminance(color: string) {
      context.clearRect(0, 0, 1, 1); context.fillStyle = color; context.fillRect(0, 0, 1, 1)
      const channels = Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3).map(v => {
        const x = v / 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
      })
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
    }
    const foreground = luminance(getComputedStyle(e).color), background = luminance(getComputedStyle(e.closest('[data-ui="type-surface"]')!).backgroundColor)
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05)
  })
  expect(contrast).toBeGreaterThanOrEqual(4.5)
  expect(await pseudo(descendant.getByRole('link', { name: 'this reference' }))).toBe('none')
  const values = await scene(page, 'content', 'resolve-whitespaces-in-the-value')
  expect(await pseudo(target(values, 0))).toBe('"\u00a0↗"')
  expect(await pseudo(target(values, 1))).toBe('" ↗"')
  const item = target(await scene(page, 'content', 'apply-conditionally'))
  await expect(item).toHaveAccessibleName('Project website'); expect(await pseudo(item)).toBe('none')
  if (await page.evaluate(() => matchMedia('(hover:hover)').matches)) {
    await item.hover(); expect(await pseudo(item)).toBe('"\u00a0↗"'); await page.mouse.move(0, 0)
  }
  await item.focus(); await page.keyboard.press('ArrowRight')
  await expect(item).toBeFocused(); await expect(item).toHaveCSS('outline-width', '2px')
  await expect(item).toHaveAccessibleName('Project website ↗')
  if (browserName === 'chromium') { await page.emulateMedia({ media: 'print' }); expect(await pseudo(item)).toBe('none') }
})

test('counter increments preserve names, negative steps and native conditional numbering', async ({ page, browserName }) => {
  await page.goto('/en/reference/counter-increment')
  const ordinary = await scene(page, 'counter-increment', 'number-sections')
  await prefixes(ordinary.getByRole('heading'), ['1.\u00a0', '2.\u00a0', '3.\u00a0'])
  await resolvedCounters(page, browserName, example(page, 'counter-increment', 'number-sections'), ['1', '2', '3'])
  const backward = await scene(page, 'counter-increment', 'count-backward')
  await expect(target(backward)).toHaveCSS('counter-increment', 'step -1')
  await prefixes(backward.getByRole('listitem'), ['10.\u00a0', '9.\u00a0', '8.\u00a0'])
  await expect(backward.getByRole('list')).toHaveAttribute('reversed', '')
  await resolvedCounters(page, browserName, example(page, 'counter-increment', 'count-backward'), ['10', '9', '8'])
  const demo = example(page, 'counter-increment', 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 900); await expect(target(frame)).toHaveCSS('counter-increment', 'section 2')
  await prefixes(frame.getByRole('heading'), ['2.\u00a0', '4.\u00a0', '6.\u00a0'])
  await resolvedCounters(page, browserName, demo, ['2', '4', '6'])
  await print(page, browserName, target(frame), 'counter-increment', 'section 1')
})

test('counter resets expose initial values and the actual reversed support branch', async ({ page, browserName }) => {
  await page.goto('/en/reference/counter-reset')
  const ordinary = await scene(page, 'counter-reset', 'create-a-section-counter')
  await expect(target(ordinary)).toHaveCSS('counter-reset', 'section 0')
  await prefixes(ordinary.getByRole('heading'), ['1.\u00a0', '2.\u00a0'])
  const chapter = await scene(page, 'counter-reset', 'start-from-another-number')
  await expect(target(chapter)).toHaveCSS('counter-reset', 'chapter 4')
  await prefixes(chapter.getByRole('heading'), ['5.\u00a0', '6.\u00a0'])
  const reversed = await scene(page, 'counter-reset', 'create-a-reversed-counter')
  const supported = await target(reversed).evaluate(() => CSS.supports('counter-reset', 'reversed(step)'))
  await expect(reversed.getByText(supported ? 'Native reversed() · item-derived start' : 'Explicit fallback · starts at 4')).toBeVisible()
  if (!supported) await expect(target(reversed)).toHaveCSS('counter-reset', 'step 4')
  await prefixes(reversed.getByRole('listitem'), ['3.\u00a0', '2.\u00a0', '1.\u00a0'])
  await resolvedCounters(page, browserName, example(page, 'counter-reset', 'create-a-reversed-counter'), ['3', '2', '1'])
  const demo = example(page, 'counter-reset', 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 900); await expect(target(frame)).toHaveCSS('counter-reset', 'chapter 4')
  await resolvedCounters(page, browserName, demo, ['5', '6'])
  await print(page, browserName, target(frame), 'counter-reset', 'chapter 0')
})

test('counter set runs after increment and following elements continue from the new value', async ({ page, browserName }) => {
  await page.goto('/en/reference/counter-set')
  const jump = await scene(page, 'counter-set', 'set-a-counter-on-one-item')
  await expect(target(jump)).toHaveCSS('counter-set', 'step 9'); await expect(target(jump)).toHaveAttribute('value', '9')
  await prefixes(jump.getByRole('listitem'), ['1.\u00a0', '9.\u00a0', '10.\u00a0'])
  await resolvedCounters(page, browserName, example(page, 'counter-set', 'set-a-counter-on-one-item'), ['1', '9', '10'])
  const multiple = await scene(page, 'counter-set', 'set-multiple-counters')
  await expect(target(multiple)).toHaveCSS('counter-set', 'chapter 2 section 4')
  await prefixes(multiple.getByRole('heading'), ['Chapter\u00a02,\u00a0section\u00a04:\u00a0'])
  const demo = example(page, 'counter-set', 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 900); await expect(target(frame)).toHaveCSS('counter-set', 'section 9')
  await prefixes(frame.getByRole('heading'), ['1.\u00a0', '9.\u00a0', '10.\u00a0'])
  await resolvedCounters(page, browserName, demo, ['1', '9', '10'])
  await print(page, browserName, target(frame), 'counter-set', 'none')
})

test('list shorthand changes all intended parts while position longhand preserves decimal', async ({ page, browserName }) => {
  await page.goto('/en/reference/list-style')
  const pair = await scene(page, 'list-style', 'set-type-and-position-together')
  for (const [i, type] of ['disc', 'decimal'].entries()) {
    await expect(target(pair, i)).toHaveCSS('list-style-type', type); await expect(target(pair, i)).toHaveCSS('list-style-position', 'inside')
  }
  const split = example(page, 'list-style', 'split-longhands-when-variants-differ'), frame = await ready(split)
  await viewport(split, 900); await expect(target(frame)).toHaveCSS('list-style-type', 'decimal'); await expect(target(frame)).toHaveCSS('list-style-position', 'inside')
  const demo = example(page, 'list-style', 'apply-conditionally'), conditional = await ready(demo)
  await viewport(demo, 900); await expect(target(conditional)).toHaveCSS('list-style-type', 'square'); await expect(target(conditional)).toHaveCSS('list-style-position', 'inside')
  await print(page, browserName, target(conditional), 'list-style-type', 'disc')
})

test('image markers use a loadable asset and a real gradient with independent print fallback', async ({ page, browserName, request }) => {
  const asset = await request.get('/demo/marker.svg'); expect(asset.ok()).toBe(true); expect(await asset.text()).toContain('<svg')
  await page.goto('/en/reference/list-style-image')
  const image = target(await scene(page, 'list-style-image', 'use-an-image-marker'))
  await expect(image).toHaveCSS('list-style-image', /\/demo\/marker\.svg/); await expect(image).toHaveCSS('list-style-type', 'square')
  const gradient = target(await scene(page, 'list-style-image', 'use-a-gradient-marker'))
  await expect(gradient).toHaveCSS('list-style-image', /^linear-gradient\(oklch/)
  const fallback = target(await scene(page, 'list-style-image', 'fall-back-to-type-markers'))
  await print(page, browserName, fallback, 'list-style-image', 'none'); await expect(fallback).toHaveCSS('list-style-type', 'square')
  const demo = example(page, 'list-style-image', 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 360); await expect(target(frame)).toHaveCSS('list-style-image', 'none')
  await viewport(demo, 900); await expect(target(frame)).toHaveCSS('list-style-image', /\/demo\/marker\.svg/)
  await expect(target(frame)).toHaveCSS('list-style-type', 'square'); await expect(target(frame)).toHaveCSS('list-style-position', 'outside')
})

async function lineStarts(item: Locator) {
  return item.evaluate(element => {
    const node = element.firstChild!, range = element.ownerDocument.createRange(), lines: { top: number, left: number }[] = []
    for (let i = 0; i < node.textContent!.length; i++) {
      range.setStart(node, i); range.setEnd(node, i + 1); const r = range.getBoundingClientRect()
      if (r.width && !lines.some(line => Math.abs(line.top - r.top) < 1)) lines.push({ top: r.top, left: r.left - element.getBoundingClientRect().left })
    }
    return lines.map(line => line.left)
  })
}

test('inside markers occupy the first line while outside markers retain hanging alignment', async ({ page, browserName }) => {
  await page.goto('/en/reference/list-style-position')
  const pair = await scene(page, 'list-style-position', 'place-markers-inside-the-content-box')
  const outside = await lineStarts(target(pair, 0).locator('li').nth(1)), inside = await lineStarts(target(pair, 1).locator('li').nth(1))
  expect(outside.length).toBeGreaterThan(1); expect(inside.length).toBeGreaterThan(1)
  for (const left of outside) expect(Math.abs(left)).toBeLessThan(1)
  expect(inside[0]).toBeGreaterThan(10); expect(Math.abs(inside[1])).toBeLessThan(1)
  const demo = example(page, 'list-style-position', 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 900); await expect(target(frame)).toHaveCSS('list-style-position', 'inside'); await expect(target(frame)).toHaveCSS('list-style-type', 'decimal')
  await print(page, browserName, target(frame), 'list-style-position', 'outside')
})

test('marker types preserve actual ordered and unordered list semantics', async ({ page, browserName }) => {
  await page.goto('/en/reference/list-style-type')
  const decimal = target(await scene(page, 'list-style-type', 'use-decimal-markers'))
  await expect(decimal).toHaveCSS('list-style-type', 'decimal'); expect(await decimal.evaluate(e => e.tagName)).toBe('OL')
  const disc = target(await scene(page, 'list-style-type', 'use-disc-markers'))
  await expect(disc).toHaveCSS('list-style-type', 'disc'); expect(await disc.evaluate(e => e.tagName)).toBe('UL')
  const pair = await scene(page, 'list-style-type', 'use-a-native-list-style-type')
  await expect(target(pair, 0)).toHaveCSS('list-style-type', 'square'); await expect(target(pair, 1)).toHaveCSS('list-style-type', 'lower-roman')
  const demo = example(page, 'list-style-type', 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 900); await expect(target(frame)).toHaveCSS('list-style-type', 'lower-roman'); await expect(target(frame)).toHaveCSS('list-style-position', 'outside')
  await print(page, browserName, target(frame), 'list-style-type', 'decimal')
})

for (const route of routes) {
  test(`list-content composition: ${route}`, async ({ page }, testInfo) => {
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
