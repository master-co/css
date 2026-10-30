/** Verify that the refined document chrome keeps real specimens usable. */
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { before, after, test } from 'node:test'
import { chromium, webkit } from '@playwright/test'

const engine = process.env.MASTER_SITE_BROWSER ?? 'chromium'
const base = process.env.MASTER_SITE_URL ?? 'http://127.0.0.1:3222'
const output = new URL(`../test-results/interior-redesign/demos-${engine}/`, import.meta.url)
const routes = ['typography', 'breakpoints', 'containers', 'colors', 'sizing', 'corner-radius', 'elevation', 'motion', 'layout-system', 'responsive-design']
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
      const iframes = page.locator('iframe.demo-viewport')
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
      await page.locator('.site-demo').first().screenshot({ path: new URL(`${locale}-${scene.width}-${slug}.png`, output).pathname })
      assert.deepEqual(errors, [])
    } finally { await context.close() }
  })
}

for (const slug of ['typography', 'breakpoints', 'motion', 'layout-system']) test(`${engine} 320 enlarged: ${slug} frame controls and content remain usable`, { timeout: 90000 }, async () => {
  const { context, page, errors } = await open(`/guide/${slug}`, { width: 320, enlarged: true })
  try {
    const frames = page.locator('iframe.demo-viewport')
    for (const iframe of await frames.all()) {
      const frame = await readyFrame(iframe)
      // Text-only enlargement has to be applied inside independent browsing contexts too.
      await frame.addStyleTag({ content: 'html { font-size: 32px !important }' })
      if (await iframe.getAttribute('data-sizing') === 'content') {
        await page.waitForFunction(element => element.clientHeight + 1 >= element.contentDocument.body.getBoundingClientRect().height, await iframe.elementHandle())
      }
    }
    await noPageOverflow(page)
    const controls = await page.locator('.demo-viewport-toolbar :is(button, input)').evaluateAll(elements => elements.filter(element => element.getClientRects().length).map(element => ({ tag: element.tagName, text: element.textContent, width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })))
    assert.ok(controls.every(control => control.width >= 44 && control.height >= 44), 'enlarged touch controls keep a usable target')
    readings.push({ route: `/guide/${slug}`, width: 320, enlarged: true, controls })
    await page.locator('.site-demo').first().screenshot({ path: new URL(`320-enlarged-${slug}.png`, output).pathname })
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${engine}: viewport slider changes the actual frame and Fit restores document width`, { timeout: 60000 }, async () => {
  const { context, page, errors } = await open('/guide/breakpoints')
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
    const demo = page.locator('.site-demo').first()
    const frame = await readyFrame(demo.locator('iframe'))
    const theme = demo.getByRole('button', { name: 'Theme', exact: true })
    const host = await page.evaluate(() => document.documentElement.className)
    const initial = await theme.getAttribute('aria-pressed')
    await theme.click()
    await page.waitForFunction(({ element, value }) => element.getAttribute('aria-pressed') !== value, { element: await theme.elementHandle(), value: initial })
    assert.notEqual(await theme.getAttribute('aria-pressed'), initial)
    assert.equal(await frame.evaluate(() => document.documentElement.classList.contains('dark')), initial !== 'true')
    assert.equal(await page.evaluate(() => document.documentElement.className), host)
    await demo.screenshot({ path: new URL('example-dark.png', output).pathname })
    await theme.click()
    await page.waitForFunction(({ element, value }) => element.getAttribute('aria-pressed') === value, { element: await theme.elementHandle(), value: initial })
    assert.equal(await theme.getAttribute('aria-pressed'), initial)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${engine}: finite motion and native dialog preserve reduced-motion and focus behavior`, { timeout: 90000 }, async () => {
  const { context, page, errors } = await open('/guide/motion', { motion: 'no-preference' })
  try {
    const demo = page.locator('[data-foundation-type-motion="finite-motion"]')
    const frame = await readyFrame(demo.locator('iframe'))
    assert.ok(await frame.evaluate(() => document.getAnimations().every(animation => animation.playState === 'paused')))
    await demo.getByRole('button', { name: 'Play', exact: true }).click()
    await frame.waitForFunction(() => document.getAnimations().some(animation => ['running', 'finished'].includes(animation.playState)))
    await demo.getByRole('button', { name: 'Pause', exact: true }).click()
    assert.ok(await frame.evaluate(() => document.getAnimations().every(animation => animation.playState === 'paused')))
    await demo.getByRole('button', { name: 'Replay', exact: true }).click()
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await frame.waitForFunction(() => document.getAnimations().every(animation => animation.playState !== 'running'))
    assert.equal(await frame.locator('#fade').evaluate(element => getComputedStyle(element).opacity), '1')
    const dialogDemo = page.locator('[data-foundation-type-motion="dialog-entrance"]')
    const dialogFrame = await readyFrame(dialogDemo.locator('iframe'))
    const trigger = dialogFrame.getByRole('button', { name: 'Open details', exact: true })
    await trigger.click()
    const dialog = dialogFrame.getByRole('dialog', { name: 'Collection details', exact: true })
    assert.equal(await dialog.evaluate(element => element.matches(':modal')), true)
    await page.screenshot({ path: new URL('native-dialog.png', output).pathname })
    await page.keyboard.press('Escape')
    assert.equal(await dialog.isVisible(), false)
    assert.equal(await trigger.evaluate(element => element === document.activeElement), true)
    await noPageOverflow(page)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${engine}: enlarged sizing specimen retains the measured avatar while its text reflows`, { timeout: 60000 }, async () => {
  const { context, page, errors } = await open('/tw/guide/sizing', { width: 320, enlarged: true })
  try {
    const demo = page.locator('[data-foundation="sizing"]')
    const avatar = demo.locator('.demo-item')
    assert.equal(Math.round((await avatar.boundingBox()).width), 96, 'the authored 3rem avatar is preserved at a 32px root')
    const canvas = await demo.locator('.demo-canvas').boundingBox()
    const prose = demo.getByText('Measured avatar. Flexible content.', { exact: true })
    const text = await prose.boundingBox()
    assert.ok(text.x >= canvas.x && text.x + text.width <= canvas.x + canvas.width, 'the flexible text stays in the specimen')
    await noPageOverflow(page)
    await demo.screenshot({ path: new URL('320-tw-enlarged-sizing.png', output).pathname })
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})
