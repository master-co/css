/** Real-time motion review: MASTER_WORKFLOW_BROWSER=webkit node --test site/tests/workflow-motion.e2e.mjs.
 * The stage takes one complete 72-second tour at each size/theme. No clock acceleration.
 */
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium, webkit } from '@playwright/test'
const browserName = process.env.MASTER_WORKFLOW_BROWSER ?? 'chromium'
const url = process.env.MASTER_WORKFLOW_URL ?? 'http://localhost:3000'
const output = process.env.MASTER_WORKFLOW_CAPTURE ?? join(tmpdir(), `master-workflow-motion-${browserName}`)
let browser
before(async () => { browser = await ({ chromium, webkit })[browserName].launch(); await mkdir(output, { recursive: true }) })
after(async () => { await browser?.close() })
async function open(width, scheme, observeSleep = false) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: scheme, reducedMotion: 'no-preference' })
  const page = await context.newPage()
  await page.routeWebSocket(socket => socket.hostname === new URL(url).hostname, socket => socket.close())
  await page.addInitScript(() => {
    window.workflowDraws = new Map()
    const clear = CanvasRenderingContext2D.prototype.clearRect
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.classList.contains('home-wf-canvas')) window.workflowDraws.set(this.canvas, (window.workflowDraws.get(this.canvas) ?? 0) + 1)
      return clear.apply(this, args)
    }
  })
  if (observeSleep) await page.addInitScript(() => {
    window.workflowRests = {}
    let painting
    const clear = CanvasRenderingContext2D.prototype.clearRect
    const timer = window.setTimeout
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      const figure = this.canvas.classList.contains('home-wf-canvas') && this.canvas.closest('[data-wf]')
      if (figure) { painting = figure.dataset.wf; queueMicrotask(() => { painting = undefined }) }
      return clear.apply(this, args)
    }
    window.setTimeout = function (callback, delay, ...args) {
      const id = timer.call(this, callback, delay, ...args)
      if (painting && delay > 0) window.workflowRests[painting] = { key: document.querySelector(`[data-wf="${painting}"]`).dataset.active, at: performance.now() }
      return id
    }
  })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  return { page, context, errors }
}
const active = figure => figure.getAttribute('data-active')
const draws = figure => figure.locator('canvas').evaluate(canvas => window.workflowDraws.get(canvas) ?? 0)
test(`${browserName}: a project socket catches the light after its local connection arrives`, { timeout: 20000 }, async () => {
  const { page, context, errors } = await open(390, 'dark')
  const figure = page.locator('[data-wf="repo"]')
  await figure.scrollIntoViewIfNeeded()
  await figure.locator('[data-renderer="canvas"]').waitFor()
  await page.mouse.move(0, 0)
  const key = await active(figure)
  const goldAtSocket = () => figure.evaluate((figure, key) => {
    const canvas = figure.querySelector('canvas'), scene = canvas.getBoundingClientRect()
    const target = figure.querySelector(`[data-wf-anchor="project-${key}"]`).getBoundingClientRect()
    const density = canvas.width / scene.width
    const x = Math.round((target.left - scene.left) * density)
    const y = Math.round((target.top + target.height / 2 + 6 - scene.top) * density)
    const pixels = canvas.getContext('2d').getImageData(x - 3, y - 3, 7, 7).data
    let gold = 0
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] - pixels[i + 1] > 10 && pixels[i + 1] - pixels[i + 2] > 25 && pixels[i + 3] > 80) gold++
    }
    return gold
  }, key)
  await page.waitForTimeout(250)
  assert.equal(await goldAtSocket(), 0, 'the destination must stay neutral before contact')
  await page.waitForTimeout(1800)
  assert.ok(await goldAtSocket() > 0, 'the arrived signal must light the destination socket')
  assert.equal(await active(figure), key)
  assert.deepEqual(errors, [])
  await context.close()
})
for (const width of [390, 1440]) test(`${browserName}: project and route tours at ${width}px keep their full content`, { timeout: 60000 }, async () => {
  const { page, context, errors } = await open(width, 'dark')
  for (const [name, count] of [['repo', 2], ['routes', 3]]) {
    const figure = page.locator(`[data-wf="${name}"]`)
    await figure.scrollIntoViewIfNeeded()
    await figure.locator('[data-renderer="canvas"]').waitFor()
    await page.mouse.move(0, 0)
    const box = await figure.boundingBox()
    const seen = new Set()
    for (let step = 0; step < count; step++) {
      const key = await active(figure)
      seen.add(key)
      if (name === 'repo') assert.equal(await figure.locator(`[data-wf-pick="${key}"]`).getAttribute('aria-pressed'), 'true')
      else {
        assert.equal(await figure.locator(`input[value="${key}"]`).isChecked(), true)
        assert.equal(await figure.locator('[data-sheet]:visible').count(), 1)
      }
      assert.ok(Math.abs((await figure.boundingBox()).height - box.height) < .5)
      if (step < count - 1) await page.waitForFunction(({ name, key }) => document.querySelector(`[data-wf="${name}"]`).dataset.active !== key, { name, key }, { timeout: 8000 })
    }
    assert.equal(seen.size, count)
  }
  const trace = page.locator('[data-wf="trace"]')
  await trace.scrollIntoViewIfNeeded()
  await trace.locator('[data-renderer="canvas"]').waitFor()
  await page.mouse.move(0, 0)
  await trace.locator('[data-wf-play]').click()
  await trace.locator('[data-wf-play]').click()
  await page.mouse.click(1, 100)
  await page.mouse.move(0, 0)
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  const before = await trace.locator('.home-wf-trace-dot').first().evaluate(dot => getComputedStyle(dot).backgroundColor)
  await page.waitForTimeout(1350)
  const after = await trace.locator('.home-wf-trace-dot').first().evaluate(dot => getComputedStyle(dot).backgroundColor)
  assert.notEqual(after, before, 'the change reaches the class swatches')
  assert.deepEqual(errors, [])
  await context.close()
})
for (const width of [390, 1440]) for (const scheme of ['light', 'dark']) {
  test(`${browserName}: complete framework tour at ${width}px ${scheme}`, { timeout: 100000 }, async () => {
    const { page, context, errors } = await open(width, scheme)
    const figure = page.locator('[data-wf="stage"]')
    await figure.scrollIntoViewIfNeeded()
    await figure.locator('[data-renderer="canvas"]').waitFor()
    await page.mouse.move(0, 0)
    const box = await figure.boundingBox()
    const seen = new Set()
    let previous = await active(figure)
    for (let step = 0; step < 16; step++) {
      const key = await active(figure)
      assert.equal(seen.has(key), false, `framework ${key} repeated before every guide was shown`)
      seen.add(key)
      await page.waitForTimeout(1150)
      await figure.screenshot({ path: join(output, `${width}-${scheme}-${String(step).padStart(2, '0')}-${key}.png`) })
      const current = await figure.boundingBox()
      assert.ok(Math.abs(current.height - box.height) < .5, 'tour does not move the next row')
      assert.equal(await figure.locator(`[data-wf-pick="${key}"]`).getAttribute('data-lit'), '')
      if (step < 15) {
        previous = key
        await page.waitForFunction(key => document.querySelector('[data-wf="stage"]').dataset.active !== key, previous, { timeout: 7000 })
      }
    }
    assert.equal(seen.size, 16)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    assert.deepEqual(errors, [])
    await context.close()
  })
}
test(`${browserName}: a destination lights on arrival and retains a reader's preview`, { timeout: 20000 }, async () => {
  const { page, context, errors } = await open(390, 'dark')
  const figure = page.locator('[data-wf="stage"]')
  await figure.scrollIntoViewIfNeeded()
  await figure.locator('[data-renderer="canvas"]').waitFor()
  await page.mouse.move(0, 0)
  const first = await active(figure)
  const charge = key => figure.locator(`[data-wf-pick="${key}"]`).evaluate(node => Number(node.style.getPropertyValue('--home-wf-charge')))
  await page.waitForTimeout(900)
  assert.equal(await charge(first), 0, 'the destination must not light before the signal arrives')
  await page.waitForTimeout(2400)
  assert.equal(await charge(first), 1, 'the arrived signal lights the destination')
  await page.waitForFunction(key => document.querySelector('[data-wf="stage"]').dataset.active !== key, first, { timeout: 3500 })
  const next = await active(figure), link = figure.locator(`[data-wf-pick="${next}"]`)
  assert.equal(await charge(next), 0)
  await link.focus()
  await page.waitForFunction(key => Number(document.querySelector(`[data-wf-pick="${key}"]`).style.getPropertyValue('--home-wf-charge')) === 1, next)
  await link.evaluate(node => node.blur())
  await page.waitForTimeout(180)
  assert.equal(await charge(next), 1, 'leaving a preview must not drop the destination back into darkness')
  assert.deepEqual(errors, [])
  await context.close()
})
test(`${browserName}: responsive reflow retains an arrived destination and its rest`, { timeout: 20000 }, async () => {
  const { page, context, errors } = await open(1440, 'light', true)
  await page.evaluate(() => document.fonts.ready)
  const figure = page.locator('[data-wf="stage"]')
  const size = width => figure.evaluate((figure, width) => {
    const css = getComputedStyle(figure)
    figure.style.width = `${width + parseFloat(css.paddingLeft) + parseFloat(css.paddingRight)}px`
  }, width)
  await size(480)
  await figure.scrollIntoViewIfNeeded()
  await figure.locator('[data-renderer="canvas"]').waitFor()
  await page.mouse.move(0, 0)
  const key = await active(figure)
  const charge = () => figure.locator(`[data-wf-pick="${key}"]`).evaluate(node => Number(node.style.getPropertyValue('--home-wf-charge')))
  await page.waitForFunction(key => window.workflowRests.stage?.key === key, key)
  assert.equal(await charge(), 1)
  await size(479)
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  assert.equal(await charge(), 1, 'changing from two rows to four must not dim an arrived destination')
  const settled = await draws(figure)
  await page.waitForTimeout(220)
  assert.equal(await draws(figure), settled, 'responsive reflow must not replay a finished flight')
  assert.equal(await active(figure), key)
  assert.deepEqual(errors, [])
  await context.close()
})
test(`${browserName}: sleeping, explicit pause, focus, offscreen and hidden-tab clocks`, { timeout: 90000 }, async () => {
  const { page, context, errors } = await open(1440, 'light')
  const figure = page.locator('[data-wf="stage"]')
  await figure.scrollIntoViewIfNeeded()
  await figure.locator('[data-renderer="canvas"]').waitFor()
  await page.mouse.move(0, 0)
  await page.waitForTimeout(3100)
  const sleeping = await draws(figure)
  await page.waitForTimeout(850)
  assert.equal(await draws(figure), sleeping, 'a settled illustration sleeps between flights')
  await figure.locator('[data-wf-play]').click()
  await page.mouse.move(0, 0)
  await page.mouse.click(1, 100)
  const paused = await active(figure)
  const pausedDraws = await draws(figure)
  await page.waitForTimeout(5300)
  assert.equal(await active(figure), paused)
  assert.equal(await draws(figure), pausedDraws)
  await figure.locator('[data-wf-play]').click()
  await page.waitForFunction(key => document.querySelector('[data-wf="stage"]').dataset.active !== key, paused, { timeout: 6500 })
  await figure.locator('[data-wf-pick="2"]').focus()
  const held = await active(figure)
  await page.waitForTimeout(5100)
  assert.equal(await active(figure), held, 'keyboard focus holds the chosen guide')
  await page.mouse.click(1, 100)
  await page.mouse.move(0, 0)
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  const hidden = await draws(figure)
  await page.waitForTimeout(1200)
  assert.equal(await draws(figure), hidden)
  await page.evaluate(() => {
    delete document.hidden
    document.dispatchEvent(new Event('visibilitychange'))
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(350)
  const offscreen = await draws(figure)
  await page.waitForTimeout(1500)
  assert.equal(await draws(figure), offscreen)
  assert.deepEqual(errors, [])
  await context.close()
})
