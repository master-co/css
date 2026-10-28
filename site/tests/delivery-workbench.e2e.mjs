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
const clock = page => page.locator('.home-delivery-stage').evaluate(stage => Number(stage.style.getPropertyValue('--home-delivery-t')))
const until = (page, t) => page.waitForFunction(t => Number(document.querySelector('.home-delivery-stage').style.getPropertyValue('--home-delivery-t')) >= t, t, { timeout: 18000 })
const select = async (page, mode) => { await page.locator(`label[for=home-delivery-${mode}]`).click(); await page.locator('.home-delivery-workbench').scrollIntoViewIfNeeded() }
const preview = page => page.locator('[data-preview-host]').evaluate(host => {
  const root = host.shadowRoot
  const plan = root.querySelector('[data-preview-plan]')
  const style = root.querySelector('style[data-delivery-rule="bg-amber-10"]')
  return { selected: plan.hasAttribute('data-selected'), late: plan.classList.contains('bg-amber-10'), css: style.textContent, rules: style.sheet?.cssRules.length ?? 0, background: getComputedStyle(plan).backgroundColor, padding: getComputedStyle(plan).padding, radius: getComputedStyle(plan).borderRadius }
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
      assert.equal(final.rules, 1, 'a real CSS layer contains the new rule')
      assert.ok(final.css.includes('.bg-amber-10{background-color:var(--color-amber-10)}'))
      assert.equal(final.padding, '24px')
      assert.equal(final.radius, '12px')
      assert.notEqual(final.background, initial.background)
      assert.equal(await page.locator('.home-delivery-workbench').evaluate(el => el.getBoundingClientRect().height), height, 'the workspace does not move while rules arrive')
      const doc = await completeDocument(page, mode)
      assert.equal(doc.doctype, 'html')
      assert.equal(doc.html, 'en')
      assert.ok(doc.head && doc.body && doc.article)
      assert.equal(mode === 'static' ? doc.link : doc.style, mode === 'static' ? 'stylesheet' : true)
      if (mode === 'progressive') assert.ok(doc.hydration)
      if (mode === 'runtime') assert.ok(doc.script)
      if (width < 872) await page.locator('label[for=home-delivery-view-template]').click()
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
  test(`${browserName}: reduced motion, code tabs and ${js ? 'live controls' : 'no JavaScript'}`, { timeout: 30000 }, async () => {
    const { page, context } = await open({ width: 390, locale: 'en', scheme: 'dark', motion: 'reduce', js })
    for (const mode of ['static', 'progressive', 'runtime']) {
      await select(page, mode)
      assert.equal(await clock(page), 4)
      assert.equal((await preview(page)).selected, true)
      await page.locator('label[for=home-delivery-view-css]').click()
      assert.equal(await page.locator('.home-delivery-css').isVisible(), true)
      await page.locator('label[for=home-delivery-view-template]').click()
      assert.equal(await page.locator('.home-delivery-template').isVisible(), true)
      assert.equal(await page.locator('.home-delivery-play').isVisible(), false)
    }
    if (js) {
      await page.locator('label[for=home-delivery-view-css]').click()
      await page.locator('[data-inspect-css]:visible').click()
      assert.equal(await page.locator('#home-delivery-view-template').isChecked(), true)
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
      await page.locator('[data-preview-select]').click()
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

test(`${browserName}: code focus holds the phone view and every flow has a destination`, { timeout: 30000 }, async () => {
  const { page, context } = await open({ width: 390, locale: 'tw', scheme: 'dark' })
  await select(page, 'runtime')
  await until(page, .3)
  await page.locator('.home-delivery-template [data-mode=runtime] .home-delivery-code-scroll').focus()
  const paused = await clock(page)
  await page.waitForTimeout(600)
  assert.equal(await clock(page), paused)
  assert.ok(await page.locator('#home-delivery-view-template').isChecked())
  assert.equal(await page.locator('[data-flight]').count(), 0)
  for (const width of [390, 768, 1024, 1280, 1440]) {
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
