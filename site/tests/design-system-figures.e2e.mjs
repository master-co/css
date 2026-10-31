/** Run against the local site with node --test site/tests/design-system-figures.e2e.mjs.
 * MASTER_DESIGN_BROWSER=webkit and MASTER_DESIGN_MATRIX=full expand browser and responsive coverage.
 */
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import { chromium, webkit } from '@playwright/test'
import Color from 'colorjs.io'
import { paletteGeometry } from '../content/components/palette-geometry.ts'

const browserName = process.env.MASTER_DESIGN_BROWSER ?? 'chromium'
const url = process.env.MASTER_DESIGN_URL ?? 'http://localhost:3000'
const full = process.env.MASTER_DESIGN_MATRIX === 'full'
const artifacts = process.env.MASTER_DESIGN_ARTIFACTS
let browser
before(async () => {
  browser = await ({ chromium, webkit })[browserName].launch()
  if (artifacts) await mkdir(artifacts, { recursive: true })
})
after(async () => { await browser?.close() })

async function open({ width = 1440, height = 1100, scheme = 'light', locale = 'en', motion = 'reduce', canvas = true, js = true, touch = false, density = 1, reveal = true } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, colorScheme: scheme, reducedMotion: motion, javaScriptEnabled: js, hasTouch: touch, isMobile: touch, deviceScaleFactor: density })
  if (js) await context.addInitScript(({ canvas }) => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (...args) {
      if (!canvas && this.classList.contains('home-palette-canvas')) return null
      return getContext.apply(this, args)
    }
    window.paletteStats = { paints: 0, basePaints: 0, durations: [] }
    const drawImage = CanvasRenderingContext2D.prototype.drawImage
    CanvasRenderingContext2D.prototype.drawImage = function (...args) {
      if (this.canvas.classList.contains('home-palette-canvas')) window.paletteStats.paints++
      return drawImage.apply(this, args)
    }
    const fillRect = CanvasRenderingContext2D.prototype.fillRect
    CanvasRenderingContext2D.prototype.fillRect = function (...args) {
      if (this.canvas.hasAttribute('data-home-palette-cache')) window.paletteStats.basePaints++
      return fillRect.apply(this, args)
    }
    const raf = requestAnimationFrame
    window.requestAnimationFrame = callback => raf(time => {
      const count = window.paletteStats.paints
      const start = performance.now()
      callback(time)
      if (count !== window.paletteStats.paints) window.paletteStats.durations.push(performance.now() - start)
    })
  }, { canvas })
  const page = await context.newPage()
  await page.routeWebSocket(socket => socket.hostname === new URL(url).hostname, socket => socket.onMessage(() => undefined))
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const response = await page.goto(`${url}/${locale === 'tw' ? 'tw' : ''}`, { waitUntil: 'networkidle' })
  assert.equal(response.status(), 200)
  if (reveal) await page.locator('.home-palette-stage').scrollIntoViewIfNeeded()
  await page.evaluate(() => document.fonts.ready)
  if (js && canvas && reveal) await page.waitForSelector('.home-palette-stage[data-renderer=canvas]')
  return { context, page, errors }
}

async function table(page) {
  const rect = await page.locator('.home-palette-scene').boundingBox()
  await page.mouse.move(rect.x + rect.width / 2, rect.y + 12)
  await page.locator('.home-palette-scene[data-projection=flat]').waitFor()
}

async function pointFor(page, token) {
  const model = await page.locator('.home-palette-scene').evaluate(element => ({
    rect: element.getBoundingClientRect().toJSON(),
    readoutInset: element.getBoundingClientRect().bottom - element.parentElement.querySelector('.home-palette-inspector').getBoundingClientRect().top + 16,
    samples: [...element.querySelectorAll('[data-token]')].map(el => ({ token: el.dataset.token, column: Number(el.dataset.column), row: Number(el.dataset.row), chroma: Number(el.dataset.chroma) }))
  }))
  const columns = Math.max(...model.samples.map(sample => sample.column)) + 1
  const rows = Math.max(...model.samples.map(sample => sample.row)) + 1
  const geometry = paletteGeometry(model.rect.width, model.rect.height, 1, model.samples, columns, rows, model.readoutInset)
  const cell = geometry.cells.find(cell => cell.index === model.samples.findIndex(sample => sample.token === token))
  assert.ok(cell, token)
  return { x: model.rect.x + cell.center.x, y: model.rect.y + cell.center.y }
}

async function select(page, token, touch = false) {
  const point = await pointFor(page, token)
  if (touch) await page.touchscreen.tap(point.x, point.y)
  else await page.mouse.click(point.x, point.y)
  await page.waitForFunction(token => document.querySelector('.home-palette-canvas')?.dataset.active === token, token)
  assert.equal(await page.locator('.home-palette-token').textContent(), token)
}

async function pixel(page, point) {
  return page.locator('.home-palette-canvas').evaluate((canvas, point) => {
    const rect = canvas.getBoundingClientRect()
    const image = canvas.getContext('2d').getImageData(Math.floor((point.x - rect.left) * canvas.width / rect.width), Math.floor((point.y - rect.top) * canvas.height / rect.height), 1, 1, { colorSpace: 'display-p3' })
    return { space: image.colorSpace, data: [...image.data] }
  }, point)
}

for (const width of full ? [320, 390, 768, 1024, 1280, 1920] : [390, 1440]) {
  for (const locale of full ? ['en', 'tw'] : ['en']) for (const scheme of ['light', 'dark']) {
    test(`${browserName} ${width} ${locale} ${scheme}: the full palette and inspector fit without shifting`, { timeout: 30000 }, async () => {
      const { context, page, errors } = await open({ width, locale, scheme, density: 2 })
      try {
        await table(page)
        const stage = page.locator('.home-palette-stage')
        const height = (await stage.boundingBox()).height
        assert.equal(await stage.getByRole('option').count(), 299)
        assert.equal(await stage.getByRole('button').count(), 0, 'the figure has no functional controls')
        assert.equal(await stage.locator('.home-palette-toolbar,.home-palette-hint,.home-palette-actions').count(), 0)
        await select(page, 'bg-violet-60')
        const value = await stage.locator('[data-token="bg-violet-60"]').getAttribute('data-value')
        assert.equal(await page.locator('.home-palette-value').textContent(), value)
        const layout = await stage.evaluate(element => ({
          overflow: document.documentElement.scrollWidth > innerWidth,
          pixels: element.querySelector('canvas').width * element.querySelector('canvas').height,
          clipped: [...element.querySelectorAll('.home-palette-token,.home-palette-value,.home-palette-gamut')].some(el => {
            const rect = el.getBoundingClientRect()
            return rect.left < 0 || rect.right > innerWidth + 1 || el.scrollWidth > el.clientWidth + 1
          })
        }))
        assert.equal(layout.overflow, false)
        assert.equal(layout.clipped, false)
        assert.ok(layout.pixels <= 2_604_000)
        assert.equal((await stage.boundingBox()).height, height, 'selection reserves its inspector space')
        if (artifacts) await stage.screenshot({ path: `${artifacts}/${browserName}-${width}-${locale}-${scheme}.png` })
        assert.deepEqual(errors, [])
      } finally { await context.close() }
    })
  }
}

test(`${browserName}: hover opens the field, click retains a color, and Escape clears it`, { timeout: 30000 }, async () => {
  const { context, page, errors } = await open()
  try {
    const scene = page.locator('.home-palette-scene')
    const initial = await scene.getAttribute('data-projection')
    const rect = await scene.boundingBox()
    await page.mouse.move(rect.x + rect.width * .5, rect.y + rect.height * .55)
    await page.waitForTimeout(80)
    assert.equal(initial, 'raised')
    await scene.locator('canvas').waitFor()
    await page.locator('.home-palette-scene[data-projection=flat]').waitFor()
    assert.equal(await page.getByRole('button', { name: 'Depth', exact: true }).count(), 0)
    assert.equal(await page.getByRole('button', { name: 'Swatches', exact: true }).count(), 0)
    await table(page)
    await select(page, 'bg-blue-60')
    await page.mouse.move(5, 100)
    assert.equal(await page.locator('.home-palette-token').textContent(), 'bg-blue-60')
    await scene.focus()
    await page.keyboard.press('Escape')
    assert.equal(await scene.getAttribute('aria-activedescendant'), null)
    assert.equal(await scene.evaluate(el => el === document.activeElement), true)
    assert.equal(await page.locator('.home-palette-inspector').isVisible(), false)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: the cached raster retains the source P3 color channels`, { timeout: 30000 }, async () => {
  const { context, page, errors } = await open()
  try {
    await table(page)
    const token = 'bg-violet-60'
    await select(page, token)
    const sample = await page.locator(`[data-token="${token}"]`).evaluate(el => ({ value: el.dataset.value }))
    const original = new Color(sample.value)
    assert.equal(original.inGamut('srgb'), false)
    assert.equal(original.inGamut('p3'), true)
    const point = await pointFor(page, token)
    const wide = await pixel(page, point)
    assert.equal(wide.space, 'display-p3')
    const expected = original.to('p3').coords.map(value => Math.round(value * 255))
    expected.forEach((value, index) => assert.ok(Math.abs(value - wide.data[index]) <= 2, `${index}: ${value} vs ${wide.data[index]}`))
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: keyboard navigation follows the color grid and clears with Escape`, { timeout: 30000 }, async () => {
  const { context, page, errors } = await open()
  try {
    const scene = page.locator('.home-palette-scene')
    await scene.focus()
    await page.keyboard.press('Home')
    await page.keyboard.press('ArrowRight')
    assert.equal(await scene.getAttribute('aria-activedescendant'), 'home-swatch-crimson-100')
    await page.keyboard.press('ArrowDown')
    assert.equal(await scene.getAttribute('aria-activedescendant'), 'home-swatch-crimson-95')
    await page.keyboard.press('PageDown')
    assert.equal(await scene.getAttribute('aria-activedescendant'), 'home-swatch-crimson-70')
    await page.keyboard.press('Control+End')
    assert.equal(await scene.getAttribute('aria-activedescendant'), 'home-swatch-stone-0')
    await page.keyboard.press('Escape')
    assert.equal(await scene.getAttribute('aria-activedescendant'), null)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: exploration reuses the cached field and releases all frames at rest`, { timeout: 30000 }, async () => {
  const { context, page, errors } = await open({ density: 2 })
  try {
    await table(page)
    const base = await page.evaluate(() => window.paletteStats.basePaints)
    for (const token of ['bg-red-60', 'bg-pink-50', 'bg-violet-40', 'bg-blue-60', 'bg-cyan-50', 'bg-lime-60']) {
      const point = await pointFor(page, token)
      await page.mouse.move(point.x, point.y)
      await page.waitForFunction(token => document.querySelector('.home-palette-canvas').dataset.active === token, token)
    }
    assert.equal(await page.evaluate(() => window.paletteStats.basePaints), base, 'hover does not repaint 299 swatches')
    const paints = await page.evaluate(() => window.paletteStats.paints)
    await page.waitForTimeout(250)
    assert.equal(await page.evaluate(() => window.paletteStats.paints), paints)
    await page.evaluate(() => scrollTo(0, 0))
    await page.waitForTimeout(100)
    const offscreen = await page.evaluate(() => window.paletteStats.paints)
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.waitForTimeout(200)
    assert.equal(await page.evaluate(() => window.paletteStats.paints), offscreen)
    const durations = await page.evaluate(() => window.paletteStats.durations)
    console.log(`${browserName} palette callback milliseconds: ${JSON.stringify(durations)}`)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: a touch retains its color after lifting and a cancelled vertical gesture changes none`, { timeout: 30000 }, async () => {
  const { context, page, errors } = await open({ width: 390, touch: true })
  try {
    await table(page)
    await select(page, 'bg-teal-60', true)
    await page.waitForTimeout(150)
    assert.equal(await page.locator('.home-palette-token').textContent(), 'bg-teal-60')
    const scene = page.locator('.home-palette-scene')
    const point = await pointFor(page, 'bg-blue-60')
    const data = { pointerType: 'touch', pointerId: 10, isPrimary: true, button: 0, clientX: point.x, clientY: point.y }
    await scene.dispatchEvent('pointerdown', data)
    await scene.dispatchEvent('pointermove', { ...data, clientY: point.y - 60 })
    await scene.dispatchEvent('pointercancel', data)
    assert.equal(await page.locator('.home-palette-token').textContent(), 'bg-teal-60')
    assert.equal(await scene.evaluate(el => getComputedStyle(el).touchAction), 'pan-y pinch-zoom')
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

for (const js of [true, false]) test(`${browserName}: the native color table survives ${js ? 'unavailable Canvas' : 'disabled JavaScript'}`, { timeout: 30000 }, async () => {
  const { context, page, errors } = await open({ width: 390, canvas: false, js })
  try {
    assert.equal(await page.locator('.home-swatch:visible').count(), 299)
    assert.equal(await page.locator('.home-palette-canvas').isVisible(), false)
    if (js) {
      await page.locator('[data-token="bg-pink-60"]').click()
      assert.equal(await page.locator('.home-palette-token').textContent(), 'bg-pink-60')
    }
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: the theme split keeps precise keyboard values and token shares`, { timeout: 30000 }, async () => {
  const { context, page, errors } = await open()
  try {
    const slider = page.locator('.home-theme-slider')
    await slider.focus()
    await page.keyboard.press('Home')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Shift+ArrowRight')
    assert.equal(await slider.getAttribute('aria-valuenow'), '6')
    assert.equal(await slider.getAttribute('aria-valuetext'), 'Light 6%, Dark 94%')
    const shares = await page.locator('.home-tokens-code .line').evaluateAll(lines => lines.filter(line => line.style.getPropertyValue('--home-token-share')).map(line => line.style.getPropertyValue('--home-token-share')))
    assert.deepEqual(shares, ['0.060', '0.940'])
    await page.keyboard.press('End')
    assert.equal(await slider.getAttribute('aria-valuenow'), '100')
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: the photo dialog protects background focus, shows its natural ratio, and restores its trigger`, { timeout: 30000 }, async () => {
  const { context, page, errors } = await open()
  try {
    const trigger = page.locator('.home-gallery-photo').first()
    await trigger.focus()
    await page.keyboard.press('Enter')
    const dialog = page.locator('.home-gallery-dialog')
    await dialog.waitFor()
    assert.equal(await dialog.evaluate(el => el.matches(':modal')), true)
    await page.locator('.home-heading-link').first().evaluate(el => el.focus())
    assert.equal(await page.locator('.home-heading-link').first().evaluate(el => el === document.activeElement), false, 'background controls are inert')
    const ratio = await page.locator('.home-gallery-view').evaluate(el => {
      const image = el.querySelector('img')
      return { frame: el.clientWidth / el.clientHeight, image: image.naturalWidth / image.naturalHeight }
    })
    assert.ok(Math.abs(ratio.frame - ratio.image) < .01)
    await page.keyboard.press('Escape')
    await dialog.waitFor({ state: 'detached' })
    assert.equal(await trigger.evaluate(el => el === document.activeElement), true)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: large drawing surfaces wait for visibility`, { timeout: 30000 }, async () => {
  const { context, page, errors } = await open({ reveal: false, density: 2 })
  try {
    await page.waitForTimeout(600)
    assert.equal(await page.locator('.home-palette-canvas').evaluate(el => el.width * el.height), 45_000)
    assert.equal(await page.locator('.home-palette-stage').getAttribute('data-renderer'), null)
    await page.locator('.home-palette-stage').scrollIntoViewIfNeeded()
    await page.waitForSelector('.home-palette-stage[data-renderer=canvas]')
    assert.ok(await page.locator('.home-palette-canvas').evaluate(el => el.width * el.height) > 45_000)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: the original hover transition settles, reverses, and respects reduced motion`, { timeout: 30000 }, async () => {
  const { context, page, errors } = await open({ motion: 'no-preference' })
  try {
    const scene = page.locator('.home-palette-scene')
    const rect = await scene.boundingBox()
    await page.mouse.move(rect.x + rect.width / 2, rect.y + 12)
    await page.locator('.home-palette-scene[data-projection=changing]').waitFor()
    await page.locator('.home-palette-scene[data-projection=flat]').waitFor()
    await page.mouse.move(5, 50)
    await page.locator('.home-palette-scene[data-projection=raised]').waitFor()
    const count = await page.evaluate(() => window.paletteStats.paints)
    await page.waitForTimeout(200)
    assert.equal(await page.evaluate(() => window.paletteStats.paints), count)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const before = await page.evaluate(() => window.paletteStats.basePaints)
    await page.mouse.move(rect.x + rect.width / 2, rect.y + 12)
    await page.locator('.home-palette-scene[data-projection=flat]').waitFor()
    assert.ok(await page.evaluate(() => window.paletteStats.basePaints) <= before + 2)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: hidden tabs keep the field still and resume with the current theme`, { timeout: 30000 }, async () => {
  const { context, page, errors } = await open()
  try {
    await table(page)
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    const before = await page.evaluate(() => window.paletteStats.paints)
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.waitForTimeout(200)
    assert.equal(await page.evaluate(() => window.paletteStats.paints), before)
    await page.evaluate(() => {
      delete document.hidden
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await page.waitForFunction(before => window.paletteStats.paints > before, before)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: enlarged text keeps the complete color readout inside the figure`, { timeout: 30000 }, async () => {
  const { context, page, errors } = await open({ width: 390 })
  try {
    await page.evaluate(() => document.documentElement.style.fontSize = '200%')
    await page.locator('.home-palette-stage').scrollIntoViewIfNeeded()
    const scene = page.locator('.home-palette-scene')
    await scene.focus()
    await page.keyboard.press('Home')
    await page.keyboard.press('ArrowRight')
    await page.waitForFunction(() => document.querySelector('.home-palette-canvas').dataset.active === 'bg-crimson-100')
    const layout = await page.locator('.home-palette-stage').evaluate(el => {
      const bounds = el.getBoundingClientRect()
      return [...el.querySelectorAll('.home-palette-token,.home-palette-value,.home-palette-gamut')].map(child => {
        const rect = child.getBoundingClientRect()
        return { text: child.textContent, fits: rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1 && child.scrollWidth <= child.clientWidth + 1 }
      })
    })
    assert.deepEqual(layout.filter(item => !item.fits), [])
    const wordLines = await page.locator('.home-ds-palette .home-bento-card-title a').evaluate(el => {
      const text = el.firstChild
      const start = text.textContent.indexOf('gamut')
      const range = document.createRange()
      range.setStart(text, start)
      range.setEnd(text, start + 5)
      return range.getClientRects().length
    })
    assert.equal(wordLines, 1, 'the enlarged heading keeps complete words')
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: rapid photo open and close requests leave no stale modal or snapshot name`, { timeout: 30000 }, async () => {
  const { context, page, errors } = await open({ motion: 'no-preference' })
  try {
    const trigger = page.locator('.home-gallery-photo').first()
    for (let repeat = 0; repeat < 3; repeat++) {
      await trigger.focus()
      await page.keyboard.press('Enter')
      await page.locator('.home-gallery-dialog[open]').waitFor()
      await page.keyboard.press('Escape')
      await page.locator('.home-gallery-dialog').waitFor({ state: 'detached' })
    }
    await page.waitForTimeout(650)
    assert.equal(await trigger.evaluate(el => el === document.activeElement), true)
    assert.equal(await page.locator('.home-gallery-frame').evaluateAll(els => els.filter(el => el.style.viewTransitionName).length), 0)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: real horizontal touch scrubs the row while vertical touch scrolls the page`, { timeout: 30000, skip: browserName !== 'chromium' }, async () => {
  const { context, page, errors } = await open({ width: 390, height: 844, touch: true })
  try {
    await table(page)
    const session = await context.newCDPSession(page)
    const start = await pointFor(page, 'bg-blue-60'), end = await pointFor(page, 'bg-green-60')
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...start, id: 0 }] })
    for (let step = 1; step <= 6; step++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x + (end.x - start.x) * step / 6, y: start.y, id: 0 }] })
      await page.waitForTimeout(20)
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await page.waitForFunction(() => document.querySelector('.home-palette-canvas').dataset.active === 'bg-green-60')
    const scroll = await page.evaluate(() => scrollY)
    const point = await pointFor(page, 'bg-blue-60')
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...point, id: 0 }] })
    for (let step = 1; step <= 5; step++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: point.x, y: point.y - 18 * step, id: 0 }] })
      await page.waitForTimeout(25)
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await page.waitForTimeout(100)
    assert.ok(await page.evaluate(() => scrollY) > scroll + 10)
    assert.equal(await page.locator('.home-palette-token').textContent(), 'bg-green-60')
    assert.equal(await page.locator('.home-palette-scene').getAttribute('data-scrubbing'), null)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: high contrast preserves the color sample and keyboard focus remains visible`, { timeout: 30000, skip: browserName !== 'chromium' }, async () => {
  const { context, page, errors } = await open()
  try {
    await page.emulateMedia({ forcedColors: 'active' })
    const scene = page.locator('.home-palette-scene')
    await scene.focus()
    await page.keyboard.press('Home')
    assert.equal(await scene.evaluate(el => getComputedStyle(el).outlineStyle), 'solid')
    assert.equal(await page.locator('.home-palette-canvas').evaluate(el => getComputedStyle(el).forcedColorAdjust), 'none')
    assert.equal(await page.locator('.home-palette-current-swatch').evaluate(el => getComputedStyle(el).forcedColorAdjust), 'none')
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})
