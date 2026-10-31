/** Local browser QA: node --test site/tests/workflow-canvas.e2e.mjs.
 * MASTER_WORKFLOW_MATRIX=full includes both locales and six responsive sizes.
 * MASTER_WORKFLOW_BROWSER=webkit checks Safari's canvas and native controls.
 */
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { chromium, webkit } from '@playwright/test'
const browserName = process.env.MASTER_WORKFLOW_BROWSER ?? 'chromium'
const url = process.env.MASTER_WORKFLOW_URL ?? 'http://localhost:3000'
const full = process.env.MASTER_WORKFLOW_MATRIX === 'full'
const widths = full ? [320, 390, 768, 1024, 1280, 1440] : [390, 1440]
const locales = full ? ['en', 'tw'] : ['en']
let browser
before(async () => { browser = await ({ chromium, webkit })[browserName].launch() })
after(async () => { await browser?.close() })
const figures = ['stage', 'repo', 'routes', 'trace']
async function open({ width = 1440, scheme = 'light', locale = 'en', motion = 'reduce', js = true, canvas = true, touch = false, geometry = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: scheme, reducedMotion: motion, javaScriptEnabled: js, hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 3 : 1 })
  const page = await context.newPage()
  await page.routeWebSocket(socket => socket.hostname === new URL(url).hostname, socket => socket.close())
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  if (geometry) await page.addInitScript(() => {
    window.workflowTracePaths = { wires: [], bodies: [] }
    window.workflowShelfPaths = []
    window.workflowSurfacePaths = []
    const trace = ctx => ctx.canvas.classList.contains('home-wf-canvas') && ctx.canvas.closest('[data-wf="trace"]')
    const surface = ctx => ctx.canvas.classList.contains('home-wf-canvas') && ctx.canvas.closest('[data-wf="stage"]')
    const clear = CanvasRenderingContext2D.prototype.clearRect
    const stroke = CanvasRenderingContext2D.prototype.stroke
    const fill = CanvasRenderingContext2D.prototype.fill
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (trace(this)) { window.workflowTracePaths = { wires: [], bodies: [] }; window.workflowShelfPaths = [] }
      if (surface(this)) window.workflowSurfacePaths = []
      return clear.apply(this, args)
    }
    CanvasRenderingContext2D.prototype.stroke = function (path, ...args) {
      if (trace(this) && path instanceof Path2D && Math.abs(this.lineWidth - .9) < .001) window.workflowTracePaths.wires.push(new Path2D(path))
      if (trace(this) && path instanceof Path2D && Math.abs(this.lineWidth - .7) < .001 && Math.abs(this.globalAlpha - .6) < .001) window.workflowShelfPaths.push(new Path2D(path))
      if (surface(this) && path instanceof Path2D && Math.abs(this.lineWidth - .7) < .001 && [.18, .45].some(alpha => Math.abs(this.globalAlpha - alpha) < .001)) window.workflowSurfacePaths.push(new Path2D(path))
      return path === undefined ? stroke.call(this) : stroke.call(this, path, ...args)
    }
    CanvasRenderingContext2D.prototype.fill = function (path, ...args) {
      if (trace(this) && path instanceof Path2D) window.workflowTracePaths.bodies.push(new Path2D(path))
      return path === undefined ? fill.call(this) : fill.call(this, path, ...args)
    }
  })
  if (!canvas) await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...args) { return this.classList.contains('home-wf-canvas') ? null : original.call(this, type, ...args) }
  })
  await page.goto(`${url}/${locale === 'tw' ? 'tw' : ''}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  return { context, page, errors }
}
async function reveal(page, name) {
  const figure = page.locator(`[data-wf="${name}"]`)
  await figure.scrollIntoViewIfNeeded()
  await figure.locator('[data-renderer="canvas"]').waitFor()
  return figure
}
async function withinFigure(figure) {
  const bounds = await figure.boundingBox()
  const boxes = await figure.locator('[data-wf-anchor]').evaluateAll(elements => elements.map(element => {
    const r = element.getBoundingClientRect()
    return { key: element.dataset.wfAnchor, x: r.x, y: r.y, right: r.right, bottom: r.bottom }
  }))
  for (const box of boxes) {
    assert.ok(box.x >= bounds.x - 1 && box.right <= bounds.x + bounds.width + 1, `${box.key} outside figure horizontally`)
    assert.ok(box.y >= bounds.y - 1 && box.bottom <= bounds.y + bounds.height + 1, `${box.key} outside figure vertically`)
  }
  const targets = await figure.locator('[data-wf-pick]').evaluateAll(elements => elements.map(element => ({ key: element.dataset.wfPick, ...element.getBoundingClientRect().toJSON() })))
  for (let a = 0; a < targets.length; a++) for (let b = a + 1; b < targets.length; b++) {
    const x = Math.min(targets[a].right, targets[b].right) - Math.max(targets[a].left, targets[b].left)
    const y = Math.min(targets[a].bottom, targets[b].bottom) - Math.max(targets[a].top, targets[b].top)
    assert.ok(x <= .5 || y <= .5, `targets ${targets[a].key} and ${targets[b].key} overlap`)
  }
}
for (const width of widths) for (const scheme of ['light', 'dark']) for (const locale of locales) {
  test(`${browserName}: ${width}px ${scheme} ${locale}, drawing and native content`, { timeout: 60000 }, async () => {
    const { context, page, errors } = await open({ width, scheme, locale })
    for (const name of figures) {
      const figure = await reveal(page, name)
      await withinFigure(figure)
      assert.equal(await figure.locator('canvas').evaluate(c => c.getContext('2d').getImageData(0, 0, c.width, c.height).data.some((value, i) => i % 4 === 3 && value > 0)), true)
    }
    const links = page.locator('[data-wf="stage"] a')
    assert.equal(await links.count(), 16)
    for (const link of await links.all()) assert.match(await link.getAttribute('href'), /\/guide\/installation\//)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    assert.deepEqual(errors, [])
    await context.close()
  })
}
for (const width of [320, 390, 576]) for (const scheme of ['light', 'dark']) {
  test(`${browserName}: phone output glass clears the play control at ${width}px ${scheme}`, { timeout: 60000 }, async () => {
    const { context, page, errors } = await open({ width, scheme, motion: 'no-preference', geometry: true })
    const figure = await reveal(page, 'trace')
    const result = await figure.evaluate(figure => {
      const canvas = figure.querySelector('canvas').getBoundingClientRect()
      const control = figure.querySelector('[data-wf-play]').getBoundingClientRect()
      const paths = window.workflowShelfPaths
      if (paths.length !== 4) throw new Error(`Expected four phone shelves, observed ${paths.length}`)
      const probe = document.createElement('canvas').getContext('2d')
      let overlap = 0
      for (let y = Math.max(0, control.top - canvas.top - 2); y < Math.min(canvas.height, control.bottom - canvas.top + 2); y++) {
        for (let x = Math.max(0, control.left - canvas.left - 2); x < Math.min(canvas.width, control.right - canvas.left + 2); x++) {
          if (probe.isPointInPath(paths[3], x, y)) overlap++
        }
      }
      return { overlap, controlWidth: control.width, controlHeight: control.height }
    })
    assert.equal(result.overlap, 0, 'the opaque control must not cover the output glass contour')
    assert.ok(result.controlWidth >= 44 && result.controlHeight >= 44)
    assert.deepEqual(errors, [])
    await context.close()
  })
}
for (const [width, sceneWidth] of [[320], [390], [768], [1024], [1280], [1440], [1440, 480], [1440, 479]]) {
  test(`${browserName}: surface signals clear framework marks at ${width}px${sceneWidth ? `, ${sceneWidth}px scene` : ''}`, { timeout: 60000 }, async () => {
    const { context, page, errors } = await open({ width, scheme: 'dark', geometry: true })
    if (sceneWidth) await page.locator('[data-wf="stage"]').evaluate((figure, width) => {
      const css = getComputedStyle(figure)
      figure.style.width = `${width + parseFloat(css.paddingLeft) + parseFloat(css.paddingRight)}px`
    }, sceneWidth)
    const figure = await reveal(page, 'stage')
    const collisions = await figure.evaluate(figure => {
      const bounds = figure.querySelector('canvas').getBoundingClientRect()
      const paths = window.workflowSurfacePaths
      if (paths.length !== 16) throw new Error(`Expected 16 surface paths, observed ${paths.length}`)
      const probe = document.createElement('canvas').getContext('2d')
      probe.lineWidth = 3.2
      const collisions = []
      for (const [wire, path] of paths.entries()) {
        for (const [brand, logo] of [...figure.querySelectorAll('svg.home-wf-framework-logo')].entries()) {
          const r = logo.getBoundingClientRect()
          let hit = false
          for (let y = r.top - bounds.top; y <= r.bottom - bounds.top && !hit; y++) {
            for (let x = r.left - bounds.left; x <= r.right - bounds.left; x++) {
              if (probe.isPointInStroke(path, x, y)) { hit = true; break }
            }
          }
          if (hit) collisions.push({ wire, brand })
        }
      }
      return collisions
    })
    assert.deepEqual(collisions, [], 'a traveling signal must not appear to pass through another framework mark')
    assert.deepEqual(errors, [])
    await context.close()
  })
}
test(`${browserName}: route choices, project isolation and pinned dependency trace`, { timeout: 60000 }, async () => {
  const { context, page, errors } = await open({ width: 390, scheme: 'dark' })
  const routes = await reveal(page, 'routes')
  for (const [index, selector] of ['.hero', '.plan', '.post'].entries()) {
    await routes.locator(`input[value="${index}"]`).check()
    assert.equal(await routes.locator('[data-sheet]:visible').count(), 1)
    assert.match(await routes.locator('[data-sheet]:visible code').textContent(), new RegExp(selector))
    assert.equal(await routes.getAttribute('data-active'), String(index))
  }
  const repo = await reveal(page, 'repo')
  for (const index of [1, 0]) {
    await repo.locator(`[data-wf-pick="${index}"]`).click()
    assert.equal(await repo.locator('[aria-pressed="true"]').count(), 1)
    assert.equal(await repo.getAttribute('data-active'), String(index))
  }
  const trace = await reveal(page, 'trace')
  const fg = trace.locator('[data-node="2"]')
  await fg.click()
  assert.equal(await fg.getAttribute('aria-pressed'), 'true')
  await trace.locator('[data-node="1"]').hover()
  assert.equal(await trace.getAttribute('data-active'), '2', 'a pinned trace survives another node hover')
  assert.equal(await trace.locator('[data-node="1"]').getAttribute('data-lit'), null, 'unrelated bg-brand remains dim')
  assert.equal(await trace.locator('[data-node="3"]').getAttribute('data-lit'), null, 'Button.tsx does not consume fg-brand')
  await page.mouse.move(0, 0)
  assert.equal(await trace.locator('.home-wf-scene').getAttribute('data-active'), '2')
  await fg.click()
  assert.equal(await fg.getAttribute('aria-pressed'), 'false')
  await page.mouse.click(1, 100)
  assert.equal(await trace.getAttribute('data-active'), '0', 'leaving an unpinned trace restores the complete graph')
  assert.deepEqual(errors, [])
  await context.close()
})

for (const width of [320, 390]) for (const scheme of ['light', 'dark']) {
  test(`${browserName}: narrow dependency paths clear unrelated file bodies at ${width}px ${scheme}`, { timeout: 60000 }, async () => {
    const { context, page, errors } = await open({ width, scheme, geometry: true })
    const figure = await reveal(page, 'trace')
    await figure.locator('[data-node="2"]').click()
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    const collisions = await figure.evaluate(figure => {
      const scene = figure.querySelector('.home-wf-scene').getBoundingClientRect()
      const probe = document.createElement('canvas').getContext('2d')
      // Check the visible signal core as well as the thinner resting wire.
      probe.lineWidth = 3.2
      const { wires, bodies } = window.workflowTracePaths
      if (wires.length !== 9) throw new Error(`Expected 9 dependency paths, observed ${wires.length}`)
      const nodes = [...figure.querySelectorAll('[data-node]')].map(node => {
        const r = node.getBoundingClientRect()
        const x = r.x + r.width / 2 - scene.x, y = r.y + r.height / 2 - scene.y
        return { x, y, width: r.width, height: r.height, masks: bodies.filter(path => probe.isPointInPath(path, x, y)) }
      })
      if (nodes.some(node => !node.masks.length)) throw new Error('A native node has no corresponding painted body')
      const edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5], [3, 6], [4, 6], [5, 6]]
      const found = []
      wires.forEach((path, index) => {
        nodes.forEach((node, target) => {
          if (edges[index].includes(target)) return
          for (let y = node.y - node.height / 2; y <= node.y + node.height / 2; y += 1.5) {
            for (let x = node.x - node.width / 2; x <= node.x + node.width / 2; x += 1.5) {
              if (probe.isPointInStroke(path, x, y) && node.masks.some(body => probe.isPointInPath(body, x, y))) {
                found.push({ edge: edges[index], unrelatedNode: target, x, y })
                return
              }
            }
          }
        })
      })
      return found
    })
    assert.deepEqual(collisions, [], 'a dependency must not appear to pass through an unrelated file')
    assert.deepEqual(errors, [])
    await context.close()
  })
}

test(`${browserName}: enlarged base text uses readable native content and restores the drawing`, { timeout: 60000 }, async () => {
  const { context, page } = await open({ width: 390 })
  await page.evaluate(() => document.fonts.ready)
  const style = await page.addStyleTag({ content: 'html { font-size: 32px !important; }' })
  for (const name of figures) {
    const figure = page.locator(`[data-wf="${name}"]`)
    await figure.scrollIntoViewIfNeeded()
    await figure.locator('[data-wf-native]').waitFor()
    assert.equal(await figure.locator('[data-renderer="canvas"]').count(), 0)
  }
  const routes = page.locator('[data-wf="routes"]')
  await routes.locator('input[value="1"]').check()
  assert.match(await routes.locator('[data-sheet]:visible code').textContent(), /\.plan/)
  await style.evaluate(element => element.remove())
  await reveal(page, 'stage')
  await context.close()
})

test(`${browserName}: context loss keeps native choices and restores the selected drawing`, { timeout: 60000 }, async () => {
  const { context, page, errors } = await open({ width: 390, scheme: 'dark' })
  const routes = await reveal(page, 'routes')
  const canvas = routes.locator('canvas')
  await canvas.evaluate(canvas => canvas.dispatchEvent(new Event('contextlost')))
  assert.equal(await routes.locator('[data-renderer="canvas"]').count(), 0)
  await routes.locator('input[value="2"]').check()
  assert.match(await routes.locator('[data-sheet]:visible code').textContent(), /\.post/)
  await canvas.evaluate(canvas => canvas.dispatchEvent(new Event('contextrestored')))
  await routes.locator('[data-renderer="canvas"]').waitFor()
  assert.equal(await routes.getAttribute('data-active'), '2')
  assert.equal(await routes.locator('input[value="2"]').isChecked(), true)
  await withinFigure(routes)
  assert.deepEqual(errors, [])
  await context.close()
})

test(`${browserName}: a route chosen before the painter loads stays selected`, { timeout: 60000 }, async () => {
  const { context, page } = await open({ width: 390 })
  let unblock
  let requested
  const gate = new Promise(resolve => { unblock = resolve })
  const pending = new Promise(resolve => { requested = resolve })
  await page.route(/workflow-canvas[^/]*\.(?:ts|js)(?:\?|$)/, async route => {
    requested()
    await gate
    await route.continue()
  })
  try {
    const routes = page.locator('[data-wf="routes"]')
    await routes.scrollIntoViewIfNeeded()
    await pending
    await routes.locator('input[value="2"]').check()
    assert.match(await routes.locator('[data-sheet]:visible').textContent(), /\.post/)
    unblock()
    await routes.locator('[data-renderer="canvas"]').waitFor()
    assert.equal(await routes.getAttribute('data-active'), '2')
    assert.equal(await routes.locator('input[value="2"]').isChecked(), true)
    assert.equal(await routes.locator('[data-wf-paused]').count(), 1)
  } finally {
    unblock()
    await context.close()
  }
})

test(`${browserName}: choosing the current route keeps it after focus leaves`, { timeout: 30000 }, async () => {
  const { context, page } = await open({ width: 390, motion: 'no-preference' })
  const routes = await reveal(page, 'routes')
  const current = await routes.getAttribute('data-active')
  await routes.locator(`input[value="${current}"]`).click()
  await page.mouse.click(1, 100)
  await page.mouse.move(0, 0)
  await page.waitForTimeout(6900)
  assert.equal(await routes.getAttribute('data-active'), current)
  await context.close()
})

for (const width of [320, 390, 576]) test(`${browserName}: touch choices and framework navigation at ${width}px, 3x density`, { timeout: 60000 }, async () => {
  const { context, page, errors } = await open({ width, touch: true })
  const routes = await reveal(page, 'routes')
  assert.ok((await routes.locator('input[value="1"]').boundingBox()).height >= 44)
  await routes.locator('input[value="1"]').tap()
  assert.equal(await routes.locator('input[value="1"]').isChecked(), true)
  assert.match(await routes.locator('[data-sheet]:visible').textContent(), /\.plan/)
  const repo = await reveal(page, 'repo')
  await repo.locator('[data-wf-pick="1"]').tap()
  assert.equal(await repo.getAttribute('data-active'), '1')
  const trace = await reveal(page, 'trace')
  await trace.locator('[data-node="2"]').tap()
  assert.equal(await trace.locator('[data-node="2"]').getAttribute('aria-pressed'), 'true')
  const stage = await reveal(page, 'stage')
  for (const link of await stage.locator('a').all()) {
    const box = await link.boundingBox()
    assert.ok(box.width >= 43.99 && box.height >= 43.99, 'every guide keeps its 44px touch target')
  }
  const size = await stage.locator('canvas').evaluate(canvas => ({ pixels: canvas.width * canvas.height, scale: canvas.width / canvas.clientWidth }))
  assert.ok(size.scale <= 2.01 && size.pixels <= 2_005_000)
  await stage.locator('[data-wf-pick="1"]').tap()
  await page.waitForURL('**/guide/installation/vite#react')
  assert.deepEqual(errors, [])
  await context.close()
})

if (browserName === 'chromium') test('chromium: forced colors and print retain native labels', { timeout: 60000 }, async () => {
  const { context, page } = await open()
  await reveal(page, 'trace')
  await page.emulateMedia({ forcedColors: 'active' })
  await page.locator('[data-wf="trace"] [data-renderer="canvas"]').waitFor({ state: 'detached' })
  assert.equal(await page.locator('[data-wf="trace"] [data-node]:visible').count(), 7)
  await page.emulateMedia({ forcedColors: 'none' })
  await reveal(page, 'trace')
  await page.emulateMedia({ media: 'print' })
  assert.equal(await page.locator('[data-wf="trace"] [data-node="0"]').evaluate(node => getComputedStyle(node).position), 'static')
  assert.equal(await page.locator('[data-wf="trace"] [data-node]:visible').count(), 7)
  await context.close()
})
for (const js of [true, false]) {
  test(`${browserName}: ${js ? 'Canvas unavailable' : 'JavaScript disabled'} keeps readable content and route radios`, { timeout: 60000 }, async () => {
    const { context, page, errors } = await open({ width: 390, js, canvas: false })
    for (const name of figures) {
      const figure = page.locator(`[data-wf="${name}"]`)
      await figure.scrollIntoViewIfNeeded()
      assert.equal(await figure.locator('[data-renderer="canvas"]').count(), 0)
      assert.ok((await figure.textContent()).trim().length > 0)
    }
    assert.equal(await page.locator('[data-wf="stage"] a:visible').count(), 16)
    const routes = page.locator('[data-wf="routes"]')
    await routes.locator('input[value="2"]').check()
    assert.match(await routes.locator('[data-sheet]:visible').textContent(), /\.post/)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    assert.deepEqual(errors, [])
    await context.close()
  })
}
test(`${browserName}: keyboard focus follows the selected framework and dependency`, { timeout: 60000 }, async () => {
  const { context, page } = await open()
  const stage = await reveal(page, 'stage')
  await stage.locator('[data-wf-pick="11"]').focus()
  assert.equal(await stage.getAttribute('data-active'), '11')
  assert.equal(await stage.locator('[data-wf-anchor="integration-2"]').getAttribute('data-lit'), '')
  const trace = await reveal(page, 'trace')
  await trace.locator('[data-node="4"]').focus()
  await page.keyboard.press('Enter')
  assert.equal(await trace.locator('[data-node="4"]').getAttribute('aria-pressed'), 'true')
  assert.equal(await trace.locator('[data-node="3"]').getAttribute('data-lit'), null)
  await context.close()
})

test(`${browserName}: keyboard order follows the drawing before its pause control`, { timeout: 60000 }, async () => {
  const { context, page } = await open({ motion: 'no-preference' })
  const stage = await reveal(page, 'stage')
  await stage.locator('xpath=..').locator('h3 a').focus()
  // Safari uses Option-Tab to include links when the browser's full keyboard access is disabled.
  const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab'
  await page.keyboard.press(tab)
  assert.equal(await stage.locator('[data-wf-pick="0"]').evaluate(node => node === document.activeElement), true)
  await stage.locator('[data-wf-pick="15"]').focus()
  await page.keyboard.press(tab)
  assert.equal(await stage.locator('[data-wf-play]').evaluate(node => node === document.activeElement), true)
  await context.close()
})

test(`${browserName}: narrow route code can be read with the keyboard`, { timeout: 60000 }, async () => {
  const { context, page } = await open({ width: 320 })
  const routes = await reveal(page, 'routes')
  const code = routes.locator('[data-sheet]:visible [role="region"]')
  await code.focus()
  assert.equal(await code.evaluate(element => element.scrollWidth > element.clientWidth), true)
  await page.keyboard.press('ArrowRight')
  await page.waitForFunction(() => document.querySelector('[data-wf="routes"] [data-sheet]:not([hidden]) .home-wf-routes-code').scrollLeft > 0)
  assert.ok(await code.evaluate(element => element.scrollLeft > 0))
  await context.close()
})
test(`${browserName}: native route arrows retain a visible keyboard cue`, { timeout: 60000 }, async () => {
  const { context, page, errors } = await open({ width: 390 })
  const routes = await reveal(page, 'routes')
  await routes.locator('input[value="0"]').focus()
  await page.keyboard.press('ArrowRight')
  const pricing = routes.locator('input[value="1"]')
  assert.equal(await pricing.isChecked(), true)
  assert.equal(await pricing.evaluate(node => node === document.activeElement), true)
  assert.equal(await pricing.evaluate(node => getComputedStyle(node.parentElement).outlineStyle), 'solid')
  assert.match(await routes.locator('[data-sheet]:visible code').textContent(), /\.plan/)
  await routes.locator('input[value="2"]').click()
  assert.equal(await routes.evaluate(node => node.hasAttribute('data-wf-keyboard')), false, 'pointer use clears the keyboard-only cue')
  assert.deepEqual(errors, [])
  await context.close()
})
test(`${browserName}: scenes enter already drawn instead of swapping from the native layout`, { timeout: 60000 }, async () => {
  const { context, page, errors } = await open({ scheme: 'dark', motion: 'no-preference' })
  for (const name of figures) {
    const figure = page.locator(`[data-wf="${name}"]`)
    // Only the top edge is in view: below the drawing's 10% visibility threshold, inside its load margin.
    await figure.evaluate(node => scrollTo(0, node.getBoundingClientRect().top + scrollY - innerHeight + 24))
    const drawn = await figure.locator('canvas').evaluate(canvas => new Promise(resolve => {
      const until = performance.now() + 3000
      const check = () => canvas.closest('[data-renderer="canvas"]') || performance.now() > until ? resolve(!!canvas.closest('[data-renderer="canvas"]')) : requestAnimationFrame(check)
      check()
    }))
    assert.equal(drawn, true, `${name} switches to its drawing before it is visible`)
    assert.equal(await figure.locator('canvas').evaluate(c => c.getContext('2d').getImageData(0, 0, c.width, c.height).data.some((value, i) => i % 4 === 3 && value > 0)), true, `${name} is painted while it enters`)
  }
  assert.deepEqual(errors, [])
  await context.close()
})
