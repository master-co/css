/** Run against the site: node --test site/tests/view-transitions.e2e.mjs.
 * Set MASTER_TRANSITION_BROWSER=webkit for the second browser engine.
 */
import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { chromium, webkit } from '@playwright/test'

const browserName = process.env.MASTER_TRANSITION_BROWSER ?? 'chromium'
const base = process.env.MASTER_TRANSITION_URL ?? 'http://localhost:3000'
let browser
before(async () => { browser = await ({ chromium, webkit })[browserName].launch() })
after(async () => { await browser?.close() })

async function open({ width = 1280, scheme = 'light', embedded = true, motion = 'no-preference', api = true, path = 'article-transitions' } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme, reducedMotion: motion })
  const page = await context.newPage()
  await page.routeWebSocket(socket => socket.hostname === new URL(base).hostname, socket => socket.onMessage(() => undefined))
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(enabled => {
    localStorage.setItem('theme-preference', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    window.transitionRecords = []
    const start = document.startViewTransition?.bind(document)
    if (!enabled || !start) { document.startViewTransition = undefined; return }
    document.startViewTransition = (...args) => {
      const record = { start: performance.now(), initialHeight: innerHeight, updated: false, ready: false, finished: false }
      window.transitionRecords.push(record)
      const transition = start(...args)
      transition.updateCallbackDone.then(() => { record.updated = true }, error => { record.updateError = error.message })
      transition.ready.then(() => {
        record.ready = true
        record.readyHeight = innerHeight
        record.images = [...document.querySelectorAll('img')].map(img => getComputedStyle(img).viewTransitionName)
        if (record.images[0]) record.captureDuration = getComputedStyle(document.documentElement, `::view-transition-group(${record.images[0]})`).animationDuration
        record.classSupported = CSS.supports('view-transition-class: article')
        setTimeout(() => {
          record.middleHeight = innerHeight
          record.middleAnimations = document.getAnimations().filter(a => a.playState === 'running').length
          record.finishedAtMiddle = record.finished
        }, 80)
      }, error => { record.readyError = error.name })
      transition.finished.then(() => {
        record.finished = true
        record.elapsed = performance.now() - record.start
      }, error => { record.finished = true; record.finishError = error.message })
      return transition
    }
  }, api)
  await page.goto(`${base}/${embedded ? 'guide/view-transitions' : `examples/${path}`}`, { waitUntil: 'networkidle' })
  const scene = embedded ? page.frameLocator('iframe[src="/examples/article-transitions"]') : page
  await scene.getByRole('status').filter({ hasText: /Native view transition|instant update/ }).waitFor()
  await scene.locator('html').evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.images].map(image => image.decode().catch(() => {})))
  })
  return { page, scene, context, errors }
}

async function complete(scene, index, animated = true) {
  await scene.locator('html').evaluate(async (_element, index) => {
    const deadline = performance.now() + 5000
    while (!window.transitionRecords[index]?.finished) {
      if (performance.now() > deadline) throw new Error('Transition did not finish: ' + JSON.stringify({ index, records: window.transitionRecords, text: document.body.innerText.slice(0, 150) }))
      await new Promise(resolve => setTimeout(resolve, 20))
    }
  }, index)
  const record = await scene.locator('html').evaluate((_element, index) => window.transitionRecords[index], index)
  assert.equal(record.updated, true)
  assert.equal(record.updateError, undefined)
  if (animated) {
    assert.equal(record.ready, true)
    assert.equal(record.initialHeight, record.readyHeight)
    assert.equal(record.initialHeight, record.middleHeight, 'iframe must not resize during animation')
    assert.equal(record.finishedAtMiddle, false, 'resolved finished alone does not prove animation')
    assert.ok(record.middleAnimations > 0, 'capture a real intermediate animated frame')
    assert.ok(record.elapsed >= 180, `animation ended early: ${record.elapsed}ms`)
  }
  return record
}

for (const embedded of [true, false]) for (const width of [390, 768, 1280]) for (const scheme of ['light', 'dark']) {
  test(`${embedded ? 'embedded' : 'standalone'} ${width}px ${scheme}: both article pairs animate and restore focus`, async () => {
    const { scene, context, errors } = await open({ width, scheme, embedded })
    try {
      for (const [index, title] of ['Designing transitions that preserve context', 'Building quieter detail pages'].entries()) {
        const button = scene.getByRole('button', { name: `Read ${title}` })
        await button.focus()
        await button.press('Enter')
        const record = await complete(scene, index * 2)
        assert.ok(record.images.includes(`article-${index ? 'studio' : 'aurora'}-image`))
        if (record.classSupported) assert.equal(record.captureDuration, '0.5s', 'route-owned native CSS must reach the pseudo-elements')
        assert.equal(await scene.locator('h1').evaluate(element => element === document.activeElement), true)
        await scene.getByRole('button', { name: 'Back to collection' }).click()
        await complete(scene, index * 2 + 1)
        assert.equal(await button.evaluate(element => element === document.activeElement), true)
      }
      assert.deepEqual(errors, [])
    } finally { await context.close() }
  })
}

for (const options of [{ motion: 'reduce' }, { api: false }]) test(`usable fallback ${JSON.stringify(options)}`, async () => {
  const { scene, context, errors } = await open(options)
  try {
    await scene.getByRole('button', { name: /Read Designing/ }).click()
    await scene.locator('h1').waitFor()
    await scene.getByRole('button', { name: 'Back to collection' }).click()
    await scene.getByRole('button', { name: /Read Designing/ }).waitFor()
    assert.equal(await scene.locator('html').evaluate(() => window.transitionRecords.length), 0)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test('duplicate names skip the animation but commit the destination once', async () => {
  const { scene, context, errors } = await open()
  try {
    await scene.locator('img').evaluateAll(images => images.forEach(img => { img.style.viewTransitionName = 'duplicate' }))
    await scene.getByRole('button', { name: /Read Designing/ }).click()
    const record = await complete(scene, 0, false)
    assert.equal(record.ready, false)
    assert.ok(record.readyError)
    assert.equal(await scene.locator('[data-article-detail]').count(), 1)
    assert.equal(await scene.locator('h1').evaluate(el => el === document.activeElement), true)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test('rapid input retains the latest requested view', async () => {
  const { scene, context, errors } = await open({ embedded: false, path: 'view-transitions' })
  try {
    await scene.getByRole('button', { name: 'Product detail', exact: true }).evaluate(button => {
      button.click()
      Array.from(document.querySelectorAll('button')).find(el => el.textContent === 'Settings').click()
    })
    await scene.getByRole('heading', { name: 'Settings' }).waitFor()
    const count = await scene.locator('html').evaluate(() => window.transitionRecords.length)
    assert.equal(count, 2)
    await complete(scene, count - 1)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test('enabling reduced motion skips an active animation without losing the update', async () => {
  const { page, scene, context, errors } = await open()
  try {
    await scene.getByRole('button', { name: /Read Designing/ }).click()
    await scene.locator('h1').waitFor()
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await complete(scene, 0, false)
    await scene.getByRole('button', { name: 'Back to collection' }).click()
    assert.equal(await scene.locator('html').evaluate(() => window.transitionRecords.length), 1)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})
