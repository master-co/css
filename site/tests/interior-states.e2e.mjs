/** Current-page, focus, theme-swap and no-script states shared by the documentation shell. */
import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { chromium, webkit } from '@playwright/test'

const engine = process.env.MASTER_SITE_BROWSER ?? 'chromium'
const base = process.env.MASTER_SITE_URL ?? 'http://127.0.0.1:3218'
let browser
before(async () => { browser = await ({ chromium, webkit })[engine].launch() })
after(async () => { await browser?.close() })

async function open(route, { width = 1440, scheme = 'light', js = true } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme, javaScriptEnabled: js, hasTouch: width < 768 })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  assert.equal((await page.goto(base + route, { waitUntil: 'networkidle', timeout: 60000 })).status(), 200)
  return { context, page, errors }
}

test(`${engine}: only links to the page being read are marked current`, { timeout: 60000 }, async () => {
  for (const [route, current] of [['/guide/installation', 'Quick Start'], ['/guide/installation/cli', 'CLI']]) {
    const { context, page, errors } = await open(route)
    const marked = await page.locator('a[aria-current="page"]').evaluateAll(links => links.map(link => link.getAttribute('href')))
    assert.ok(marked.length > 0)
    assert.ok(marked.every(href => href === route), `${route}: ${marked}`)
    assert.equal(await page.getByRole('link', { name: current, exact: true }).first().getAttribute('aria-current'), 'page')
    assert.deepEqual(errors, [])
    await context.close()
  }
})

test(`${engine}: switching the theme recolors without starting transitions`, { timeout: 60000 }, async () => {
  for (const route of ['/', '/guide/introduction']) {
    const { context, page, errors } = await open(route)
    // The select is an island: wait until it is hydrated and owns the preference before changing it.
    await page.waitForFunction(() => document.querySelector('select:has(option[value="dark"])')?.value === 'system')
    // Change the theme and count, in the same task, the transitions the swap itself starts. Later frames belong to
    // other scripts (the hero's lamp follows the theme on its own schedule).
    const started = await page.evaluate(() => {
      const select = document.querySelector('select:has(option[value="dark"])')
      const before = new Set(document.getAnimations())
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, 'dark')
      select.dispatchEvent(new Event('change', { bubbles: true }))
      if (!document.documentElement.classList.contains('dark')) return ['theme did not change']
      return document.getAnimations().filter(animation => animation instanceof CSSTransition && !before.has(animation)).map(animation => `${animation.transitionProperty} ${animation.effect.target?.className?.baseVal ?? animation.effect.target?.className}`)
    })
    assert.deepEqual(started, [], route)
    await page.waitForFunction(() => ![...document.head.querySelectorAll('style')].some(style => style.textContent.includes('transition:none!important')))
    assert.deepEqual(errors, [])
    await context.close()
  }
})

test(`${engine}: wide tables become keyboard scroll regions only when they overflow`, { timeout: 60000 }, async () => {
  for (const width of [390, 1440]) {
    const { context, page, errors } = await open('/guide/rendering-modes', { width })
    const tables = await page.locator('.prose .doc-table:not([role])').evaluateAll(tables => tables.map(table => ({ wide: table.scrollWidth > table.clientWidth + 1, focusable: table.tabIndex === 0 })))
    assert.ok(tables.length > 0)
    for (const table of tables) assert.equal(table.focusable, table.wide, `${width}: ${JSON.stringify(table)}`)
    assert.deepEqual(errors, [])
    await context.close()
  }
})

test(`${engine}: focused scrollable code draws its ring above the code`, { timeout: 60000 }, async () => {
  const { context, page, errors } = await open('/guide/introduction')
  await page.locator('.prose p').first().click()
  for (let i = 0; i < 20 && !(await page.evaluate(() => document.activeElement?.matches('.code > .code-wrapper'))); i++) await page.keyboard.press(engine === 'webkit' ? 'Alt+Tab' : 'Tab')
  const ring = await page.evaluate(() => {
    const frame = document.activeElement.parentElement
    const style = getComputedStyle(frame, '::after')
    return { shadow: style.boxShadow, z: style.zIndex, outline: getComputedStyle(document.activeElement).outlineStyle }
  })
  assert.match(ring.shadow, /inset/)
  assert.equal(ring.z, '2')
  assert.equal(ring.outline, 'none')
  assert.deepEqual(errors, [])
  await context.close()
})

test(`${engine}: without scripts, paired artwork follows the system scheme`, { timeout: 60000 }, async () => {
  for (const scheme of ['light', 'dark']) for (const route of ['/', '/guide/introduction']) {
    const { context, page } = await open(route, { scheme, js: false })
    const logos = await page.locator('nav a[href="/"] svg').evaluateAll(svgs => svgs.filter(svg => svg.getBoundingClientRect().width > 40).map(svg => svg.className.baseVal.includes('--site-light') ? 'dark' : 'light'))
    assert.deepEqual(logos, [scheme], `${route} ${scheme}`)
    await context.close()
  }
})

test(`${engine}: a dialog opened by pointer starts without a focus ring; by keyboard on its close control`, { timeout: 60000 }, async () => {
  const { context, page, errors } = await open('/sponsor', { width: 390 })
  const active = () => page.evaluate(() => document.activeElement.className)
  await page.locator('button.sponsor-tier').first().tap()
  await page.locator('.site-modal[open]').waitFor()
  assert.match(await active(), /site-modal-content/)
  assert.equal(await page.locator('.site-modal-content').evaluate(element => getComputedStyle(element).outlineStyle), 'none')
  await page.keyboard.press(engine === 'webkit' ? 'Alt+Tab' : 'Tab')
  assert.match(await active(), /site-modal-close/)
  await page.keyboard.press('Escape')
  await page.locator('.site-modal[open]').waitFor({ state: 'detached' })
  assert.match(await active(), /sponsor-tier/)
  await page.keyboard.press(engine === 'webkit' ? 'Alt+Tab' : 'Tab')
  await page.keyboard.press('Enter')
  await page.locator('.site-modal[open]').waitFor()
  assert.match(await active(), /site-modal-close/)
  assert.equal(await page.evaluate(() => document.activeElement.matches(':focus-visible')), true)
  assert.deepEqual(errors, [])
  await context.close()
})
