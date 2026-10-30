/** Run against the local site: node --test site/tests/agents-session.e2e.mjs.
 * MASTER_AGENTS_BROWSER=webkit checks the same figure in Safari's engine.
 */
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { chromium, webkit } from '@playwright/test'

const browserName = process.env.MASTER_AGENTS_BROWSER ?? 'chromium'
const base = process.env.MASTER_AGENTS_URL ?? 'http://localhost:3000'
let browser
before(async () => { browser = await ({ chromium, webkit })[browserName].launch() })
after(async () => { await browser?.close() })

async function open({ width = 1440, locale = 'en', scheme = 'light', motion = 'reduce', canvas = true, js = true, touch = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: scheme, reducedMotion: motion, javaScriptEnabled: js, hasTouch: touch })
  if (js) await context.addInitScript(({ canvas }) => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (...args) {
      if (!canvas && this.classList.contains('home-mcp-canvas')) return null
      return getContext.apply(this, args)
    }
    const clear = CanvasRenderingContext2D.prototype.clearRect
    window.__agentsPaints = 0
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.classList.contains('home-mcp-canvas')) window.__agentsPaints++
      return clear.apply(this, args)
    }
  }, { canvas })
  const page = await context.newPage()
  // Other homepage work may update Vite during a run; test one consistent document.
  await page.routeWebSocket(socket => socket.hostname === new URL(base).hostname, socket => socket.onMessage(() => undefined))
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const response = await page.goto(`${base}/${locale === 'tw' ? 'tw' : ''}`, { waitUntil: 'domcontentloaded' })
  assert.equal(response.status(), 200)
  await page.locator('.home-mcp').scrollIntoViewIfNeeded()
  if (canvas && js) await page.locator('.home-mcp-stage[data-canvas-ready]').waitFor({ timeout: 12000 })
  return { page, context, errors }
}

for (const width of [320, 390, 550, 552, 768, 1280, 1440]) for (const scheme of ['light', 'dark']) {
  test(`${browserName} ${width} ${scheme}: native marks, useful links and a stable workspace`, async () => {
    const { page, context, errors } = await open({ width, scheme, locale: width === 390 ? 'tw' : 'en' })
    const scene = page.locator('.home-agent-window')
    const height = (await scene.boundingBox()).height
    const links = page.locator('.home-mcp-client-link')
    const field = await page.locator('.home-mcp-stage').boundingBox()
    assert.equal(await links.count(), 8)
    assert.equal(await links.locator('svg').count(), 8)
    const targets = []
    for (const link of await links.all()) {
      const box = await link.boundingBox()
      targets.push(box)
      assert.ok(box.width >= 44 && box.height >= 44, 'setup targets remain at least 44px')
      assert.match(await link.getAttribute('href'), /^\/(tw\/)?guide\/mcp-server#/)
      assert.ok(box.x >= 0 && box.x + box.width <= width, 'client targets stay inside the viewport')
      assert.ok(box.y >= field.y && box.y + box.height <= field.y + field.height, 'the glass field contains every client target')
    }
    for (let index = 0; index < targets.length; index++) for (const next of targets.slice(index + 1)) {
      const a = targets[index]
      assert.ok(a.x + a.width <= next.x || next.x + next.width <= a.x || a.y + a.height <= next.y || next.y + next.height <= a.y, 'client targets remain separate')
    }
    const steps = page.locator('.home-agent-step')
    const panels = ['tokens', 'rule', 'problems', 'preview', 'clean']
    for (let index = 0; index < 5; index++) {
      await steps.nth(index).click()
      assert.equal(await page.locator('.home-agent-panel').getAttribute('data-panel'), panels[index])
      assert.equal(Math.round((await scene.boundingBox()).height), Math.round(height), 'chapters do not move the workspace')
    }
    assert.match(await page.locator('.home-agent-panel-tool').textContent(), /mastercss_lint_project/)
    assert.equal((await page.locator('.home-agent-verdict-count').textContent()).trim(), '0')
    if (width < 936) {
      await page.locator('.home-agent-tab').last().click()
      assert.ok(await page.locator('.home-agent-clean').isVisible())
      assert.equal(Math.round((await scene.boundingBox()).height), Math.round(height))
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    assert.deepEqual(errors, [])
    await context.close()
  })
}

test(`${browserName}: reduced motion sleeps and a keyboard focus identifies the client`, async () => {
  const { page, context } = await open()
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(150)
  const painted = await page.evaluate(() => window.__agentsPaints)
  await page.waitForTimeout(180)
  assert.equal(await page.evaluate(() => window.__agentsPaints), painted, 'the still canvas owns no animation loop')
  assert.equal(await page.locator('.home-agent-play').count(), 0)
  const link = page.locator('.home-mcp-client-link').first()
  await link.focus()
  assert.ok(await link.locator('.home-mcp-client-name').isVisible())
  assert.equal(await link.getAttribute('aria-label'), 'Claude Code')
  await context.close()
})

test(`${browserName}: reduced motion exposes panes and tool results immediately`, async () => {
  const { page, context } = await open({ width: 390 })
  for (const index of [0, 2, 4]) {
    await page.locator('.home-agent-step').nth(index).click()
    await page.locator('.home-agent-tab').last().click()
    const pane = await page.locator('.home-agent-pane[data-active]').evaluate(element => ({ opacity: getComputedStyle(element).opacity, duration: getComputedStyle(element).transitionDuration }))
    assert.deepEqual(pane, { opacity: '1', duration: '0s' }, 'an active pane never waits on a fade with reduced motion')
    await page.locator('.home-agent-tab').first().click()
    const result = await page.locator('.home-agent-call[data-expanded] .home-agent-call-detail').evaluate(element => getComputedStyle(element).opacity)
    assert.equal(result, '1', 'the selected tool result is immediately readable')
  }
  await context.close()
})

for (const width of [320, 390]) for (const canvas of [true, false]) test(`${browserName} ${width} ${canvas ? 'canvas' : 'fallback'}: enlarged text preserves separate glass faces and readable controls`, async () => {
  const { page, context } = await open({ width, canvas, locale: width === 390 ? 'tw' : 'en' })
  await page.addStyleTag({ content: ':root { font-size: 200% !important }' })
  await page.evaluate(() => document.fonts.ready)
  const links = page.locator('.home-mcp-client-link')
  await links.first().focus()
  await page.waitForTimeout(180)
  const boxes = await links.evaluateAll(elements => elements.map(element => {
    const r = element.getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height }
  }))
  for (let index = 0; index < boxes.length; index++) for (const next of boxes.slice(index + 1)) {
    const a = boxes[index]
    assert.ok(a.x + a.w <= next.x || next.x + next.w <= a.x || a.y + a.h <= next.y || next.y + next.h <= a.y, 'client targets do not overlap')
  }
  for (const link of await links.all()) {
    await link.focus()
    const label = await link.locator('.home-mcp-client-name').boundingBox()
    assert.ok(label.x >= 0 && label.x + label.width <= width, 'each client name stays readable without relying on canvas')
  }
  for (const button of await page.locator('.home-agent-step').all()) {
    const bounds = await button.boundingBox()
    const name = await button.locator('.home-agent-step-name').boundingBox()
    assert.ok(name.x >= bounds.x && name.x + name.width <= bounds.x + bounds.width + 1, 'chapter names fit their own controls')
  }
  for (const tab of await page.locator('.home-agent-tab').all()) {
    const bounds = await tab.boundingBox()
    assert.ok(bounds.width >= 44 && bounds.height >= 44, 'every pane stays selectable with enlarged text')
  }
  const filenameFits = await page.locator('.home-agent-tab-label').nth(1).evaluate(element => element.scrollWidth <= element.clientWidth + 1)
  assert.ok(filenameFits, 'the vertical pane picker exposes the complete filename')
  for (let index = 0; index < 5; index++) {
    await page.locator('.home-agent-step').nth(index).click()
    await page.locator('.home-agent-tab').last().click()
    const outputFits = await page.locator('.home-agent-panel-view[data-active]').evaluate(element => {
      const bounds = element.getBoundingClientRect()
      const text = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
      let node
      while (node = text.nextNode()) {
        if (!node.textContent.trim()) continue
        const range = document.createRange()
        range.selectNodeContents(node)
        if ([...range.getClientRects()].some(rect => rect.right > bounds.right + 1)) return false
      }
      return true
    })
    assert.ok(outputFits, 'every manifest value, inspection fact and diagnostic remains readable with enlarged text')
  }
  for (const index of [1, 3, 4]) {
    await page.locator('.home-agent-step').nth(index).click()
    await page.locator('.home-agent-tab').nth(1).click()
    const overflowingClasses = await page.locator('.home-agent-code-view[data-active]').evaluate(element => {
      const bounds = element.getBoundingClientRect()
      return [...element.querySelectorAll('.home-agent-class')].some(token => [...token.getClientRects()].some(rect => rect.right > bounds.right + 1))
    })
    assert.equal(overflowingClasses, false, 'every class fragment stays readable inside the enlarged file')
    if (index === 1) {
      const ruleFits = await page.locator('.home-agent-hover').evaluate(element => {
        const bounds = element.getBoundingClientRect()
        const values = [...element.querySelectorAll('.home-agent-rule span')]
        return values.length > 0 && values.every(value => [...value.getClientRects()].every(rect => rect.right <= bounds.right + 1))
      })
      assert.ok(ruleFits, 'the inspected declaration remains readable with enlarged text')
    }
  }
  await page.locator('.home-agent-tab').last().click()
  const verdict = await page.locator('.home-agent-verdict').boundingBox()
  const count = await page.locator('.home-agent-verdict-count').boundingBox()
  assert.ok(count.x >= verdict.x && count.x + count.width <= verdict.x + verdict.width + 1, 'the zero-problem result stays visible')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  await context.close()
})

test(`${browserName}: canvas loss exposes the native figure and restoration redraws it`, async () => {
  const { page, context } = await open({ width: 390 })
  const canvas = page.locator('.home-mcp-canvas')
  await canvas.evaluate(element => element.dispatchEvent(new Event('contextlost')))
  assert.equal(await page.locator('.home-mcp-stage[data-canvas-ready]').count(), 0)
  assert.ok(await page.locator('.home-mcp-fallback-ring').isVisible())
  assert.equal(await canvas.isVisible(), false)
  await canvas.evaluate(element => element.dispatchEvent(new Event('contextrestored')))
  await page.locator('.home-mcp-stage[data-canvas-ready]').waitFor()
  assert.ok(await canvas.isVisible())
  assert.equal(await page.locator('.home-mcp-client-link').count(), 8)
  await context.close()
})

test(`${browserName}: leaving forced colors restores the glass palette after resizing`, async (t) => {
  const { page, context } = await open({ scheme: 'dark' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(120)
  const before = await page.locator('.home-mcp-canvas').evaluate(canvas => canvas.toDataURL())
  await page.emulateMedia({ forcedColors: 'active' })
  if (!await page.evaluate(() => matchMedia('(forced-colors: active)').matches)) {
    await context.close()
    t.skip('This browser does not emulate forced colors')
    return
  }
  assert.ok(await page.locator('.home-mcp-fallback-ring').isVisible())
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.waitForTimeout(100)
  }
  await page.emulateMedia({ forcedColors: 'none' })
  await page.waitForFunction(before => document.querySelector('.home-mcp-canvas').toDataURL() === before, before)
  assert.ok(await page.locator('.home-mcp-canvas').isVisible())
  await context.close()
})

test(`${browserName}: keyboard playback advances and focus keeps a held chapter still`, async () => {
  const { page, context, errors } = await open({ motion: 'no-preference' })
  await page.locator('.home-agent-window').scrollIntoViewIfNeeded()
  const steps = page.locator('.home-agent-step')
  await steps.first().click()
  const play = page.locator('.home-agent-play')
  await play.focus()
  await page.mouse.move(1, 1)
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => document.querySelector('.home-agent-panel').dataset.panel === 'rule', null, { timeout: 9000 })
  await steps.nth(2).focus()
  const held = await page.locator('.home-agent-panel').getAttribute('data-panel')
  await page.mouse.move(100, 100)
  await page.mouse.move(1, 1)
  await page.waitForTimeout(1300)
  assert.equal(await page.locator('.home-agent-panel').getAttribute('data-panel'), held, 'leaving with the pointer does not release keyboard focus')
  assert.equal(await page.locator('.home-agent-scene').getAttribute('data-paused'), '')
  assert.deepEqual(errors, [])
  await context.close()
})

test(`${browserName}: clicking Play advances while the pointer stays on its control`, async () => {
  const { page, context, errors } = await open({ motion: 'no-preference' })
  await page.locator('.home-agent-window').scrollIntoViewIfNeeded()
  await page.locator('.home-agent-step').first().click()
  await page.locator('.home-agent-play').click()
  await page.waitForFunction(() => !document.querySelector('.home-agent-scene').hasAttribute('data-paused'))
  await page.waitForFunction(() => document.querySelector('.home-agent-panel').dataset.panel === 'rule', null, { timeout: 9000 })
  await page.locator('.home-agent-code').hover()
  assert.equal(await page.locator('.home-agent-scene').getAttribute('data-paused'), '', 'moving into the content still holds the session for reading')
  assert.deepEqual(errors, [])
  await context.close()
})

test(`${browserName}: choosing a pane holds the session for touch reading`, async () => {
  const { page, context, errors } = await open({ width: 390, motion: 'no-preference', touch: true })
  await page.locator('.home-agent-step').nth(1).tap()
  await page.locator('.home-agent-play').tap()
  await page.locator('.home-agent-tab').nth(1).tap()
  assert.equal(await page.locator('.home-agent-play').getAttribute('aria-label'), 'Play the session')
  const panel = await page.locator('.home-agent-panel').getAttribute('data-panel')
  await page.waitForTimeout(1400)
  assert.equal(await page.locator('.home-agent-panel').getAttribute('data-panel'), panel)
  assert.equal(await page.locator('.home-agent-window').getAttribute('data-pane'), 'code')
  assert.deepEqual(errors, [])
  await context.close()
})

test(`${browserName}: a chosen chapter shows its complete conversation without playing`, async () => {
  const { page, context } = await open({ motion: 'no-preference' })
  await page.locator('.home-agent-step').last().click()
  const opacity = await page.locator('.home-agent-message-agent').last().locator('.home-agent-word').evaluateAll(words => words.map(word => getComputedStyle(word).opacity))
  assert.ok(opacity.length > 0 && opacity.every(value => value === '1'), 'a chosen result never waits on a paused text animation')
  await context.close()
})

for (const options of [{ canvas: false }, { js: false }, { js: false, motion: 'no-preference' }]) {
  test(`${browserName}: ${options.js === false ? 'without JavaScript' : 'without canvas'} ${options.motion ?? 'reduce'} the finished figure remains useful`, async () => {
    const { page, context, errors } = await open({ width: 390, ...options })
    assert.equal(await page.locator('.home-mcp-client-link').count(), 8)
    assert.equal(await page.locator('.home-mcp-stage[data-canvas-ready]').count(), 0)
    assert.ok(await page.locator('.home-mcp-fallback-ring').isVisible())
    assert.ok(await page.locator('.home-mcp-core').isVisible())
    assert.equal(await page.locator('.home-agent-verdict-count').textContent(), '0')
    const opacity = await page.locator('.home-agent-message-agent').last().locator('.home-agent-word').evaluateAll(words => words.map(word => getComputedStyle(word).opacity))
    assert.ok(opacity.length > 0 && opacity.every(value => value === '1'), 'the static transcript stays readable with either motion preference')
    assert.deepEqual(errors, [])
    await context.close()
  })
}
