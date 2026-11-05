/** Run with a local site: MASTER_CTA_URL=http://localhost:3000 node --test site/tests/cta-section.e2e.mjs. */
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { chromium, webkit } from '@playwright/test'

const browserName = process.env.MASTER_CTA_BROWSER ?? 'chromium'
const url = process.env.MASTER_CTA_URL ?? 'http://localhost:3000'
const full = process.env.MASTER_CTA_MATRIX === 'full'
const expectedVersion = process.env.MASTER_CTA_VERSION ?? '2.0.0'
assert.match(expectedVersion, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/)
const expectedInstallCommand = `npm create @master/css@${expectedVersion}`
let browser
before(async () => { browser = await ({ chromium, webkit })[browserName].launch() })
after(async () => { await browser?.close() })

async function open({ width = 1440, locale = 'en', scheme = 'light', motion = 'no-preference', js = true, density = 1, scroll = true, blockCanvas = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: scheme, reducedMotion: motion, javaScriptEnabled: js, deviceScaleFactor: density })
  const page = await context.newPage()
  // Keep this scene stable while other homepage work triggers development reloads.
  await page.routeWebSocket(socket => socket.hostname === new URL(url).hostname, socket => socket.onMessage(() => undefined))
  await page.addInitScript(blocked => {
    window.ctaPaints = 0
    if (blocked) {
      const get = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (...args) {
        if (this.classList.contains('home-cta-canvas')) return null
        return get.apply(this, args)
      }
    }
    // Every frame of the field starts by clearing its canvas.
    const clear = CanvasRenderingContext2D.prototype.clearRect
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.classList?.contains('home-cta-canvas')) window.ctaPaints++
      return clear.apply(this, args)
    }
  }, blockCanvas)
  const errors = []
  const painterRequests = []
  page.on('request', request => { if (/\/cta-canvas\./.test(request.url())) painterRequests.push(request.url()) })
  page.on('pageerror', error => errors.push(error.message))
  const response = await page.goto(`${url}/${locale === 'tw' ? 'tw' : ''}`, { waitUntil: 'networkidle' })
  assert.equal(response.status(), 200)
  if (scroll) await page.locator('.home-cta').scrollIntoViewIfNeeded()
  await page.evaluate(() => document.fonts.ready)
  return { context, page, errors, painterRequests }
}

const paints = page => page.evaluate(() => window.ctaPaints)
const settle = async page => {
  // The threads open while the lamp lowers into place, about 2.6 seconds in all.
  await page.waitForTimeout(3000)
  const count = await paints(page)
  await page.waitForTimeout(300)
  assert.equal(await paints(page), count, 'the field releases its animation frame at rest')
  return count
}

for (const width of full ? [320, 390, 768, 1024, 1440, 1920] : [390, 1440]) {
  for (const locale of full ? ['en', 'tw'] : ['en']) for (const scheme of ['light', 'dark']) {
    test(`${browserName} ${width} ${locale} ${scheme}: readable invitation and working actions`, { timeout: 30000 }, async () => {
      const { context, page, errors } = await open({ width, locale, scheme })
      try {
        await settle(page)
        const section = page.locator('.home-cta')
        const box = await section.boundingBox()
        const title = section.getByRole('heading', { level: 2 })
        await title.waitFor({ state: 'visible' })
        assert.ok((await title.textContent()).includes(locale === 'tw' ? '一套設計系統' : 'design system.'))
        const link = section.getByRole('link')
        assert.equal(await link.getAttribute('href'), `${locale === 'tw' ? '/tw' : ''}/guide/introduction`)
        const code = section.locator('code')
        assert.equal(await code.textContent(), expectedInstallCommand)
        const geometry = await section.evaluate(element => {
          const elements = [...element.querySelectorAll('h2, a, code, button')]
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            clipped: elements.some(child => {
              const rect = child.getBoundingClientRect()
              return rect.left < 0 || rect.right > innerWidth + 1 || child.scrollWidth > child.clientWidth + 1
            }),
            action: element.querySelector('a').getBoundingClientRect().height,
            pixels: element.querySelector('canvas').width * element.querySelector('canvas').height
          }
        })
        assert.equal(geometry.overflow, false)
        assert.equal(geometry.clipped, false, 'the heading and full command remain readable')
        assert.ok(geometry.action >= 44)
        assert.ok(geometry.pixels <= 2_005_000, 'retina backing stores stay bounded')
        await page.waitForTimeout(250)
        assert.equal((await section.boundingBox()).height, box.height, 'the settled figure never moves the layout')
        assert.deepEqual(errors, [])
      } finally { await context.close() }
    })
  }
}

test(`${browserName}: pointer, tap, offscreen and reduced motion all settle`, { timeout: 30000 }, async () => {
  const { context, page, errors } = await open()
  try {
    const initial = await settle(page)
    const canvas = page.locator('.home-cta-canvas')
    const before = await canvas.evaluate(element => element.toDataURL())
    const field = await page.locator('.home-cta-canvas').boundingBox()
    await page.mouse.move(field.x + field.width * 0.6, field.y + field.height * 0.55)
    await page.waitForTimeout(250)
    assert.ok(await paints(page) > initial, 'pointer movement reaches the field')
    assert.ok(await canvas.evaluate(element => element.toDataURL()) !== before, 'the pointer changes actual pixels')
    // The carried lamp brings its sheen to the threads under it, so they gather more light than when it hangs elsewhere.
    const lightUnder = (x, y) => canvas.evaluate((element, [x, y]) => {
      const scale = element.width / element.getBoundingClientRect().width
      const size = Math.round(120 * scale)
      const { data } = element.getContext('2d').getImageData(Math.round(x * element.width) - size / 2, Math.round(y * element.height) - size / 2, size, size)
      let sum = 0
      for (let index = 3; index < data.length; index += 4) sum += data[index]
      return sum
    }, [x, y])
    await page.mouse.move(field.x + field.width * 0.7, field.y + field.height * 0.5, { steps: 6 })
    await page.waitForTimeout(900)
    const under = await lightUnder(0.7, 0.5)
    await page.mouse.move(field.x + field.width * 0.3, field.y + field.height * 0.5, { steps: 6 })
    await page.waitForTimeout(900)
    assert.ok(under > (await lightUnder(0.7, 0.5)) * 1.15, 'the sheen follows the lamp across the threads')
    await page.mouse.move(field.x + field.width * 0.6, field.y + field.height * 0.55)
    await settle(page)
    await page.mouse.click(field.x + field.width * 0.6, field.y + field.height * 0.55)
    const tap = await paints(page)
    await page.waitForTimeout(250)
    assert.ok(await paints(page) > tap, 'a tap sends a finite wave')
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    const hidden = await paints(page)
    await page.waitForTimeout(300)
    assert.equal(await paints(page), hidden, 'hidden documents stop even during an active wave')
    await page.evaluate(() => {
      delete document.hidden
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(150)
    const offscreen = await paints(page)
    await page.waitForTimeout(300)
    assert.equal(await paints(page), offscreen, 'offscreen effects stop immediately')
    await page.locator('.home-cta').scrollIntoViewIfNeeded()
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await settle(page)
    const reduced = await paints(page)
    await page.mouse.move(field.x + field.width * 0.4, field.y + field.height * 0.6)
    await page.mouse.click(field.x + field.width * 0.4, field.y + field.height * 0.6)
    await page.waitForTimeout(350)
    assert.equal(await paints(page), reduced, 'reduced motion keeps a static, complete field')
    await page.emulateMedia({ forcedColors: 'active' })
    assert.equal(await page.locator('.home-cta-field').isVisible(), false)
    assert.equal(await page.locator('.home-cta').getByRole('link').isVisible(), true)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: no JavaScript still exposes the invitation and localized guide`, { timeout: 30000 }, async () => {
  const { context, page } = await open({ width: 320, locale: 'tw', js: false })
  try {
    const section = page.locator('.home-cta')
    assert.equal(await section.getByRole('heading', { level: 2 }).isVisible(), true)
    assert.equal(await section.getByRole('link').getAttribute('href'), '/tw/guide/introduction')
    assert.equal(await section.locator('code').textContent(), expectedInstallCommand)
    assert.equal(await section.evaluate(el => el.querySelector('code').scrollWidth > el.querySelector('code').clientWidth), false)
  } finally { await context.close() }
})

test(`${browserName}: keyboard focus and clipboard feedback preserve the action widths`, { timeout: 30000 }, async () => {
  const { context, page, errors } = await open({ width: 390, motion: 'reduce' })
  try {
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copiedCommand = text } } })
    })
    const section = page.locator('.home-cta')
    const action = section.getByRole('link')
    await action.focus()
    assert.equal(await action.evaluate(el => getComputedStyle(el).outlineStyle), 'solid')
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
    const copy = section.getByRole('button')
    assert.equal(await copy.evaluate(el => el === document.activeElement), true)
    assert.equal(await copy.evaluate(el => getComputedStyle(el).outlineStyle), 'solid')
    const width = (await section.locator('.home-command').boundingBox()).width
    await page.keyboard.press('Enter')
    await page.waitForFunction(expected => window.copiedCommand === expected, expectedInstallCommand)
    assert.equal(await copy.getAttribute('aria-label'), 'Copied')
    assert.equal((await section.locator('.home-command').boundingBox()).width, width)
    await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('Clipboard unavailable') } })
    await page.waitForTimeout(1850)
    await copy.click()
    await page.waitForFunction(() => document.querySelector('.home-cta [aria-live]').textContent === 'Copy failed')
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: enlarged text wraps the complete command on a phone`, { timeout: 30000 }, async () => {
  const { context, page } = await open({ width: 320, motion: 'reduce' })
  try {
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
    const result = await page.locator('.home-cta').evaluate(section => {
      const code = section.querySelector('code')
      const range = document.createRange()
      range.selectNodeContents(code)
      return {
        text: code.textContent,
        clipped: code.scrollWidth > code.clientWidth,
        outside: [...range.getClientRects()].some(rect => rect.left < 0 || rect.right > innerWidth),
        copyVisible: section.querySelector('button').getBoundingClientRect().right <= innerWidth
      }
    })
    assert.equal(result.text, expectedInstallCommand)
    assert.equal(result.clipped, false)
    assert.equal(result.outside, false)
    assert.equal(result.copyVisible, true)
  } finally { await context.close() }
})

test(`${browserName}: a large retina display keeps the drawing allocation bounded`, { timeout: 30000 }, async () => {
  const { context, page, errors } = await open({ width: 2560, density: 3, motion: 'reduce' })
  try {
    await page.waitForFunction(() => window.ctaPaints > 0)
    const result = await page.locator('.home-cta-canvas').evaluate(canvas => ({
      pixels: canvas.width * canvas.height,
      density: canvas.width / canvas.getBoundingClientRect().width
    }))
    assert.ok(result.pixels <= 2_000_000)
    assert.ok(result.density > 1 && result.density <= 3)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: a 3x phone draws the threads at its own density`, { timeout: 30000 }, async () => {
  const { context, page, errors } = await open({ width: 390, density: 3, motion: 'reduce' })
  try {
    await page.waitForFunction(() => window.ctaPaints > 0)
    const density = await page.locator('.home-cta-canvas').evaluate(canvas => canvas.width / canvas.getBoundingClientRect().width)
    assert.ok(Math.abs(density - 3) < 0.01, 'hairlines are not upscaled from a 2x backing store')
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: the painter loads only near the invitation`, { timeout: 30000 }, async () => {
  const { context, page, errors, painterRequests } = await open({ scroll: false })
  try {
    assert.equal(painterRequests.length, 0, 'the first screen does not download the lower-page painter')
    await page.locator('.home-cta').scrollIntoViewIfNeeded()
    await page.waitForFunction(() => window.ctaPaints > 0)
    assert.equal(painterRequests.length, 1)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: the threads open only once the field is in view, and its lamp lights the title`, { timeout: 30000 }, async () => {
  const { context, page, errors } = await open({ scroll: false })
  try {
    // Bring only the canvas's first rows into view: the painter mounts and lights the invitation, then waits.
    await page.evaluate(() => {
      const canvas = document.querySelector('.home-cta-canvas').getBoundingClientRect()
      scrollBy(0, canvas.top - innerHeight + 40)
    })
    await page.waitForFunction(() => window.ctaPaints > 0)
    await page.waitForTimeout(400)
    const waiting = await paints(page)
    await page.waitForTimeout(400)
    assert.equal(await paints(page), waiting, 'a barely visible field holds its bead without animating')
    assert.equal(await page.locator('.home-cta-canvas').getAttribute('data-ready'), null, 'the CSS starting point still stands in')
    await page.locator('.home-cta-canvas').scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    assert.ok(await paints(page) > waiting + 5, 'the threads open once the field is in view')
    assert.equal(await page.locator('.home-cta-canvas').getAttribute('data-ready'), '')
    await settle(page)
    const title = await page.locator('.home-cta-title-finish').evaluate(element => ['--lit-x', '--cast-y', '--lit-near'].map(name => element.style.getPropertyValue(name)))
    assert.ok(title.every(Boolean), 'the closing lamp writes onto the title')
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: unavailable Canvas preserves the content and working clipboard`, { timeout: 30000 }, async () => {
  const { context, page, errors } = await open({ width: 390, blockCanvas: true })
  try {
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copiedCommand = text } } })
    })
    const section = page.locator('.home-cta')
    assert.equal(await section.getByRole('heading', { level: 2 }).isVisible(), true)
    assert.equal(await section.getByRole('link').getAttribute('href'), '/guide/introduction')
    await section.getByRole('button').click()
    await page.waitForFunction(expected => window.copiedCommand === expected, expectedInstallCommand)
    assert.equal(await paints(page), 0)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: enabling motion preserves an already complete still field`, { timeout: 30000 }, async () => {
  const { context, page, errors } = await open({ motion: 'reduce' })
  try {
    await page.waitForFunction(() => window.ctaPaints > 0)
    const canvas = page.locator('.home-cta-canvas')
    // The ink the field lays down. WebKit may move a canvas it has read back to another rasterizer, so a
    // redrawn identical frame can differ in antialiasing; a field that rewound would lose most of its ink.
    const ink = () => canvas.evaluate(element => {
      const { data } = element.getContext('2d').getImageData(0, 0, element.width, element.height)
      let sum = 0
      for (let index = 3; index < data.length; index += 4) sum += data[index]
      return sum
    })
    const complete = await ink()
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.waitForTimeout(100)
    assert.ok(Math.abs(await ink() - complete) <= complete * 0.005, 'enabling motion never shrinks a completed field')
    await settle(page)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})
