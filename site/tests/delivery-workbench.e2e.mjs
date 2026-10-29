/** Run against a local site: node --test site/tests/delivery-workbench.e2e.mjs.
 * MASTER_DELIVERY_BROWSER=webkit and MASTER_DELIVERY_MATRIX=full expand browser/visual coverage.
 */
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { chromium, webkit } from '@playwright/test'
const browserName = process.env.MASTER_DELIVERY_BROWSER ?? 'chromium'
const url = process.env.MASTER_DELIVERY_URL ?? 'http://localhost:3000'
const full = process.env.MASTER_DELIVERY_MATRIX === 'full'
const widths = full ? [390, 768, 1280, 1440] : [390, 1440]
const locales = full ? ['en', 'tw'] : ['en']
let browser
before(async () => { browser = await ({ chromium, webkit })[browserName].launch() })
after(async () => { await browser?.close() })
const errors = []
async function open(options) {
  const context = await browser.newContext({ viewport: { width: options.width, height: 1000 }, colorScheme: options.scheme, reducedMotion: options.motion ?? 'no-preference', javaScriptEnabled: options.js !== false })
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${url}/${options.locale === 'tw' ? 'tw' : ''}`, { waitUntil: 'networkidle' })
  await page.locator('.home-delivery-workbench').scrollIntoViewIfNeeded()
  return { context, page }
}
const modeCopy = {
  static: ['Static rendering', 'Scan classes at build time and ship a plain stylesheet, with no runtime in the browser.'],
  progressive: ['Progressive rendering', 'Render first-load CSS into the page; the runtime starts its engine only for classes outside it.'],
  runtime: ['Runtime rendering', 'Generate rules in the browser as classes appear, from editors, CMS content or playgrounds.']
}
const clock = page => page.locator('.home-delivery-stage').evaluate(stage => Number(stage.style.getPropertyValue('--home-delivery-t')))
const until = (page, t) => page.waitForFunction(t => Number(document.querySelector('.home-delivery-stage').style.getPropertyValue('--home-delivery-t')) >= t, t, { timeout: 18000 })
const select = async (page, mode) => { await page.locator(`label[for=home-delivery-${mode}]`).click(); await page.locator('.home-delivery-workbench').scrollIntoViewIfNeeded() }
const preview = page => page.locator('[data-preview-host]').evaluate(host => {
  const root = host.shadowRoot
  const plan = root.querySelector('[data-preview-sample]')
  const style = root.querySelector('style[data-delivery-rule="bg-amber-10"]')
  return { selected: plan.hasAttribute('data-applied'), late: plan.classList.contains('bg-amber-10'), css: style.textContent, rules: style.sheet?.cssRules.length ?? 0, background: getComputedStyle(plan).backgroundColor, content: [...root.querySelectorAll('[data-preview-mode]')].filter(mode => getComputedStyle(mode).visibility === 'visible').map(mode => ({ mode: mode.dataset.previewMode, title: mode.querySelector('h1').textContent, body: mode.querySelector('.description').textContent, href: mode.querySelector('a').getAttribute('href'), icon: mode.querySelector('[data-home-icon]').dataset.homeIcon })), padding: getComputedStyle(plan).padding, radius: getComputedStyle(plan).borderRadius }
})
async function completeDocument(page, mode) {
  return page.locator(`.home-delivery-template > .home-delivery-code-stack > [data-mode=${mode}]`).evaluate(pane => {
    const source = [...pane.querySelectorAll('.home-delivery-code-row')].filter(row => row.style.display !== 'none').map(row => row.querySelector('.home-delivery-line-content').textContent).join('\n')
    const doc = new DOMParser().parseFromString(source, 'text/html')
    return { doctype: doc.doctype?.name, html: doc.documentElement.lang, head: !!doc.head, body: !!doc.body, link: doc.head.querySelector('link[href="/app.css"]')?.getAttribute('rel'), style: !!doc.head.querySelector('style#master-css'), hydration: doc.head.querySelector('style')?.hasAttribute('data-master-css-hydration-manifest'), script: !!doc.head.querySelector('script[type=module]'), article: !!doc.body.querySelector('article.bg-amber-10') }
  })
}
for (const width of widths) for (const locale of locales) for (const scheme of ['light', 'dark']) {
  test(`${browserName} ${width} ${locale} ${scheme}: complete films and real CSS`, { timeout: 90000 }, async () => {
    const { context, page } = await open({ width, locale, scheme })
    const height = await page.locator('.home-delivery-workbench').evaluate(el => el.getBoundingClientRect().height)
    for (const mode of ['static', 'progressive', 'runtime']) {
      await select(page, mode)
      await until(page, 2.65)
      const initial = await preview(page)
      assert.equal(initial.late, false)
      assert.equal(initial.selected, false)
      assert.equal(!!initial.css, mode === 'static', 'only static pre-generates the known late class')
      await until(page, 4)
      const final = await preview(page)
      assert.equal(final.late, true)
      assert.equal(final.selected, true)
      assert.equal(final.content.length, 1)
      assert.equal(final.content[0].mode, mode)
      assert.equal(final.content[0].icon, `render-${mode}`)
      assert.ok(final.content[0].href.endsWith(`#${mode}-rendering`))
      if (locale === 'en') {
        assert.equal(final.content[0].title, modeCopy[mode][0])
        assert.equal(final.content[0].body, modeCopy[mode][1])
      } else assert.ok(final.content[0].href.startsWith('/tw/'))
      assert.equal(await page.locator('.home-delivery-about').count(), 0)
      assert.equal(final.rules, 1, 'a real CSS layer contains the new rule')
      assert.ok(final.css.includes('.bg-amber-10{background-color:var(--color-amber-10)}'))
      assert.equal(final.padding, '24px')
      assert.equal(final.radius, '12px')
      assert.notEqual(final.background, initial.background)
      assert.equal(await page.locator('.home-delivery-workbench').evaluate(el => el.getBoundingClientRect().height), height, 'the workspace does not move while rules arrive')
      const doc = await completeDocument(page, mode)
      assert.equal(doc.doctype, 'html')
      assert.equal(doc.html, locale === 'tw' ? 'zh-Hant' : 'en')
      assert.ok(doc.head && doc.body && doc.article)
      assert.equal(mode === 'static' ? doc.link : doc.style, mode === 'static' ? 'stylesheet' : true)
      if (mode === 'progressive') assert.ok(doc.hydration)
      if (mode === 'runtime') assert.ok(doc.script)
      await page.locator('[data-add-class]').click()
      await until(page, 3.12)
      assert.equal((await preview(page)).late, true)
      assert.equal((await preview(page)).selected, mode === 'static')
      await until(page, 4)
      assert.equal((await preview(page)).selected, true)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      assert.equal(await page.locator('[data-flight]').count(), 0)
    }
    await context.close()
  })
}
for (const js of [true, false]) {
  test(`${browserName}: reduced motion, split code and ${js ? 'live controls' : 'no JavaScript'}`, { timeout: 30000 }, async () => {
    const { page, context } = await open({ width: 390, locale: 'en', scheme: 'dark', motion: 'reduce', js })
    for (const mode of ['static', 'progressive', 'runtime']) {
      await select(page, mode)
      assert.equal(await clock(page), 4)
      const sample = await preview(page)
      assert.equal(sample.selected, true)
      assert.equal(sample.content[0].mode, mode)
      assert.equal(sample.content[0].title, modeCopy[mode][0])
      assert.equal(await page.locator('.home-delivery-css').isVisible(), true)
      assert.equal(await page.locator('.home-delivery-template').isVisible(), true)
      assert.equal(await page.locator('.home-delivery-play').isVisible(), false)
    }
    if (js) {
      await page.locator('[data-inspect-css]:visible').first().click()
      assert.ok(await page.locator('.home-delivery-template .home-delivery-code-scroll:focus').count())
      assert.equal(await page.locator('.home-delivery-stage').getAttribute('data-inspecting'), '')
    } else assert.equal(await page.locator('.home-delivery-moment:disabled').count(), 4)
    await context.close()
  })
}
test(`${browserName}: pause/resume, seeking and native keyboard controls`, { timeout: 30000 }, async () => {
  const { page, context } = await open({ width: 1440, locale: 'en', scheme: 'light' })
  await select(page, 'runtime')
  await until(page, 2.4)
  await page.locator('.home-delivery-play').click()
  const paused = await clock(page)
  // Web Animations commits a pending pause on the next rendering frame.
  await page.locator('.home-delivery-flights').evaluate(layer => Promise.all(layer.getAnimations({ subtree: true }).map(animation => animation.ready)))
  const flights = await page.locator('.home-delivery-flights').evaluate(layer => layer.getAnimations({ subtree: true }).map(animation => ({ time: animation.currentTime, state: animation.playState })))
  await page.waitForTimeout(300)
  assert.equal(await clock(page), paused)
  assert.deepEqual(await page.locator('.home-delivery-flights').evaluate(layer => layer.getAnimations({ subtree: true }).map(animation => ({ time: animation.currentTime, state: animation.playState }))), flights)
  await page.locator('.home-delivery-play').click()
  await until(page, paused + .1)
  await page.locator('.home-delivery-moment').nth(3).click()
  await page.waitForTimeout(700)
  assert.equal(await clock(page), 4)
  assert.equal(await page.locator('[data-flight]').count(), 0)
  await page.locator('#home-delivery-static').focus()
  await page.keyboard.press('ArrowRight')
  assert.equal(await page.locator('#home-delivery-progressive').isChecked(), true)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForTimeout(80)
  assert.equal(await clock(page), 4)
  assert.equal(await page.locator('.home-delivery-play').isVisible(), false)
  await context.close()
  assert.deepEqual(errors, [])
})

test(`${browserName}: new rules reach the preview after generation`, { timeout: 30000 }, async () => {
  const { page, context } = await open({ width: 1280, locale: 'en', scheme: 'light' })
  for (const [mode, generated, painted] of [['progressive', 3.53, 3.78], ['runtime', 3.43, 3.68]]) {
    await select(page, mode)
    if (mode === 'runtime') {
      await until(page, 2.65)
      await page.locator('[data-preview-change]').click()
    }
    await until(page, generated + .025)
    assert.ok(await page.locator(`.home-delivery-css [data-mode=${mode}] [data-land=bg-amber-10]`).isVisible())
    const pending = await preview(page)
    assert.ok(pending.late)
    assert.equal(pending.selected, false)
    assert.equal(pending.rules, 0, 'the rule exists in the inspector before delivery to the preview')
    await until(page, painted + .02)
    assert.equal((await preview(page)).selected, true)
  }
  await context.close()
})

test(`${browserName}: code focus pauses playback and every flow has a destination`, { timeout: 30000 }, async () => {
  const { page, context } = await open({ width: 390, locale: 'tw', scheme: 'dark' })
  await select(page, 'runtime')
  await until(page, .3)
  await page.locator('.home-delivery-template [data-mode=runtime] .home-delivery-code-scroll').focus()
  const paused = await clock(page)
  await page.waitForTimeout(600)
  assert.equal(await clock(page), paused)
  assert.ok(await page.locator('.home-delivery-template .home-delivery-code-scroll:focus').count())
  assert.equal(await page.locator('[data-flight]').count(), 0)
  for (const width of [320, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.waitForTimeout(80)
    const lengths = await page.locator('.home-delivery-routes').evaluate(svg => [...svg.querySelectorAll('path')].map(path => path.getTotalLength()))
    assert.ok(lengths.every(length => length > 1), `${width}px: ${lengths}`)
  }
  await context.close()
})

test(`${browserName}: automatic tour yields to manual and rapid mode changes`, { timeout: 35000 }, async () => {
  const { page, context } = await open({ width: 1440, locale: 'en', scheme: 'light' })
  await page.waitForFunction(() => document.querySelector('#home-delivery-progressive').checked, null, { timeout: 16000 })
  assert.equal(await page.locator('.home-delivery-stage').getAttribute('data-touring'), '')
  await select(page, 'runtime')
  await until(page, 2.1)
  await select(page, 'static')
  await select(page, 'progressive')
  await page.locator('.home-delivery-moment').nth(3).click()
  await page.waitForTimeout(3300)
  assert.equal(await clock(page), 4)
  assert.ok(await page.locator('#home-delivery-progressive').isChecked())
  assert.equal(await page.locator('.home-delivery-stage').getAttribute('data-touring'), null)
  assert.equal(await page.locator('[data-flight]').count(), 0)
  await context.close()
})


test(`${browserName}: stacked files, an engine between editor and preview, and text-only highlights`, { timeout: 30000 }, async () => {
  const { page, context } = await open({ width: 1440, locale: 'en', scheme: 'dark' })
  for (const width of [320, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.waitForTimeout(80)
    const boxes = await page.locator('.home-delivery-workbench').evaluate(workbench => Object.fromEntries(['template', 'css', 'process', 'browser'].map(name => {
      const rect = workbench.querySelector(`[data-station="${name}"]`).getBoundingClientRect()
      return [name, { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom }]
    })))
    assert.equal(boxes.template.x, boxes.css.x)
    assert.equal(boxes.template.right, boxes.css.right)
    assert.ok(boxes.template.bottom <= boxes.css.y + 1)
    if (width >= 1024) {
      assert.ok(boxes.process.x >= boxes.template.right - 1)
      assert.ok(boxes.process.right <= boxes.browser.x + 1)
    } else {
      assert.ok(boxes.css.bottom <= boxes.process.y + 1)
      assert.ok(boxes.process.bottom <= boxes.browser.y + 1)
    }
    assert.equal(await page.locator('.home-delivery-engine-brand').count(), 0)
  }
  await select(page, 'runtime')
  await until(page, 3.52)
  await page.locator('.home-delivery-play').click()
  const paint = await page.locator('.home-delivery-css [data-mode=runtime] [data-land=bg-amber-10]').evaluate(row => {
    const line = row.querySelector('.home-delivery-line-content')
    const word = row.querySelector('.home-delivery-code-selector')
    return { line: getComputedStyle(line).backgroundColor, word: getComputedStyle(word).backgroundColor, lineWidth: line.getBoundingClientRect().width, wordWidth: word.getBoundingClientRect().width }
  })
  assert.equal(paint.line, 'rgba(0, 0, 0, 0)')
  assert.notEqual(paint.word, paint.line)
  assert.ok(paint.wordWidth < paint.lineWidth / 2)
  const dashes = await page.locator('.home-delivery-routes > path').evaluateAll(paths => paths.map(path => getComputedStyle(path).strokeDasharray))
  assert.ok(dashes.every(dash => dash === 'none'))
  await context.close()
})

test(`${browserName}: a delivered class lands on its preview text without covering the engine label`, { timeout: 45000 }, async () => {
  const { page, context } = await open({ width: 1440, locale: 'en', scheme: 'dark' })
  for (const [width, mode] of [[1024, 'runtime'], [1440, 'progressive']]) {
    await page.setViewportSize({ width, height: 1000 })
    await select(page, mode)
    await page.waitForFunction(() => [...document.querySelectorAll('[data-flight=packet]')].some(chip => chip.textContent === 'bg-amber-10'), null, { timeout: 18000 })
    await page.locator('.home-delivery-play').click()
    const landing = await page.locator('.home-delivery-stage').evaluate(async stage => {
      const layer = stage.querySelector('.home-delivery-flights')
      const chip = [...layer.querySelectorAll('[data-flight=packet]')].find(chip => chip.textContent === 'bg-amber-10')
      const animation = chip.getAnimations()[0]
      await animation.ready
      const frames = animation.effect.getKeyframes()
      const end = new DOMMatrix(frames.at(-1).transform)
      const origin = layer.getBoundingClientRect()
      const target = stage.querySelector('[data-preview-host]').shadowRoot.querySelector('#delivery-preview-class').getBoundingClientRect()
      const labels = [...stage.querySelectorAll('.home-delivery-engine-label, .home-delivery-engine-state')].filter(label => getComputedStyle(label).visibility === 'visible' && getComputedStyle(label.closest('.home-delivery-engine')).opacity === '1').map(label => label.getBoundingClientRect())
      const overlaps = frames.some(frame => {
        const matrix = new DOMMatrix(frame.transform)
        const x = origin.left + matrix.m41, y = origin.top + matrix.m42
        return labels.some(label => x < label.right && x + chip.offsetWidth > label.left && y < label.bottom && y + chip.offsetHeight > label.top)
      })
      return { x: origin.left + end.m41 + chip.offsetWidth / 2, y: origin.top + end.m42 + chip.offsetHeight / 2, targetX: target.left + target.width / 2, targetY: target.top + target.height / 2, overlaps }
    })
    assert.ok(Math.abs(landing.x - landing.targetX) < 1, `${width}px horizontal landing`)
    assert.ok(Math.abs(landing.y - landing.targetY) < 1, `${width}px vertical landing`)
    assert.equal(landing.overlaps, false)
  }
  await context.close()
})

test(`${browserName}: code can scroll, stylesheet references work both ways, and applying keeps focus`, { timeout: 30000 }, async () => {
  const { page, context } = await open({ width: 1440, locale: 'en', scheme: 'dark' })
  await select(page, 'runtime')
  await until(page, 2.65)
  const scroll = page.locator('.home-delivery-template [data-mode=runtime] .home-delivery-code-scroll')
  const bounds = await scroll.evaluate(el => ({ height: el.clientHeight, content: el.scrollHeight }))
  assert.ok(bounds.content > bounds.height + 100)
  await page.locator('[data-preview-change]').focus()
  await page.keyboard.press('Enter')
  await until(page, 3.2)
  const pending = await page.locator('[data-preview-host]').evaluate(host => ({ focused: host.shadowRoot.activeElement === host.shadowRoot.querySelector('[data-preview-change]'), pending: host.shadowRoot.querySelector('[data-preview-sample]').hasAttribute('data-pending') }))
  assert.ok(pending.focused && pending.pending)
  assert.ok(await scroll.evaluate(el => el.scrollTop > 100))
  await until(page, 4)
  assert.ok(await page.locator('[data-preview-host]').evaluate(host => host.shadowRoot.activeElement === host.shadowRoot.querySelector('[data-preview-change]')))
  await page.locator('[data-inspect-css]').first().click()
  assert.ok(await scroll.evaluate(el => el.scrollTop < 100))
  assert.ok(await scroll.evaluate(el => el === document.activeElement))
  await page.locator('.home-delivery-template [data-mode=runtime] [data-reveal-css]').click()
  assert.ok(await page.locator('.home-delivery-css [data-mode=runtime] .home-delivery-code-scroll').evaluate(el => el === document.activeElement))
  await select(page, 'static')
  assert.equal(await page.locator('.home-delivery-stage').getAttribute('data-inspecting'), null)
  await until(page, .3)
  await scroll.evaluate(el => el.scrollTop = 0)
  await page.locator('.home-delivery-template [data-mode=static] .home-delivery-code-scroll').hover()
  await page.mouse.wheel(0, 120)
  await page.waitForTimeout(40)
  const paused = await clock(page)
  await page.waitForTimeout(200)
  assert.equal(await clock(page), paused)
  await context.close()
})

test(`${browserName}: native radio arrow navigation keeps a visible focus indicator`, { timeout: 30000 }, async () => {
  for (const js of [true, false]) {
    const { page, context } = await open({ width: 1440, locale: 'en', scheme: 'light', motion: 'reduce', js })
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      await page.locator('#home-delivery-static').focus()
      const position = await page.evaluate(() => scrollY)
      await page.keyboard.press('ArrowRight')
      assert.ok(await page.locator('#home-delivery-progressive').isChecked())
      const focus = await page.locator('label[for=home-delivery-progressive]').evaluate(label => ({ style: getComputedStyle(label).outlineStyle, width: getComputedStyle(label).outlineWidth, active: document.activeElement === label.querySelector('input') }))
      assert.deepEqual(focus, { style: 'solid', width: '2px', active: true })
      assert.ok(Math.abs(await page.evaluate(() => scrollY) - position) < 2)
    }
    await context.close()
  }
})

for (const js of [true, false]) test(`${browserName}: selecting a mode preserves page position with ${js ? 'JavaScript' : 'no JavaScript'}`, { timeout: 30000 }, async () => {
  const { page, context } = await open({ width: 1440, locale: 'en', scheme: 'light', motion: 'reduce', js })
  await page.setViewportSize({ width: 1440, height: 720 })
  for (const mode of ['progressive', 'runtime', 'static']) {
    await page.locator('.home-delivery-switch').scrollIntoViewIfNeeded()
    const position = await page.evaluate(() => scrollY)
    await page.locator(`label[for=home-delivery-${mode}]`).click()
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - position) < 2)
    assert.ok(await page.locator(`#home-delivery-${mode}`).isChecked())
  }
  await context.close()
})

test(`${browserName}: preview content and engine status fit their surfaces`, { timeout: 30000 }, async () => {
  const { page, context } = await open({ width: 768, locale: 'tw', scheme: 'dark', motion: 'reduce' })
  for (const width of [320, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1100 })
    await select(page, 'progressive')
    await page.waitForTimeout(80)
    const content = await page.locator('[data-preview-host]').evaluate(host => ({ height: host.clientHeight, content: host.scrollHeight, width: host.clientWidth, contentWidth: host.scrollWidth }))
    assert.ok(content.content <= content.height + 2, `${width}px preview: ${JSON.stringify(content)}`)
    assert.ok(content.contentWidth <= content.width)
    const state = await page.locator('.home-delivery-process').evaluate(process => ({ rail: process.getBoundingClientRect().bottom, label: process.querySelector('[data-mode=progressive] .home-delivery-engine-state').getBoundingClientRect().bottom }))
    assert.ok(state.label <= state.rail, `${width}px state label stays inside the rail`)
    if (width >= 1024) {
      const css = await page.locator('.home-delivery-css [data-mode=progressive] .home-delivery-code-scroll').evaluate(el => ({ height: el.clientHeight, content: el.scrollHeight }))
      assert.ok(css.content <= css.height + 2)
    }
  }
  await context.close()
})

test(`${browserName}: phone code scrolls into the page at its boundary`, { timeout: 30000 }, async () => {
  const { page, context } = await open({ width: 390, locale: 'en', scheme: 'light', motion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  const scroll = page.locator('.home-delivery-template [data-mode=static] .home-delivery-code-scroll')
  await scroll.scrollIntoViewIfNeeded()
  await scroll.evaluate(el => { el.scrollTop = el.scrollHeight })
  await scroll.hover()
  const before = await page.evaluate(() => scrollY)
  await page.mouse.wheel(0, 300)
  await page.waitForTimeout(350)
  assert.ok(await page.evaluate(() => scrollY) > before + 20)
  await context.close()
})

test(`${browserName}: pausing leaves complete readable code and references keep their file names`, { timeout: 30000 }, async () => {
  const { page, context } = await open({ width: 1440, locale: 'en', scheme: 'light' })
  await select(page, 'runtime')
  await until(page, 3.08)
  await page.locator('.home-delivery-play').click()
  const code = await page.locator('.home-delivery-template [data-mode=runtime] .home-delivery-template-new').evaluate(el => ({ width: el.getBoundingClientRect().width, word: el.querySelector('[data-glyph]').getBoundingClientRect().width, hidden: el.getAttribute('aria-hidden') }))
  assert.ok(code.width >= code.word)
  assert.equal(code.hidden, 'false')
  const opacities = await page.locator('.home-delivery-css [data-mode=runtime] .home-delivery-code-row:visible .home-delivery-line-content').evaluateAll(lines => lines.map(line => getComputedStyle(line).opacity))
  assert.ok(opacities.every(opacity => opacity === '1'))
  assert.ok(await page.getByRole('button', { name: 'style#master-css', exact: true }).count())
  await page.locator('[data-inspect-css]').first().click()
  assert.ok(await page.getByRole('button', { name: 'Open generated CSS: master-css', exact: true }).count())
  await context.close()
})

test(`${browserName}: paused runtime status is legible and future receipts stay hidden from assistive reading`, { timeout: 30000 }, async () => {
  const { page, context } = await open({ width: 1440, locale: 'en', scheme: 'dark' })
  await select(page, 'progressive')
  await until(page, 3.2)
  await page.locator('.home-delivery-play').click()
  const loading = page.locator('[data-mode=progressive] [data-deferred] .home-delivery-engine-state code').nth(1)
  assert.equal(await loading.evaluate(el => getComputedStyle(el).opacity), '1')
  assert.equal(await page.locator('.home-delivery-css [data-mode=progressive] [data-cue-at]').getAttribute('aria-hidden'), 'true')
  await page.locator('.home-delivery-moment').last().click()
  await page.waitForTimeout(700)
  assert.equal(await page.locator('.home-delivery-css [data-mode=progressive] [data-cue-at]').getAttribute('aria-hidden'), 'false')
  await context.close()
})

const soakMinutes = Number(process.env.MASTER_DELIVERY_SOAK_MINUTES ?? 0)
if (soakMinutes > 0) test(`${browserName}: sustained automatic and interactive playback`, { timeout: soakMinutes * 60000 + 120000 }, async () => {
  const end = Date.now() + soakMinutes * 60000
  let abort = false
  const run = async (automatic) => {
    const { page, context } = await open({ width: automatic ? 1440 : 390, locale: automatic ? 'en' : 'tw', scheme: automatic ? 'light' : 'dark' })
    let baselineNodes
    let baselineShadowNodes
    let cycle = 0
    let reportAt = 0
    const metrics = []
    const session = browserName === 'chromium' ? await context.newCDPSession(page) : null
    const validate = async () => {
      const data = await page.locator('.home-delivery-stage').evaluate(stage => {
        const root = stage.querySelector('[data-preview-host]').shadowRoot
        const sample = root.querySelector('[data-preview-sample]')
        return { nodes: stage.querySelectorAll('*').length, shadowNodes: root.querySelectorAll('*').length, flights: stage.querySelectorAll('[data-flight]').length, hot: stage.querySelectorAll('[data-hot]').length, applied: sample.hasAttribute('data-applied'), rules: [...root.querySelectorAll('style[data-delivery-rule]')].map(style => style.sheet.cssRules[0]?.cssRules?.length ?? 0), mode: document.querySelector('input[name=home-delivery-mode]:checked').value, routes: [...stage.querySelectorAll('[data-route]')].map(path => path.getTotalLength()), visibility: document.visibilityState }
      })
      baselineNodes ??= data.nodes
      baselineShadowNodes ??= data.shadowNodes
      assert.equal(data.nodes, baselineNodes)
      assert.equal(data.shadowNodes, baselineShadowNodes)
      assert.equal(data.rules.length, 4)
      assert.equal(data.flights, 0)
      assert.equal(data.hot, 0)
      assert.equal(data.applied, true)
      assert.deepEqual(errors, [])
      assert.ok(data.rules.every(count => count === 1))
      assert.ok(data.routes.every(length => length > 1))
      return data
    }
    try {
      while (!abort && Date.now() < end) {
        if (!automatic) {
          await select(page, ['static', 'progressive', 'runtime'][cycle % 3])
          if (cycle % 4 === 0) {
            await until(page, 1.6)
            await page.locator('.home-delivery-play').click()
            const paused = await clock(page)
            await page.waitForTimeout(130)
            assert.equal(await clock(page), paused)
            await page.locator('.home-delivery-play').click()
          }
          if (cycle % 5 === 0) {
            await until(page, 2.65)
            await page.locator('[data-preview-change]').click()
          }
          if (cycle % 7 === 0) {
            await page.setViewportSize({ width: [390, 768, 1024][Math.floor(cycle / 7) % 3], height: 1000 })
            await page.locator('.home-delivery-workbench').scrollIntoViewIfNeeded()
          }
        }
        await until(page, 4)
        const result = await validate()
        cycle++
        if (Date.now() >= reportAt) {
          let heap
          if (session) {
            await session.send('HeapProfiler.collectGarbage')
            heap = (await session.send('Runtime.getHeapUsage')).usedSize
          }
          metrics.push({ at: new Date().toISOString(), cycle, heap, ...result })
          console.log(JSON.stringify({ browser: browserName, automatic, cycle, heap, nodes: result.nodes }))
          reportAt = Date.now() + 60000
        }
        if (automatic && Date.now() < end) await page.waitForFunction(mode => document.querySelector('input[name=home-delivery-mode]:checked').value !== mode, result.mode, { timeout: 6000 })
      }
      console.log(JSON.stringify({ browser: browserName, automatic, completed: cycle, checkpoints: metrics }))
    } catch (error) {
      abort = true
      throw error
    } finally {
      await context.close()
    }
  }
  const results = await Promise.allSettled([run(true), run(false)])
  for (const result of results) if (result.status === 'rejected') throw result.reason
})
