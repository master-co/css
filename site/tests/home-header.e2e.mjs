/** Run against a local site: node --test site/tests/home-header.e2e.mjs. */
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { chromium, webkit } from '@playwright/test'

const browserName = process.env.MASTER_HEADER_BROWSER ?? 'chromium'
const url = process.env.MASTER_HEADER_URL ?? 'http://localhost:3000'
let browser
before(async () => { browser = await ({ chromium, webkit })[browserName].launch() })
after(async () => { await browser?.close() })

async function open({ width = 1440, scheme = 'light', locale = '', motion = 'no-preference', api = true, js = true, path = locale } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme, reducedMotion: motion, javaScriptEnabled: js })
  const page = await context.newPage()
  await page.routeWebSocket(socket => socket.hostname === new URL(url).hostname, socket => socket.onMessage(() => undefined))
  await page.addInitScript(enabled => {
    window.headerTransitions = []
    // Canvases redraw when the root's class changes, so header transitions must not touch it.
    window.rootClassChanges = 0
    document.addEventListener('DOMContentLoaded', () => {
      new MutationObserver(records => { window.rootClassChanges += records.length }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    })
    const start = document.startViewTransition?.bind(document)
    if (!enabled || !start) {
      document.startViewTransition = undefined
      return
    }
    document.startViewTransition = (...args) => {
      const transition = start(...args)
      const record = { ready: false }
      window.headerTransitions.push(record)
      transition.ready.then(() => {
        record.ready = true
        record.kind = document.documentElement.dataset.headerTransition
        record.rootName = getComputedStyle(document.documentElement).viewTransitionName
        record.groups = document.getAnimations().map(animation => animation.effect?.pseudoElement).filter(Boolean)
      }, () => {})
      return transition
    }
  }, api)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  assert.equal((await page.goto(`${url}/${path}`, { waitUntil: 'networkidle' })).status(), 200)
  return { context, page, header: page.locator('header.ui-header'), errors }
}

async function scroll(page, y) {
  await page.evaluate(y => scrollTo(0, y), y)
  await page.waitForFunction(y => (document.querySelector('.home-header').dataset.background === 'transparent') === (y <= 10), y)
  await page.waitForFunction(() => !('headerTransition' in document.documentElement.dataset))
}

for (const width of [390, 1440]) for (const scheme of ['light', 'dark']) {
  test(`${browserName} ${width} ${scheme}: compact top and complete scrolled navigation`, async () => {
    const { context, page, header, errors } = await open({ width, scheme, locale: scheme === 'dark' ? 'tw' : '' })
    try {
      const github = header.getByRole('link', { name: 'GitHub', exact: true })
      assert.equal(await github.isVisible(), true)
      assert.equal(await github.getAttribute('href'), 'https://github.com/master-co/css')
      assert.equal(await header.locator('.ui-header-nav > a:visible').count(), 0)
      assert.equal(await header.locator('.ui-header-end > a.btn:visible').count(), 1)
      assert.equal(await header.locator('.ui-header-end > label:has(> select)').isVisible(), false)
      assert.equal(await header.locator('.ui-header-search').isVisible(), false)
      const initialGithub = await github.boundingBox()
      const logo = await header.locator('a[href="/"], a[href="/tw"]').boundingBox()
      if (width < 1024) assert.ok(Math.abs(logo.x + logo.width / 2 - width / 2) < 1, 'the mobile logo stays centered between the menu and GitHub')
      await github.focus()
      await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
      assert.equal(await header.locator('.ui-header-nav > a, .ui-header-end > :not([aria-label="GitHub"])').evaluateAll(elements => elements.some(element => element.contains(document.activeElement))), false)

      await scroll(page, 80)
      assert.equal(await header.locator('.ui-header-nav > a:visible').count(), width >= 1024 ? 3 : 0)
      assert.equal(await header.locator('.ui-header-end > a.btn:visible').count(), width >= 1024 ? 4 : 0)
      assert.equal(await header.locator('.ui-header-end > label:has(> select)').isVisible(), width >= 1024)
      assert.equal(await header.locator('.ui-header-search').isVisible(), width < 1024)
      if (width >= 1024) assert.ok((await github.boundingBox()).x < initialGithub.x - 100, 'GitHub moves beside the restored community links')
      const transitions = await page.evaluate(() => window.headerTransitions)
      assert.equal(transitions.length, 1)
      assert.equal(transitions[0].ready, true, 'native snapshots are accepted')
      assert.equal(transitions[0].rootName, 'none', 'the scrolling page is excluded from snapshots')
      assert.ok(transitions[0].groups.some(group => group.includes('home-header')))

      await scroll(page, 0)
      assert.deepEqual(await github.boundingBox(), initialGithub, 'GitHub returns to the exact original position')
      assert.deepEqual(await header.locator('a[href="/"], a[href="/tw"]').boundingBox(), logo, 'the logo remains aligned')
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      assert.deepEqual(errors, [])
    } finally { await context.close() }
  })
}

test(`${browserName}: interrupted transitions and scroll direction finish in the requested state`, async () => {
  const { context, page, header, errors } = await open()
  try {
    for (const y of [80, 0, 80, 0]) {
      await page.evaluate(y => scrollTo(0, y), y)
      await page.waitForTimeout(65)
    }
    await scroll(page, 0)
    assert.equal(await header.locator('.ui-header-nav > a:visible').count(), 0)
    const classChanges = await page.evaluate(() => window.rootClassChanges)
    await scroll(page, 500)
    await page.waitForFunction(() => document.querySelector('.home-header').hasAttribute('data-tucked'))
    await scroll(page, 300)
    await page.waitForFunction(() => !document.querySelector('.home-header').hasAttribute('data-tucked'))
    await scroll(page, 0)
    assert.equal(await header.getByRole('link', { name: 'GitHub', exact: true }).isVisible(), true)
    const kinds = await page.evaluate(() => window.headerTransitions.filter(transition => transition.ready).map(transition => transition.kind))
    assert.ok(kinds.includes('tuck'), 'tucking away and coming back run as view transitions too')
    assert.equal(await page.evaluate(() => window.rootClassChanges), classChanges, 'header transitions leave the root class alone')
    assert.equal(await header.evaluate(element => getComputedStyle(element).transitionDuration.split(',').every(value => parseFloat(value) === 0)), true, 'no CSS transition doubles the view transition')
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

for (const options of [{ motion: 'reduce' }, { api: false }]) {
  test(`${browserName}: ${JSON.stringify(options)} preserves both states without animation`, async () => {
    const { context, page, header, errors } = await open(options)
    try {
      await scroll(page, 80)
      assert.equal(await header.locator('.ui-header-nav > a:visible').count(), 3)
      await scroll(page, 0)
      assert.equal(await header.locator('.ui-header-nav > a:visible').count(), 0)
      assert.equal(await page.evaluate(() => window.headerTransitions.length), 0)
      assert.deepEqual(errors, [])
    } finally { await context.close() }
  })
}

test(`${browserName}: reducing motion cancels an active transition`, async () => {
  const { context, page, header, errors } = await open()
  try {
    await page.evaluate(() => scrollTo(0, 80))
    await page.waitForFunction(() => window.headerTransitions.some(transition => transition.ready))
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.waitForFunction(() => !('headerTransition' in document.documentElement.dataset))
    await scroll(page, 0)
    assert.equal(await header.locator('.ui-header-nav > a:visible').count(), 0)
    assert.equal(await page.evaluate(() => window.headerTransitions.length), 1)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${browserName}: static homepage and other document headers retain usable links`, async () => {
  for (const options of [{ js: false, width: 390 }, { path: 'guide/introduction' }, { path: 'guide/introduction', width: 390 }]) {
    const { context, page, header, errors } = await open(options)
    try {
      const mobile = options.width === 390
      assert.equal(await header.getByRole('link', { name: 'GitHub', exact: true }).isVisible(), options.js === false || !mobile)
      assert.equal(await header.locator('.ui-header-nav > a:visible').count(), mobile ? 0 : 3)
      assert.equal(await header.locator('.ui-header-end > a.btn:visible').count(), options.js === false ? 1 : mobile ? 0 : 4)
      assert.deepEqual(errors, [])
    } finally { await context.close() }
  }
})
