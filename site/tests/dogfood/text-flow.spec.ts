import { expect, test, type FrameLocator, type Locator, type Page } from '@playwright/test'

const routes = ['text-align', 'text-indent', 'text-transform', 'text-wrap', 'white-space', 'word-break', 'overflow-wrap', 'hyphens', 'line-clamp', 'text-overflow', 'direction', 'writing-mode', 'text-orientation', 'text-rendering']
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
const width = (item: Locator) => item.evaluate(e => e.getBoundingClientRect().width)
const height = (item: Locator) => item.evaluate(e => e.getBoundingClientRect().height)
const overflows = (item: Locator) => item.evaluate(e => e.scrollWidth > e.clientWidth + 1)
async function textBox(item: Locator) {
  return item.evaluate(e => {
    const range = e.ownerDocument.createRange(); range.selectNodeContents(e)
    const box = e.getBoundingClientRect(), text = range.getBoundingClientRect()
    return { left: text.left - box.left, right: text.right - box.left, width: text.width }
  })
}
async function lines(item: Locator) {
  return item.evaluate(e => {
    const result: { text: string, left: number, right: number, top: number }[] = []
    const box = e.getBoundingClientRect(), walker = e.ownerDocument.createTreeWalker(e, NodeFilter.SHOW_TEXT)
    let node: Node | null
    while ((node = walker.nextNode())) {
      for (let i = 0; i < node.textContent!.length; i++) {
        const range = e.ownerDocument.createRange(); range.setStart(node, i); range.setEnd(node, i + 1)
        const r = range.getBoundingClientRect()
        if (!r.width || !r.height) continue
        let line = result.find(value => Math.abs(value.top - r.top) < 1)
        if (!line) { line = { text: '', left: Infinity, right: -Infinity, top: r.top }; result.push(line) }
        line.text += node.textContent![i]; line.left = Math.min(line.left, r.left - box.left); line.right = Math.max(line.right, r.right - box.left)
      }
    }
    return result
  })
}
async function condition(page: Page, route: string, property: string, values: [number, string][]) {
  const demo = example(page, route, 'apply-conditionally'), frame = await ready(demo)
  for (const [w, value] of values) { await viewport(demo, w); await expect(target(frame)).toHaveCSS(property, value) }
  return { demo, frame }
}
async function state(page: Page, route: string, property: string, before: string, after: string) {
  const frame = await scene(page, route, 'apply-conditionally'), item = target(frame)
  await expect(item).toHaveCSS(property, before)
  if (await page.evaluate(() => matchMedia('(hover:hover)').matches)) {
    await item.hover(); await expect(item).toHaveCSS(property, after)
    await page.mouse.move(0, 0); await expect(item).toHaveCSS(property, before)
  }
  await item.focus(); await page.keyboard.press('ArrowRight')
  await expect(item).toBeFocused(); await expect(item).toHaveCSS('outline-width', '2px')
  await expect(item).toHaveCSS(property, after)
}

test('text alignment moves native lines and follows real RTL direction', async ({ page, browserName }) => {
  await page.goto('/en/reference/text-align')
  for (const [id, alignment] of [['align-contents-to-the-left', 'left'], ['align-contents-to-the-right', 'right'], ['center-contents', 'center'], ['align-contents-to-the-left-and-right', 'justify']]) {
    const frame = await scene(page, 'text-align', id), item = target(frame), actual = await lines(item)
    expect(actual.length).toBeGreaterThan(2)
    for (const line of alignment === 'justify' ? actual.slice(0, -1) : actual) {
      if (alignment === 'left' || alignment === 'justify') expect(line.left).toBeCloseTo(0, 0)
      if (alignment === 'right' || alignment === 'justify') expect(line.right).toBeCloseTo(240, 0)
      // WebKit rounds substring left edges to integer CSS pixels.
      if (alignment === 'center') expect(Math.abs(line.left - (240 - line.right))).toBeLessThan(1.1)
    }
    if (alignment === 'justify') expect(actual.at(-1)!.right).toBeLessThan(220)
  }
  const logical = await scene(page, 'text-align', 'use-logical-alignment')
  await expect(target(logical, 2)).toHaveAttribute('dir', 'rtl')
  expect((await textBox(target(logical, 2))).right).toBeCloseTo(240, 0)
  expect((await textBox(target(logical, 3))).left).toBeCloseTo(0, 0)
  const { frame } = await condition(page, 'text-align', 'text-align', [[360, 'start'], [900, 'center'], [1400, 'end']])
  if (browserName === 'chromium') { await page.emulateMedia({ media: 'print' }); await expect(target(frame)).toHaveCSS('text-align', 'start') }
})

test('indent offsets only the first line and resets at a real breakpoint', async ({ page, browserName }) => {
  await page.goto('/en/reference/text-indent')
  const first = await scene(page, 'text-indent', 'indent-the-first-line'), actual = await lines(target(first, 1))
  expect(actual[0].left).toBe(32)
  for (const line of actual.slice(1)) expect(line.left).toBe(0)
  const spacing = await scene(page, 'text-indent', 'use-spacing-values')
  expect((await lines(target(spacing)))[0].left).toBe(16)
  const demo = example(page, 'text-indent', 'reset-at-a-breakpoint'), reset = await ready(demo)
  await viewport(demo, 360); await expect(target(reset)).toHaveCSS('text-indent', '32px')
  await viewport(demo, 900); expect((await lines(target(reset)))[0].left).toBe(0)
  const { frame } = await condition(page, 'text-indent', 'text-indent', [[360, '0px'], [900, '16px']])
  if (browserName === 'chromium') { await page.emulateMedia({ media: 'print' }); await expect(target(frame)).toHaveCSS('text-indent', '0px') }
})

test('text transforms preserve source and target the actual first-letter pseudo-element', async ({ page }) => {
  await page.goto('/en/reference/text-transform')
  const capital = await scene(page, 'text-transform', 'capitalized-text')
  expect(await target(capital, 1).textContent()).toBe('clear CSS for every screen')
  await expect(target(capital, 1)).toHaveCSS('text-transform', 'capitalize')
  expect((await textBox(target(capital, 1))).width).toBeGreaterThan((await textBox(target(capital, 0))).width)
  const lower = await scene(page, 'text-transform', 'lowercase-text')
  expect(await target(lower, 1).textContent()).toBe('CLEAR CSS FOR EVERY SCREEN')
  expect(await height(target(lower, 1))).toBeLessThan(await height(target(lower, 0)))
  const upper = await scene(page, 'text-transform', 'uppercase-text')
  await expect(target(upper, 1)).toHaveAttribute('lang', 'tr')
  expect(await target(upper, 1).innerText()).toBe('İSTANBUL')
  const first = await scene(page, 'text-transform', 'sentence')
  await expect(target(first)).toHaveCSS('text-transform', 'none')
  expect(await target(first).evaluate(e => getComputedStyle(e, '::first-letter').textTransform)).toBe('uppercase')
  await expect(first.locator('[data-style-pseudo]')).toHaveText('uppercase')
  expect(await target(first).textContent()).toContain('. good')
  await state(page, 'text-transform', 'text-transform', 'none', 'uppercase')
})

test('text wrap compares native line balance and complete nowrap prerequisites', async ({ page, browserName }) => {
  await page.goto('/en/reference/text-wrap')
  const balance = await scene(page, 'text-wrap', 'balance-short-headings')
  const a = await lines(target(balance, 0)), b = await lines(target(balance, 1))
  expect(a.length).toBe(b.length)
  expect(Math.abs(b[0].right - b.at(-1)!.right)).toBeLessThan(Math.abs(a[0].right - a.at(-1)!.right))
  const pretty = await scene(page, 'text-wrap', 'prefer-pretty-wrapping-for-prose')
  await expect(target(pretty, 1)).toHaveCSS('text-wrap', 'pretty')
  expect(await target(pretty, 1).textContent()).toBe(await target(pretty, 0).textContent())
  const nowrap = await scene(page, 'text-wrap', 'prevent-wrapping')
  expect(await height(target(nowrap))).toBe(24); expect(await overflows(target(nowrap))).toBe(true)
  await expect(target(nowrap)).toHaveCSS('text-overflow', 'ellipsis')
  const { frame } = await condition(page, 'text-wrap', 'text-wrap', [[360, 'wrap'], [900, 'balance'], [1400, 'pretty']])
  if (browserName === 'chromium') { await page.emulateMedia({ media: 'print' }); await expect(target(frame)).toHaveCSS('text-wrap', 'wrap') }
})

test('whitespace retains authored newlines and the eight preserved spaces', async ({ page, browserName }) => {
  await page.goto('/en/reference/white-space')
  const nowrap = await scene(page, 'white-space', 'keep-text-on-one-line')
  expect(await height(target(nowrap))).toBe(24); expect(await overflows(target(nowrap))).toBe(true)
  const newline = await scene(page, 'white-space', 'preserve-authored-line-breaks')
  expect(await target(newline, 0).textContent()).toBe('First    line\nSecond    line')
  expect(await target(newline, 1).textContent()).toBe(await target(newline, 0).textContent())
  expect(await height(target(newline, 0))).toBe(24); expect(await height(target(newline, 1))).toBe(48)
  const spaces = await scene(page, 'white-space', 'preserve-spaces-and-wrapping')
  expect(await target(spaces, 1).textContent()).toBe('token        value')
  expect(await height(target(spaces, 0))).toBe(48); expect(await height(target(spaces, 1))).toBe(72)
  const { frame } = await condition(page, 'white-space', 'white-space', [[360, 'normal'], [900, 'nowrap']])
  if (browserName === 'chromium') { await page.emulateMedia({ media: 'print' }); await expect(target(frame)).toHaveCSS('white-space', 'break-spaces'); expect(await height(target(frame))).toBe(48) }
})

test('word breaking distinguishes normal boundaries, break-all and real CJK text', async ({ page }) => {
  await page.goto('/en/reference/word-break')
  const normal = await scene(page, 'word-break', 'keep-normal-word-boundaries')
  expect(await overflows(target(normal))).toBe(true)
  const port = normal.getByRole('region', { name: 'Normal word boundaries' })
  await port.focus(); await page.keyboard.press('ArrowRight', { delay: 100 })
  await expect.poll(() => port.evaluate(e => e.scrollLeft)).toBeGreaterThan(0)
  const breakAll = await scene(page, 'word-break', 'break-anywhere-inside-words')
  expect((await lines(target(breakAll, 0)))[1].text).toBe('collaboration')
  expect((await lines(target(breakAll, 1)))[0].text).toContain('collab')
  const cjk = await scene(page, 'word-break', 'keep-cjk-words-together')
  await expect(target(cjk, 0)).toHaveAttribute('lang', 'zh-Hant')
  expect(await height(target(cjk, 0))).toBe(48); expect(await height(target(cjk, 1))).toBe(24)
  expect(await overflows(target(cjk, 1))).toBe(true)
  const shortcut = await scene(page, 'word-break', 'use-the-break-word-shortcut')
  expect(await height(target(shortcut, 0))).toBe(await height(target(shortcut, 1)))
  const { frame } = await condition(page, 'word-break', 'word-break', [[360, 'normal'], [900, 'break-all']])
  expect(await overflows(target(frame))).toBe(false)
})

test('overflow wrapping changes emergency breaks and genuine min-content width separately', async ({ page }) => {
  await page.goto('/en/reference/overflow-wrap')
  const wrap = await scene(page, 'overflow-wrap', 'break-long-unbroken-content')
  expect(await overflows(target(wrap, 0))).toBe(true); expect(await overflows(target(wrap, 1))).toBe(false)
  expect(await height(target(wrap, 1))).toBeGreaterThan(await height(target(wrap, 0)))
  const intrinsic = await scene(page, 'overflow-wrap', 'allow-breaks-anywhere')
  expect(await width(target(intrinsic, 0)) / await width(target(intrinsic, 1))).toBeCloseTo(7, 1)
  expect(await height(target(intrinsic, 1))).toBe(168)
  const reset = await scene(page, 'overflow-wrap', 'restore-normal-wrapping')
  await expect(target(reset)).toHaveCSS('overflow-wrap', 'normal')
  expect(await target(reset).evaluate(e => getComputedStyle(e.parentElement!.parentElement!).overflowWrap)).toBe('anywhere')
  const demo = example(page, 'overflow-wrap', 'apply-conditionally'), frame = await ready(demo)
  await viewport(demo, 360); const before = await width(target(frame))
  await viewport(demo, 900); await expect(target(frame)).toHaveCSS('overflow-wrap', 'anywhere')
  expect(before / await width(target(frame))).toBeCloseTo(7, 1)
})

test('hyphenation uses real language data and deterministic soft-hyphen opportunities', async ({ page }) => {
  await page.goto('/en/reference/hyphens')
  const auto = await scene(page, 'hyphens', 'allow-automatic-hyphenation')
  await expect(target(auto, 1)).toHaveAttribute('lang', 'en'); await expect(target(auto, 1)).toHaveCSS('hyphens', 'auto')
  expect(await target(auto, 1).textContent()).toBe('Antidisestablishmentarianism')
  expect(await overflows(target(auto, 0))).toBe(true)
  const manual = await scene(page, 'hyphens', 'respect-manual-hyphenation-points')
  expect(await target(manual, 0).textContent()).toBe('trans\u00adformation')
  expect(await height(target(manual, 0))).toBe(48); expect(await height(target(manual, 1))).toBe(24)
  const none = await scene(page, 'hyphens', 'disable-hyphenation')
  expect(await height(target(none, 0))).toBe(48); expect(await height(target(none, 1))).toBe(24)
  const { frame } = await condition(page, 'hyphens', 'hyphens', [[360, 'manual'], [900, 'none']])
  expect(await height(target(frame))).toBe(24); expect(await overflows(frame.locator('#scrollport'))).toBe(true)
})

test('line clamp preserves complete text and offers a real keyboard disclosure', async ({ page, browserName }) => {
  await page.goto('/en/reference/line-clamp')
  const basic = await scene(page, 'line-clamp', 'clamp-long-summaries')
  expect(await height(target(basic, 1))).toBe(72); expect(await height(target(basic, 0))).toBeGreaterThan(72)
  expect(await target(basic, 1).textContent()).toBe(await target(basic, 0).textContent())
  const demo = example(page, 'line-clamp', 'remove-a-clamp'), reset = await ready(demo)
  await viewport(demo, 360); expect(await height(target(reset))).toBe(48)
  await viewport(demo, 900); await expect(target(reset)).toHaveCSS('-webkit-line-clamp', 'none')
  expect(await height(target(reset))).toBeGreaterThan(72)
  await expect(target(reset)).toHaveCSS('display', '-webkit-box'); await expect(target(reset)).toHaveCSS('overflow', 'hidden')
  const disclosureDemo = example(page, 'line-clamp', 'keep-important-content-accessible'), disclosure = await ready(disclosureDemo)
  const summary = disclosure.getByText('Read the full project description', { exact: true }), iframe = disclosureDemo.locator('iframe')
  const initial = await height(iframe)
  await summary.focus(); await page.keyboard.press('Enter')
  await expect(disclosure.locator('details')).toHaveAttribute('open', '')
  await expect(summary).toHaveCSS('outline-width', '2px')
  await expect(disclosure.locator('details p')).toBeVisible()
  expect(await disclosure.locator('details p').textContent()).toBe(await target(disclosure).textContent())
  await expect.poll(() => height(iframe)).toBeGreaterThan(initial + 100)
  const { frame } = await condition(page, 'line-clamp', '-webkit-line-clamp', [[360, '2'], [900, '3']])
  expect(await height(target(frame))).toBe(72)
  if (browserName === 'chromium') { await page.emulateMedia({ media: 'print' }); await expect(target(frame)).toHaveCSS('-webkit-line-clamp', 'none'); expect(await height(target(frame))).toBeGreaterThan(72) }
})

test('text overflow owns clipping and releases the actual flexible wrapper minimum', async ({ page, browserName }) => {
  await page.goto('/en/reference/text-overflow')
  for (const [id, value] of [['clip-overflowing-inline-text', 'clip'], ['show-an-ellipsis', 'ellipsis']]) {
    const frame = await scene(page, 'text-overflow', id)
    await expect(target(frame)).toHaveCSS('text-overflow', value)
    expect(await overflows(target(frame))).toBe(true); expect(await height(target(frame))).toBe(24)
    expect(await width(target(frame))).toBe(200)
  }
  const flex = await scene(page, 'text-overflow', 'use-in-flex-rows')
  await expect(flex.locator('#wrapper')).toHaveCSS('min-width', '0px')
  expect(await width(target(flex))).toBeLessThan(240)
  expect(await overflows(target(flex))).toBe(true)
  await flex.locator('#wrapper').evaluate((e: HTMLElement) => { e.style.minWidth = 'auto' })
  expect(await width(target(flex))).toBeGreaterThan(250)
  const { frame } = await condition(page, 'text-overflow', 'text-overflow', [[360, 'clip'], [900, 'ellipsis']])
  if (browserName === 'chromium') {
    await page.emulateMedia({ media: 'print' })
    await expect(target(frame)).toHaveCSS('overflow', 'visible'); await expect(target(frame)).toHaveCSS('white-space', 'normal')
    expect(await height(target(frame))).toBeGreaterThan(24)
  }
})

test('direction retains genuine RTL content and an independent LTR code block', async ({ page }) => {
  await page.goto('/en/reference/direction')
  const ltr = await scene(page, 'direction', 'set-left-to-right-direction')
  await expect(ltr.locator('section[dir="rtl"]')).toHaveCount(1)
  await expect(target(ltr)).toHaveCSS('direction', 'ltr'); expect((await textBox(target(ltr))).left).toBe(0)
  const rtl = await scene(page, 'direction', 'set-right-to-left-direction')
  await expect(target(rtl)).toHaveAttribute('lang', 'ar'); expect((await textBox(target(rtl))).right).toBeCloseTo(240, 0)
  const semantic = await scene(page, 'direction', 'prefer-semantic-document-direction')
  await expect(semantic.locator('section[lang="ar"]')).toHaveAttribute('dir', 'rtl')
  await expect(target(semantic)).toHaveCSS('direction', 'ltr'); await expect(target(semantic)).toHaveCSS('display', 'block')
  expect(await target(semantic).textContent()).toBe('npm install @master/css')
  await condition(page, 'direction', 'direction', [[360, 'ltr'], [900, 'rtl']])
})

async function character(item: Locator, index: number) {
  return item.evaluate((e, index) => {
    const range = e.ownerDocument.createRange(); range.setStart(e.firstChild!, index); range.setEnd(e.firstChild!, index + 1)
    const r = range.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }
  }, index)
}

test('writing mode changes native column progression and preserves nested horizontal flow', async ({ page, browserName }) => {
  await page.goto('/en/reference/writing-mode')
  const columns = await scene(page, 'writing-mode', 'use-vertical-right-to-left-flow')
  expect((await character(target(columns, 0), 8)).x).toBeLessThan((await character(target(columns, 0), 0)).x)
  expect((await character(target(columns, 1), 8)).x).toBeGreaterThan((await character(target(columns, 1), 0)).x)
  const nested = await scene(page, 'writing-mode', 'restore-horizontal-text')
  await expect(nested.locator('#context')).toHaveCSS('writing-mode', 'vertical-rl')
  await expect(target(nested)).toHaveCSS('writing-mode', 'horizontal-tb'); expect(await height(target(nested))).toBe(48)
  const orientation = await scene(page, 'writing-mode', 'pair-with-text-orientation')
  expect((await character(target(orientation, 1), 0)).height).toBeGreaterThan((await character(target(orientation, 0), 0)).height)
  const { frame } = await condition(page, 'writing-mode', 'writing-mode', [[360, 'vertical-rl'], [900, 'horizontal-tb']])
  if (browserName === 'chromium') { await page.emulateMedia({ media: 'print' }); await expect(target(frame)).toHaveCSS('writing-mode', 'horizontal-tb') }
})

test('text orientation keeps vertical writing and changes actual glyph geometry', async ({ page }) => {
  await page.goto('/en/reference/text-orientation')
  const samples: Record<string, Locator> = {}
  for (const [id, value] of [['keep-characters-upright', 'upright'], ['use-mixed-orientation', 'mixed'], ['use-sideways-orientation', 'sideways']]) {
    const frame = await scene(page, 'text-orientation', id); samples[value] = target(frame)
    await expect(samples[value]).toHaveCSS('writing-mode', 'vertical-rl'); await expect(samples[value]).toHaveCSS('text-orientation', value)
  }
  expect((await character(samples.upright, 3)).height).toBeGreaterThan((await character(samples.mixed, 3)).height)
  await state(page, 'text-orientation', 'text-orientation', 'mixed', 'upright')
})

test('text rendering exposes real SVG and inherited hints without a performance claim', async ({ page }) => {
  await page.goto('/en/reference/text-rendering')
  const legibility = await scene(page, 'text-rendering', 'optimize-legibility')
  await expect(legibility.getByRole('img', { name: 'AV office typography specimen' })).toHaveCount(2)
  await expect(target(legibility, 1)).toHaveCSS('text-rendering', 'optimizelegibility')
  const speed = await scene(page, 'text-rendering', 'prefer-speed-for-dense-updates')
  await expect(target(speed)).toHaveCSS('text-rendering', 'optimizespeed')
  const reset = await scene(page, 'text-rendering', 'return-to-browser-behavior')
  await expect(target(reset)).toHaveCSS('text-rendering', 'auto')
  expect(await target(reset).evaluate(e => getComputedStyle(e.parentElement!).textRendering.toLowerCase())).toBe('optimizelegibility')
  await state(page, 'text-rendering', 'text-rendering', 'auto', 'optimizelegibility')
})

for (const route of routes) {
  test(`text-flow composition: ${route}`, async ({ page }, testInfo) => {
    const failures: string[] = []
    page.on('pageerror', error => failures.push(error.message))
    page.on('console', message => { if (message.type() === 'error' && /hydration|hydrate|mismatch/i.test(message.text())) failures.push(message.text()) })
    await page.goto(`/en/reference/${route}`)
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
