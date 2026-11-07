/** MASTER_HERO_BROWSER=webkit MASTER_HERO_MATRIX=full node --test site/tests/hero-section.e2e.mjs. On macOS, MASTER_HERO_GPU=metal tests native Chromium graphics. */
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { chromium, webkit } from '@playwright/test'

const browserName = process.env.MASTER_HERO_BROWSER ?? 'chromium'
const base = process.env.MASTER_HERO_URL ?? 'http://localhost:3000'
const full = process.env.MASTER_HERO_MATRIX === 'full'
const setupLabels = { en: 'Set up with your AI agent', tw: '用 AI agent 設定' }
const setupPromptStart = 'You are working in an existing web application.'
// The copied prompt names no release, so a pasted prompt stays current.
const isSetupPrompt = text => typeof text === 'string' && text.startsWith(setupPromptStart) && text.includes('npm create @master/css@latest') && !/@master\/[\w-]+@\d/.test(text)
let browser
before(async () => { browser = await ({ chromium, webkit })[browserName].launch({ args: browserName === 'chromium' && process.env.MASTER_HERO_GPU === 'metal' ? ['--use-angle=metal'] : [] }) })
after(async () => { await browser?.close() })

async function open({ width = 1440, height = 900, scheme = 'light', locale = 'en', motion = 'reduce', density = 1, js = true, blocked = false, clipboard = 'success', fonts = true, fault, touch = false, titleProbe = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, colorScheme: scheme, reducedMotion: motion, deviceScaleFactor: density, javaScriptEnabled: js, hasTouch: touch, isMobile: touch })
  const page = await context.newPage()
  await page.routeWebSocket(socket => socket.hostname === new URL(base).hostname, socket => socket.onMessage(() => undefined))
  if (!fonts) await page.route('**/fonts/GeistVariable.woff2', route => route.abort())
  await page.addInitScript(({ blocked, clipboard, fault, titleProbe }) => {
    window.heroMetrics = { frames: 0, draws: 0, uploads: 0, layouts: 0, time: 0, live: {} }
    if (titleProbe) window.heroTitleProbe = { phase: 8, capture: false, pass: 0 }
    const hero = context => context.canvas.classList.contains('home-hero-canvas')
    const get = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (blocked && this.classList.contains('home-hero-canvas') && /webgl/.test(type)) {
        if (blocked === 'throw') throw new Error('WebGL context refused')
        return null
      }
      return get.call(this, type, ...args)
    }
    const bounds = Element.prototype.getBoundingClientRect
    Element.prototype.getBoundingClientRect = function (...args) {
      if (this.matches('.home-hero-canvas, [data-glass-title]')) window.heroMetrics.layouts++
      return bounds.apply(this, args)
    }
    const bound = new WeakMap()
    const names = new WeakMap()
    const prototype = WebGLRenderingContext.prototype
    for (const kind of ['Program', 'Shader', 'Buffer', 'Framebuffer', 'Texture']) {
      const create = prototype[`create${kind}`]
      const drop = prototype[`delete${kind}`]
      prototype[`create${kind}`] = function (...args) {
        const value = create.apply(this, args)
        if (hero(this) && value) window.heroMetrics.live[kind] = (window.heroMetrics.live[kind] ?? 0) + 1
        return value
      }
      prototype[`delete${kind}`] = function (value) {
        if (hero(this) && value) window.heroMetrics.live[kind]--
        return drop.call(this, value)
      }
    }
    const shaderParameter = prototype.getShaderParameter
    prototype.getShaderParameter = function (shader, parameter) {
      return fault === 'shader' && hero(this) && parameter === this.COMPILE_STATUS ? false : shaderParameter.call(this, shader, parameter)
    }
    const framebufferStatus = prototype.checkFramebufferStatus
    prototype.checkFramebufferStatus = function (target) {
      return fault === 'framebuffer' && hero(this) ? this.FRAMEBUFFER_INCOMPLETE_ATTACHMENT : framebufferStatus.call(this, target)
    }
    const bind = prototype.bindFramebuffer
    prototype.bindFramebuffer = function (target, buffer) { bound.set(this, buffer); return bind.call(this, target, buffer) }
    const draw = prototype.drawArrays
    prototype.drawArrays = function (...args) {
      if (hero(this)) {
        window.heroMetrics.draws++
        if (bound.get(this)) window.heroMetrics.frames++
      }
      const result = draw.apply(this, args)
      const probe = window.heroTitleProbe
      if (hero(this) && probe?.capture) {
        if (bound.get(this)) probe.pass = 0
        else if (++probe.pass === 1) probe.before = this.canvas.toDataURL()
        else if (probe.pass === 2) { probe.after = this.canvas.toDataURL(); probe.capture = false }
      }
      return result
    }
    const upload = prototype.texImage2D
    prototype.texImage2D = function (...args) {
      if (hero(this)) {
        window.heroMetrics.uploads++
        if (titleProbe && args.length === 9 && args[8] instanceof Uint8Array && args[3] > 1) window.heroTitleProbe.mask = { width: args[3], height: args[4], pixels: new Uint8Array(args[8]) }
      }
      return upload.apply(this, args)
    }
    const location = prototype.getUniformLocation
    prototype.getUniformLocation = function (program, name) {
      const result = location.call(this, program, name)
      if (result) names.set(result, name)
      return result
    }
    const uniform = prototype.uniform1f
    prototype.uniform1f = function (location, value) {
      if (hero(this) && names.get(location) === 'time') {
        value = window.heroTitleProbe?.phase ?? value
        window.heroMetrics.time = value
      }
      return uniform.call(this, location, value)
    }
    if (titleProbe) {
      const uniform4 = prototype.uniform4f
      prototype.uniform4f = function (location, ...values) {
        if (hero(this) && names.get(location) === 'title') window.heroTitleProbe.bounds = values
        return uniform4.call(this, location, ...values)
      }
    }
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard === 'missing' ? undefined : {
      writeText: async value => {
        if (clipboard === 'failed') throw new Error('Clipboard permission denied')
        window.heroCopied = value
      }
    } })
  }, { blocked, clipboard, fault, titleProbe })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  assert.equal((await page.goto(`${base}/${locale === 'tw' ? 'tw' : ''}`, { waitUntil: 'networkidle' })).status(), 200)
  await page.evaluate(() => document.fonts.ready)
  const section = page.locator('.home-hero')
  if (js && !blocked && fonts && !fault) await page.waitForFunction(() => document.querySelector('.home-hero').hasAttribute('data-glass-ready'))
  return { context, page, section, errors }
}

const metrics = page => page.evaluate(() => ({ ...window.heroMetrics }))
async function settled(page) {
  // Resize and font observers may arrive in separate rendering phases, especially in WebKit.
  const deadline = Date.now() + 4000
  let count = await metrics(page)
  let quietSince = Date.now()
  while (Date.now() < deadline) {
    await page.waitForTimeout(50)
    const next = await metrics(page)
    if (next.frames !== count.frames) quietSince = Date.now()
    count = next
    if (Date.now() - quietSince >= 450) return count
  }
  assert.fail('a reduced-motion scene must release its animation frame after pending invalidations')
}

async function geometry(section) {
  return section.evaluate(element => {
    const body = element.querySelector('.home-hero-body')
    const bodyRect = body.getBoundingClientRect()
    const padding = parseFloat(getComputedStyle(body).paddingInlineStart)
    const left = bodyRect.left + padding
    const right = bodyRect.right - padding
    const paint = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
    const channels = color => {
      paint.clearRect(0, 0, 1, 1)
      paint.fillStyle = color
      paint.fillRect(0, 0, 1, 1)
      return [...paint.getImageData(0, 0, 1, 1).data]
    }
    const actionStyle = getComputedStyle(element.querySelector('.home-action-primary'))
    return {
      overflow: document.documentElement.scrollWidth > innerWidth,
      clipped: [...element.querySelectorAll('h1, p, a, .home-command-label, button, .home-command')].map(child => {
        const box = child.getBoundingClientRect()
        return { tag: child.tagName, className: child.className, left: box.left, right: box.right, scroll: child.scrollWidth, client: child.clientWidth }
      }).filter(child => child.left < left - 1 || child.right > right + 1 || child.scroll > child.client + 1),
      canvasPixels: element.querySelector('canvas').width * element.querySelector('canvas').height,
      action: element.querySelector('.home-action-primary').getBoundingClientRect().toJSON(),
      command: element.querySelector('.home-command').getBoundingClientRect().toJSON(),
      copyHeight: element.querySelector('.home-command-copy').getBoundingClientRect().height,
      actionBackground: channels(actionStyle.backgroundColor),
      actionInk: channels(actionStyle.color)
    }
  })
}

for (const width of full ? [320, 390, 768, 1440, 1920] : [390, 1440]) {
  for (const locale of ['en', 'tw']) for (const scheme of ['light', 'dark']) {
    test(`${browserName} ${width} ${locale} ${scheme}: native content and bounded glass`, async () => {
      const { context, page, section, errors } = await open({ width, locale, scheme })
      try {
        await settled(page)
        const state = await geometry(section)
        assert.equal(state.overflow, false)
        assert.deepEqual(state.clipped, [], 'all content fits the actual inner content edges')
        assert.ok(state.canvasPixels <= 3_000_000)
        assert.ok(state.action.height >= 52)
        assert.ok(state.copyHeight >= 44)
        assert.equal(await section.locator('p').count(), 0, 'the hero has no description paragraph')
        assert.equal(state.actionBackground[3], 255, 'the primary action has a solid fill')
        assert.ok(scheme === 'light' ? state.actionBackground[0] < 80 && state.actionInk[0] > 200 : state.actionBackground[0] > 200 && state.actionInk[0] < 80, 'the primary action reverses the page theme')
        assert.equal(await section.locator('.home-command-label').textContent(), setupLabels[locale])
        assert.equal(await section.locator('.home-action-primary').getAttribute('href'), `${locale === 'tw' ? '/tw' : ''}/guide/introduction`)
        assert.equal(await section.locator('.home-hero-pill').getAttribute('href'), `${locale === 'tw' ? '/tw' : ''}/guide/ai-coding#connect-the-mcp-server`)
        assert.deepEqual(errors, [])
      } finally { await context.close() }
    })
  }
}

for (const scheme of ['light', 'dark']) test(`${browserName} ${scheme}: actions fit a 1280×720 first screen`, async () => {
  const { context, section } = await open({ width: 1280, height: 720, scheme })
  try {
    const state = await geometry(section)
    assert.ok(state.action.bottom <= 720, JSON.stringify(state.action))
    assert.ok(state.command.bottom <= 720, JSON.stringify(state.command))
  } finally { await context.close() }
})

for (const locale of ['en', 'tw']) test(`${browserName} ${locale}: 320px and enlarged text keep every word and action`, async () => {
  const { context, page, section, errors } = await open({ width: 320, locale })
  try {
    assert.deepEqual((await geometry(section)).clipped, [])
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
    await settled(page)
    assert.deepEqual((await geometry(section)).clipped, [])
    assert.equal(await section.locator('.home-command-label').textContent(), setupLabels[locale])
    const readingWidth = await section.locator('.home-command-label').evaluate(element => ({ width: element.getBoundingClientRect().width, font: parseFloat(getComputedStyle(element).fontSize) }))
    assert.ok(readingWidth.width >= readingWidth.font * 4.5, 'enlarged labels retain a usable reading column')
    assert.equal(await section.locator('.home-command-copy').evaluate(element => getComputedStyle(element).gridColumnStart), '2')
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

for (const clipboard of ['success', 'failed', 'missing']) test(`${browserName}: clipboard ${clipboard} reports a stable native state`, async () => {
  const { context, page, section, errors } = await open({ clipboard })
  try {
    const button = section.locator('.home-command-copy')
    const before = await section.locator('.home-command').boundingBox()
    const label = await button.getAttribute('aria-label')
    await button.focus()
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => document.querySelector('.home-hero [aria-live]').textContent !== '')
    assert.equal(await section.locator('[aria-live]').textContent(), clipboard === 'success' ? 'Copied' : 'Copy failed')
    if (clipboard === 'success') {
      assert.ok(isSetupPrompt(await page.evaluate(() => window.heroCopied)))
      assert.notEqual(await button.getAttribute('aria-label'), label)
    }
    assert.deepEqual(await section.locator('.home-command').boundingBox(), before)
    assert.equal(await button.evaluate(element => getComputedStyle(element).outlineWidth), '2px')
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: ambient flow changes pixels without remeasuring or uploading glyphs`, async () => {
  const { context, page, section, errors } = await open({ motion: 'no-preference' })
  try {
    await page.waitForTimeout(2500)
    const before = await metrics(page)
    const image = await section.screenshot()
    await page.waitForTimeout(350)
    const after = await metrics(page)
    assert.ok(after.frames > before.frames)
    assert.equal(after.layouts, before.layouts)
    assert.equal(after.uploads, before.uploads)
    assert.notDeepEqual(await section.screenshot(), image, 'the actual scene changes')
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: pointer and keyboard highlights retain exact control bounds`, async () => {
  const { context, page, section, errors } = await open()
  try {
    await settled(page)
    const action = section.locator('.home-action-primary')
    const before = await action.boundingBox()
    const image = await action.screenshot()
    await action.hover()
    await page.waitForTimeout(100)
    assert.deepEqual(await action.boundingBox(), before)
    assert.notDeepEqual(await action.screenshot(), image)
    await action.focus()
    assert.equal(await action.evaluate(element => getComputedStyle(element).outlineWidth), '2px')
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: offscreen and hidden scenes pause and resume without elapsed-time jumps`, async () => {
  const { context, page, section, errors } = await open({ motion: 'no-preference' })
  try {
    await page.waitForTimeout(250)
    await page.evaluate(() => scrollTo(0, document.querySelector('.home-hero').getBoundingClientRect().height + 100))
    const offscreen = await settled(page)
    await page.waitForTimeout(350)
    assert.equal((await metrics(page)).frames, offscreen.frames)
    await page.evaluate(() => scrollTo(0, 0))
    await page.waitForFunction(count => window.heroMetrics.frames > count, offscreen.frames, { timeout: 2000 })
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    const hidden = await metrics(page)
    await page.waitForTimeout(350)
    assert.equal((await metrics(page)).frames, hidden.frames)
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: false })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await page.waitForFunction(count => window.heroMetrics.frames > count, hidden.frames, { timeout: 2000 })
    const resumed = await metrics(page)
    assert.ok(resumed.frames > hidden.frames)
    assert.ok(resumed.time - hidden.time < 0.3)
    assert.equal(await section.getAttribute('data-glass-ready'), '')
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: reducing motion freezes the current phase and preserves optical interaction`, async () => {
  const { context, page, section } = await open({ motion: 'no-preference' })
  try {
    await page.waitForTimeout(400)
    const before = await metrics(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const reduced = await settled(page)
    assert.ok(reduced.time >= before.time)
    assert.ok(reduced.time - before.time < 0.15)
    await section.locator('.home-command-copy').focus()
    const focused = await settled(page)
    assert.equal(focused.time, reduced.time)
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.waitForTimeout(150)
    assert.ok((await metrics(page)).frames > focused.frames)
  } finally { await context.close() }
})

test(`${browserName}: resizing, theme and font changes update the measured surfaces`, async () => {
  const { context, page, section, errors } = await open({ density: 2 })
  try {
    const before = await settled(page)
    await page.emulateMedia({ colorScheme: 'dark' })
    await settled(page)
    assert.equal((await metrics(page)).uploads, before.uploads, 'a palette change reuses the text mask')
    for (const width of [768, 320, 1920]) {
      await page.setViewportSize({ width, height: 900 })
      await settled(page)
      assert.deepEqual((await geometry(section)).clipped, [])
      assert.ok((await geometry(section)).canvasPixels <= 3_000_000)
    }
    assert.ok((await metrics(page)).uploads > before.uploads)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: very large retina viewports respect the hard output budget`, async () => {
  const { context, section } = await open({ width: 3840, height: 2160, density: 2 })
  try { assert.ok((await geometry(section)).canvasPixels <= 3_000_000) } finally { await context.close() }
})

test(`${browserName}: context loss restores native paint before rebuilding every glass layer`, async t => {
  const { context, page, section, errors } = await open()
  try {
    const supported = await section.locator('canvas').evaluate(canvas => {
      window.heroContextLoss = canvas.getContext('webgl').getExtension('WEBGL_lose_context')
      return !!window.heroContextLoss
    })
    if (!supported) { t.skip('WEBGL_lose_context is unavailable'); return }
    await page.evaluate(() => window.heroContextLoss.loseContext())
    await page.waitForFunction(() => !document.querySelector('.home-hero').hasAttribute('data-glass-ready'))
    assert.equal(await section.locator('canvas').evaluate(canvas => canvas.hidden), true)
    assert.notEqual(await section.locator('h1').evaluate(element => getComputedStyle(element).webkitTextFillColor), 'rgba(0, 0, 0, 0)')
    await page.evaluate(() => window.heroContextLoss.restoreContext())
    await page.waitForFunction(() => document.querySelector('.home-hero').hasAttribute('data-glass-ready'))
    assert.deepEqual((await geometry(section)).clipped, [])
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

for (const options of [{ blocked: true }, { blocked: 'throw' }, { js: false }, { fonts: false }]) test(`${browserName}: ${JSON.stringify(options)} retains readable content and links`, async () => {
  const { context, section, errors } = await open({ width: 390, ...options })
  try {
    assert.equal(await section.getAttribute('data-glass-ready'), null)
    assert.notEqual(await section.locator('h1').evaluate(element => getComputedStyle(element).webkitTextFillColor), 'rgba(0, 0, 0, 0)')
    assert.deepEqual((await geometry(section)).clipped, [])
    assert.equal(await section.locator('.home-action-primary').getAttribute('href'), '/guide/introduction')
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

for (const fault of ['shader', 'framebuffer']) test(`${browserName}: ${fault} failure releases GPU resources and retains native paint`, async () => {
  const { context, page, section, errors } = await open({ fault })
  try {
    await settled(page)
    assert.equal(await section.getAttribute('data-glass-ready'), null)
    assert.equal(await section.locator('canvas').evaluate(element => element.hidden), true)
    assert.ok(Object.values((await metrics(page)).live).every(value => value === 0))
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: native touch copies the setup prompt without leaving a pressed state`, async () => {
  const { context, page, section, errors } = await open({ width: 390, touch: true })
  try {
    const button = await section.locator('.home-command-copy').boundingBox()
    await page.touchscreen.tap(button.x + button.width / 2, button.y + button.height / 2)
    await page.waitForFunction(start => window.heroCopied?.startsWith(start), setupPromptStart)
    assert.ok(isSetupPrompt(await page.evaluate(() => window.heroCopied)))
    const action = section.locator('.home-action-primary')
    const bounds = await action.boundingBox()
    assert.equal(await action.evaluate(element => element.matches(':active')), false)
    assert.deepEqual(await action.boundingBox(), bounds)
    assert.equal(await section.evaluate(element => getComputedStyle(element).touchAction), 'auto')
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: print uses solid text, visible controls and no animation frames`, async () => {
  const { context, page, section } = await open({ motion: 'no-preference' })
  try {
    await page.emulateMedia({ media: 'print' })
    await settled(page)
    assert.equal(await section.locator('canvas').isVisible(), false)
    assert.notEqual(await section.locator('h1').evaluate(element => getComputedStyle(element).webkitTextFillColor), 'rgba(0, 0, 0, 0)')
    assert.equal(await section.locator('.home-command').evaluate(element => getComputedStyle(element).borderTopWidth), '1px')
    await page.emulateMedia({ media: 'screen' })
    await page.waitForFunction(() => document.querySelector('.home-hero').hasAttribute('data-glass-ready'))
  } finally { await context.close() }
})

test(`${browserName}: forced colors falls back and can return to resized glass`, async t => {
  const { context, page, section } = await open()
  try {
    await page.emulateMedia({ forcedColors: 'active' })
    if (!await page.evaluate(() => matchMedia('(forced-colors: active)').matches)) { t.skip('forced colors emulation is unavailable'); return }
    await settled(page)
    assert.equal(await section.locator('canvas').isVisible(), false)
    assert.notEqual(await section.locator('h1').evaluate(element => getComputedStyle(element).webkitTextFillColor), 'rgba(0, 0, 0, 0)')
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ forcedColors: 'none' })
    await page.waitForFunction(() => document.querySelector('.home-hero').hasAttribute('data-glass-ready'))
    assert.deepEqual((await geometry(section)).clipped, [])
  } finally { await context.close() }
})

for (const scheme of ['light', 'dark']) test(`${browserName} ${scheme}: frosted components stay flat and retain contrast over a bright crest`, async () => {
  const { context, page, section } = await open({ scheme })
  try {
    await section.evaluate(element => {
      for (const channel of ['shadow', 'body', 'sheen']) element.style.setProperty(`--hero-gold-${channel}`, 'rgb(250 230 180)')
      dispatchEvent(new Event('resize'))
    })
    await settled(page)
    const screenshot = (await page.screenshot()).toString('base64')
    const samples = await section.evaluate(async (element, screenshot) => {
      const image = new Image()
      image.src = `data:image/png;base64,${screenshot}`
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const pixels = canvas.getContext('2d', { willReadFrequently: true })
      pixels.drawImage(image, 0, 0)
      const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
      const ratio = image.naturalWidth / innerWidth
      const luminance = rgb => rgb.map(value => value / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0)
      return ['.home-hero-pill', '.home-action-primary', '.home-command-copy'].map(selector => {
        const control = element.querySelector(selector)
        const box = control.getBoundingClientRect()
        const x = Math.floor((box.right - 7) * ratio)
        const y = Math.floor((box.y + box.height * 0.5) * ratio)
        const style = getComputedStyle(control)
        const material = getComputedStyle(control.closest('.home-command') ?? control)
        probe.clearRect(0, 0, 1, 1)
        probe.fillStyle = style.color
        probe.fillRect(0, 0, 1, 1)
        const foreground = luminance([...probe.getImageData(0, 0, 1, 1).data].slice(0, 3))
        const background = luminance([...pixels.getImageData(x, y, 1, 1).data].slice(0, 3))
        return { selector, contrast: (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05), shadow: material.boxShadow, backdrop: material.backdropFilter }
      })
    }, screenshot)
    assert.ok(samples.every(item => item.contrast >= 4.5), JSON.stringify(samples))
    assert.ok(samples.every(item => !item.shadow.includes('inset')), 'no nested bevel is drawn inside a component')
    assert.ok(samples.every(item => item.selector === '.home-action-primary' ? item.backdrop === 'none' : item.backdrop.includes('blur(')), 'the main action is solid while secondary components retain their frosted backdrop')
    const action = section.locator('.home-action-primary')
    const bounds = await action.boundingBox()
    const flatPrimary = async () => {
      const state = await geometry(section)
      assert.equal(state.actionBackground[3], 255)
      assert.ok(scheme === 'light' ? state.actionBackground[0] < 80 : state.actionBackground[0] > 200)
      assert.equal(await action.evaluate(element => getComputedStyle(element).boxShadow.includes('inset')), false, 'interaction never reintroduces an inner bevel')
      assert.deepEqual(await action.boundingBox(), bounds)
    }
    await action.hover()
    await flatPrimary()
    await action.evaluate(element => element.addEventListener('click', event => event.preventDefault(), { once: true }))
    await page.mouse.down()
    await flatPrimary()
    await page.mouse.up()
    await action.focus()
    await flatPrimary()
  } finally { await context.close() }
})

for (const width of [390, 1440]) for (const scheme of ['light', 'dark']) test(`${browserName} ${width} ${scheme}: title cores remain readable through changing crests`, async () => {
  const { context, page } = await open({ width, height: width === 390 ? 844 : 900, scheme, locale: width === 390 ? 'tw' : 'en', titleProbe: true })
  try {
    for (const phase of [8, 18, 28, 38, 53, 68, 98, 128]) {
      await page.evaluate(phase => {
        window.heroTitleProbe.phase = phase
        window.heroTitleProbe.capture = true
        dispatchEvent(new Event('resize'))
      }, phase)
      await page.waitForFunction(() => !window.heroTitleProbe.capture)
      const sample = await page.evaluate(async () => {
        const probe = window.heroTitleProbe
        const read = async source => {
          const image = new Image()
          image.src = source
          await image.decode()
          const canvas = document.createElement('canvas')
          canvas.width = image.width
          canvas.height = image.height
          const pixels = canvas.getContext('2d', { willReadFrequently: true })
          pixels.drawImage(image, 0, 0)
          return { data: pixels.getImageData(0, 0, canvas.width, canvas.height).data, width: canvas.width, height: canvas.height }
        }
        // Both captures come from one frame, immediately before and after its title pass.
        const background = await read(probe.before)
        const title = await read(probe.after)
        let minimumAlpha = 255
        for (let index = 3; index < title.data.length; index += 4) minimumAlpha = Math.min(minimumAlpha, title.data[index])
        const rect = document.querySelector('.home-hero-canvas').getBoundingClientRect()
        const [left, top, width, height] = probe.bounds
        const luminance = (data, index) => [0.2126, 0.7152, 0.0722].reduce((sum, weight, channel) => {
          const value = data[index + channel] / 255
          return sum + weight * (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
        }, 0)
        let minimum = Infinity
        let cores = 0
        const mask = probe.mask
        for (let y = 0; y < title.height; y++) for (let x = 0; x < title.width; x++) {
          const mx = Math.floor(((x + 0.5) * rect.width / title.width - left) * mask.width / width)
          const my = Math.floor(((y + 0.5) * rect.height / title.height - top) * mask.height / height)
          if (mx < 1 || my < 1 || mx >= mask.width - 1 || my >= mask.height - 1) continue
          const core = my * mask.width + mx
          if ([core, core - 1, core + 1, core - mask.width, core + mask.width].some(index => mask.pixels[index * 4 + 3] < 250)) continue
          const index = (y * title.width + x) * 4
          const before = luminance(background.data, index)
          const after = luminance(title.data, index)
          minimum = Math.min(minimum, (Math.max(before, after) + 0.05) / (Math.min(before, after) + 0.05))
          cores++
        }
        return { minimum, cores, minimumAlpha }
      })
      assert.ok(sample.cores > 1000, 'the actual glyph mask supplies enough interior samples')
      assert.equal(sample.minimumAlpha, 255, 'title antialiasing preserves the opaque scene beneath it')
      assert.ok(sample.minimum >= 3, JSON.stringify({ phase, ...sample }))
    }
  } finally { await context.close() }
})

test(`${browserName}: the frosted surface visibly blurs a real WebGL backdrop`, async t => {
  const { context, page, section } = await open()
  try {
    await settled(page)
    await section.locator('canvas').evaluate(canvas => {
      const gl = canvas.getContext('webgl')
      const program = gl.createProgram()
      for (const [type, source] of [[gl.VERTEX_SHADER, 'attribute vec2 position; void main(){gl_Position=vec4(position,0.0,1.0);}'], [gl.FRAGMENT_SHADER, 'precision highp float; void main(){float c=mix(0.15,0.85,step(0.5,fract(gl_FragCoord.x/8.0)));gl_FragColor=vec4(vec3(c),1.0);}']]) {
        const shader = gl.createShader(type)
        gl.shaderSource(shader, source)
        gl.compileShader(shader)
        gl.attachShader(program, shader)
      }
      gl.bindAttribLocation(program, 0, 'position')
      gl.linkProgram(program)
      const draw = gl.drawArrays.bind(gl)
      gl.drawArrays = (...args) => {
        if (gl.getParameter(gl.FRAMEBUFFER_BINDING)) {
          const current = gl.getParameter(gl.CURRENT_PROGRAM)
          gl.useProgram(program)
          draw(...args)
          gl.useProgram(current)
        } else draw(...args)
      }
    })
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.waitForTimeout(200)
    const action = section.locator('.home-command')
    const roughness = async locator => {
      const screenshot = (await locator.screenshot()).toString('base64')
      return page.evaluate(async data => {
        const image = new Image()
        image.src = `data:image/png;base64,${data}`
        await image.decode()
        const canvas = document.createElement('canvas')
        canvas.width = image.naturalWidth
        canvas.height = image.naturalHeight
        const pixels = canvas.getContext('2d', { willReadFrequently: true })
        pixels.drawImage(image, 0, 0)
        const values = []
        for (let x = 35; x < canvas.width - 35; x++) values.push(pixels.getImageData(x, 7, 1, 1).data[0])
        return values.slice(1).reduce((sum, value, index) => sum + Math.abs(value - values[index]), 0) / (values.length - 1)
      }, screenshot)
    }
    const blurred = await roughness(action)
    await page.addStyleTag({ content: '.home-hero .home-hero-actions .home-command { backdrop-filter:none !important; }' })
    const clear = await roughness(action)
    if (blurred >= 2 || clear <= blurred + 3) {
      const probe = await context.newPage()
      await probe.setContent('<style>body{margin:0;min-height:200px;background:repeating-linear-gradient(90deg,#262626 0 4px,#d9d9d9 4px 8px)}#glass{position:absolute;left:20px;top:50px;width:200px;height:80px;background:rgba(255,255,255,.7);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}</style><div id="glass"></div>')
      const isolatedBlur = await roughness(probe.locator('#glass'))
      await probe.addStyleTag({ content: '#glass{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}' })
      const isolatedClear = await roughness(probe.locator('#glass'))
      if (isolatedBlur >= isolatedClear * 0.8) {
        t.skip('This browser snapshot environment does not rasterize backdrop blur, also confirmed in an isolated CSS probe')
        return
      }
    }
    assert.ok(blurred < 2, JSON.stringify({ blurred, clear }))
    assert.ok(clear > blurred + 3, JSON.stringify({ blurred, clear }))
  } finally { await context.close() }
})
