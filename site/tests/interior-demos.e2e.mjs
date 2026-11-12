/** Verify that the refined document chrome keeps real specimens usable. */
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { before, after, test } from 'node:test'
import { chromium, webkit } from '@playwright/test'

const engine = process.env.MASTER_SITE_BROWSER ?? 'chromium'
const base = process.env.MASTER_SITE_URL ?? 'http://127.0.0.1:3222'
const output = new URL(`../test-results/interior-redesign/demos-${engine}/`, import.meta.url)
const routes = ['typography', 'colors', 'layout-system', 'responsive-design']
const readings = []
let browser
before(async () => { await mkdir(output, { recursive: true }); browser = await ({ chromium, webkit })[engine].launch() })
after(async () => { await browser?.close(); await writeFile(new URL('readings.json', output), JSON.stringify(readings, null, 2) + '\n') })

async function open(route, { width = 390, scheme = 'light', enlarged = false, motion = 'reduce' } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: scheme, reducedMotion: motion, hasTouch: width < 768 })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const response = await page.goto(base + route, { waitUntil: 'networkidle', timeout: 60000 })
  assert.equal(response.status(), 200)
  if (enlarged) await page.addStyleTag({ content: 'html { font-size: 32px !important }' })
  await page.evaluate(() => document.fonts.ready)
  return { context, page, errors }
}

async function readyFrame(iframe) {
  await iframe.scrollIntoViewIfNeeded()
  await iframe.page().waitForFunction(element => element.dataset.ready === 'true', await iframe.elementHandle())
  const frame = await (await iframe.elementHandle()).contentFrame()
  await frame.evaluate(() => document.fonts.ready)
  return frame
}

async function noPageOverflow(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'wide specimens scroll inside their own frame')
}

for (const locale of ['en', 'tw']) for (const scene of [
  { width: 390, scheme: 'light' },
  { width: 1440, scheme: 'dark' },
]) for (const slug of routes) {
  test(`${engine} ${locale} ${scene.width} ${scene.scheme}: ${slug} frames load and fit their chrome`, { timeout: 90000 }, async () => {
    const route = `${locale === 'tw' ? '/tw' : ''}/guide/${slug}`
    const { context, page, errors } = await open(route, scene)
    try {
      const iframes = page.locator('.ui-browser-viewport > iframe')
      const count = await iframes.count()
      const frames = []
      for (let index = 0; index < count; index++) {
        const iframe = iframes.nth(index)
        const title = await iframe.getAttribute('title')
        assert.ok(title?.trim(), 'the frame has a meaningful name')
        const frame = await readyFrame(iframe)
        const metrics = await frame.evaluate(() => ({
          bodyChildren: document.body.childElementCount,
          text: document.body.textContent.trim().slice(0, 180),
          height: document.body.getBoundingClientRect().height,
          viewportHeight: innerHeight,
          scheme: getComputedStyle(document.documentElement).colorScheme,
          sizing: frameElement.dataset.sizing,
          brokenImages: [...document.images].filter(image => image.complete && !image.naturalWidth).map(image => image.src),
        }))
        assert.ok(metrics.bodyChildren > 0 && metrics.text, `${title} contains the real scene`)
        assert.deepEqual(metrics.brokenImages, [], `${title} images load`)
        if (metrics.sizing === 'content') assert.ok(metrics.viewportHeight >= metrics.height - 1, `${title} keeps its full content visible`)
        frames.push({ title, ...metrics })
      }
      await noPageOverflow(page)
      readings.push({ route, ...scene, frames })
      await page.locator('figure.ui-tray').first().screenshot({ path: new URL(`${locale}-${scene.width}-${slug}.png`, output).pathname })
      assert.deepEqual(errors, [])
    } finally { await context.close() }
  })
}

for (const slug of ['typography', 'responsive-design', 'layout-system']) test(`${engine} 320 enlarged: ${slug} frame controls and content remain usable`, { timeout: 90000 }, async () => {
  const { context, page, errors } = await open(`/guide/${slug}`, { width: 320, enlarged: true })
  try {
    const frames = page.locator('.ui-browser-viewport > iframe')
    for (const iframe of await frames.all()) {
      const frame = await readyFrame(iframe)
      // Text-only enlargement has to be applied inside independent browsing contexts too.
      await frame.addStyleTag({ content: 'html { font-size: 32px !important }' })
      if (await iframe.getAttribute('data-sizing') === 'content') {
        await page.waitForFunction(element => element.clientHeight + 1 >= element.contentDocument.body.getBoundingClientRect().height, await iframe.elementHandle())
      }
    }
    await noPageOverflow(page)
    const controls = await page.locator('.ui-browser-tools :is(button, input)').evaluateAll(elements => elements.filter(element => element.getClientRects().length).map(element => ({ tag: element.tagName, text: element.textContent, width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })))
    assert.ok(controls.every(control => control.width >= 44 && control.height >= 44), 'enlarged touch controls keep a usable target')
    readings.push({ route: `/guide/${slug}`, width: 320, enlarged: true, controls })
    await page.locator('figure.ui-tray').first().screenshot({ path: new URL(`320-enlarged-${slug}.png`, output).pathname })
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${engine}: viewport slider changes the actual frame and Fit restores document width`, { timeout: 60000 }, async () => {
  const { context, page, errors } = await open('/guide/responsive-design#based-on-viewport-breakpoints')
  try {
    const demo = page.locator('[data-foundation="breakpoint"]')
    const iframe = demo.locator('iframe')
    const frame = await readyFrame(iframe)
    const range = demo.getByRole('slider', { name: 'Viewport', exact: true })
    const initial = await frame.evaluate(() => innerWidth)
    await range.focus(); await range.press('End')
    const maximum = Number(await range.getAttribute('max'))
    await frame.waitForFunction(expected => innerWidth === expected, maximum)
    const largeType = await frame.locator('[data-target]').evaluate(element => getComputedStyle(element).fontSize)
    await noPageOverflow(page)
    await demo.getByRole('button', { name: 'Fit', exact: true }).click()
    await frame.waitForFunction(expected => Math.abs(innerWidth - expected) < 2, initial)
    const fitType = await frame.locator('[data-target]').evaluate(element => getComputedStyle(element).fontSize)
    assert.notEqual(largeType, fitType, 'the authored breakpoint really changes the heading')
    readings.push({ action: 'viewport', initial, maximum, largeType, fitType })
    await demo.screenshot({ path: new URL('viewport-fit.png', output).pathname })
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${engine}: example theme control updates the iframe and keeps the document mode`, { timeout: 60000 }, async () => {
  const { context, page, errors } = await open('/guide/layout-system')
  try {
    const demo = page.locator('figure.ui-tray').first()
    const frame = await readyFrame(demo.locator('iframe'))
    const theme = demo.getByTitle('Toggle dark theme', { exact: true })
    const name = await theme.evaluate(element => element.textContent.trim())
    const names = [name]
    const host = await page.evaluate(() => document.documentElement.className)
    const initial = await theme.getAttribute('aria-pressed')
    await theme.click()
    await page.waitForFunction(({ element, value }) => element.getAttribute('aria-pressed') !== value, { element: await theme.elementHandle(), value: initial })
    assert.notEqual(await theme.getAttribute('aria-pressed'), initial)
    assert.equal(await frame.evaluate(() => document.documentElement.classList.contains('dark')), initial !== 'true')
    assert.equal(await page.evaluate(() => document.documentElement.className), host)
    names.push(await theme.evaluate(element => element.textContent.trim()))
    await demo.screenshot({ path: new URL('example-dark.png', output).pathname })
    await theme.click()
    await page.waitForFunction(({ element, value }) => element.getAttribute('aria-pressed') === value, { element: await theme.elementHandle(), value: initial })
    assert.equal(await theme.getAttribute('aria-pressed'), initial)
    assert.deepEqual(names, [name, name], 'a toggle keeps its name; aria-pressed carries the state')
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${engine}: delivery payload bars compare complete responses on one scale`, { timeout: 60000 }, async () => {
  const { context, page, errors } = await open('/benchmarks', { width: 390, scheme: 'dark' })
  try {
    const ratios = await page.locator('.ui-bar[data-variant="stacked"]').evaluateAll(elements => elements.map(element => {
      const style = getComputedStyle(element)
      const width = element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
      const filled = [...element.children].reduce((sum, child) => sum + child.getBoundingClientRect().width, 0)
      return filled / width
    }))
    const totals = [2996, 34148, 36138, 3698]
    assert.equal(ratios.length, totals.length)
    for (const [index, total] of totals.entries()) {
      assert.ok(Math.abs(ratios[index] - total / 36138) < .001, 'bar length reflects its response total on the shared scale')
    }
    await noPageOverflow(page)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

if (engine === 'chromium') test('chromium: forced colors retain palette samples and keyboard focus', { timeout: 60000 }, async () => {
  // The complete palette lives on the Reference Color page.
  const { context, page, errors } = await open('/reference/tokens/color', { width: 390, enlarged: true })
  try {
    const palette = page.locator('.ui-palette').first()
    const chips = palette.locator('.ui-palette-chip')
    const colors = await chips.evaluateAll(elements => elements.map(element => getComputedStyle(element).backgroundColor))
    assert.ok(new Set(colors).size > 20, 'the palette contains distinct color samples')
    await page.emulateMedia({ forcedColors: 'active' })
    assert.equal(await page.evaluate(() => matchMedia('(forced-colors: active)').matches), true)
    assert.deepEqual(await chips.evaluateAll(elements => elements.map(element => getComputedStyle(element).backgroundColor)), colors, 'samples retain their actual colors')
    assert.equal(await palette.locator('.ui-palette-row > span').first().evaluate(element => getComputedStyle(element).forcedColorAdjust), 'auto', 'surrounding labels still follow the user palette')
    await chips.first().focus()
    await page.keyboard.press('Tab')
    const focus = await page.locator(':focus').evaluate(element => {
      const style = getComputedStyle(element)
      return { chip: element.classList.contains('ui-palette-chip'), visible: element.matches(':focus-visible'), width: parseFloat(style.outlineWidth), offset: parseFloat(style.outlineOffset), style: style.outlineStyle }
    })
    assert.ok(focus.chip && focus.visible && focus.width >= 2 && focus.offset >= 2 && focus.style !== 'none', 'keyboard focus has a visible offset boundary')
    await noPageOverflow(page)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

if (engine === 'chromium') test('chromium: forced colors preserve benchmark lengths, zero values and breakdown labels', { timeout: 60000 }, async () => {
  const { context, page, errors } = await open('/benchmarks', { width: 390, scheme: 'dark' })
  try {
    const fills = page.locator('.ui-bar[role="meter"] > i, .ui-bar[data-variant="stacked"] > i')
    const before = await fills.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width))
    const labels = await page.locator('.ui-chart .ui-legend[role="group"]').allTextContents()
    await page.emulateMedia({ forcedColors: 'active' })
    assert.equal(await page.evaluate(() => matchMedia('(forced-colors: active)').matches), true)
    const after = await fills.evaluateAll(elements => elements.map(element => {
      const style = getComputedStyle(element)
      return { width: element.getBoundingClientRect().width, fill: style.backgroundColor, track: getComputedStyle(element.parentElement).backgroundColor, value: element.parentElement.getAttribute('aria-valuenow') }
    }))
    assert.ok(after.some(item => item.width > 0) && after.some(item => item.value === '0'))
    assert.equal(after.length, before.length)
    for (const [index, item] of after.entries()) {
      assert.ok(Math.abs(item.width - before[index]) < .01, 'forced colors do not change the measured bar length')
      if (item.width > 0) assert.notEqual(item.fill, item.track, 'positive values remain visible')
      if (item.value === '0') assert.equal(item.width, 0, 'zero values do not acquire a visible fill')
    }
    assert.deepEqual(await page.locator('.ui-chart .ui-legend[role="group"]').allTextContents(), labels, 'each stack retains its named numeric breakdown')
    await noPageOverflow(page)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})
