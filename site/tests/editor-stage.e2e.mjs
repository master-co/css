/** Run against the local site: node --test site/tests/editor-stage.e2e.mjs. */
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { mkdir } from 'node:fs/promises'
import { chromium, webkit } from '@playwright/test'

const url = process.env.MASTER_EDITOR_URL ?? 'http://127.0.0.1:3000'
const browserName = process.env.MASTER_EDITOR_BROWSER ?? 'chromium'
const full = process.env.MASTER_EDITOR_MATRIX === 'full'
const screenshots = process.env.MASTER_EDITOR_SCREENSHOTS
const names = ['complete', 'hover', 'highlight', 'color']
let browser
before(async () => {
  browser = await ({ chromium, webkit })[browserName].launch()
  if (screenshots) await mkdir(screenshots, { recursive: true })
})
after(async () => { await browser?.close() })

async function open({ width = 1440, scheme = 'light', locale = 'en', motion = 'reduce', js = true, text = 16, touch = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 1100 }, colorScheme: scheme, reducedMotion: motion, javaScriptEnabled: js, hasTouch: touch, isMobile: touch })
  const page = await context.newPage()
  await page.routeWebSocket(socket => socket.hostname === new URL(url).hostname, socket => socket.onMessage(() => undefined))
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const response = await page.goto(`${url}/${locale === 'tw' ? 'tw' : ''}`, { waitUntil: 'networkidle' })
  assert.equal(response.status(), 200)
  await page.evaluate(size => { document.documentElement.style.fontSize = `${size}px` }, text)
  await page.evaluate(() => document.fonts.ready)
  // The server renders the completed scene; a click before hydration would not reach the chapters.
  // Astro drops an island's `ssr` attribute once it hydrates.
  if (js) await page.waitForFunction(() => { const chapter = document.querySelector('.home-editor-chapter'); return !!chapter && !chapter.closest('astro-island[ssr]') })
  const stage = page.locator('.home-editor-stage')
  const frame = stage.locator('.home-editor-frame')
  const chapters = stage.locator('.home-editor-chapter')
  await frame.scrollIntoViewIfNeeded()
  await page.mouse.move(width - 2, 1000)
  return { context, page, stage, frame, chapters, errors }
}

async function choose(view, index) {
  await view.chapters.nth(index).click()
  await view.frame.scrollIntoViewIfNeeded()
  await view.page.mouse.move(view.page.viewportSize().width - 2, 1000)
  await view.page.waitForTimeout(100)
  assert.equal(await view.stage.getAttribute('data-scene'), names[index])
  assert.equal(await view.chapters.nth(index).getAttribute('aria-pressed'), 'true')
}

const progress = view => view.stage.evaluate(element => Number(element.querySelector('[aria-pressed="true"] .home-editor-chapter-progress').style.getPropertyValue('--editor-progress')))
const snapshot = view => view.stage.evaluate(element => ({
  progress: element.querySelector('[aria-pressed="true"] .home-editor-chapter-progress').style.getPropertyValue('--editor-progress'),
  scene: element.dataset.scene,
  text: element.querySelector('.home-editor-plane').textContent,
  caret: element.querySelector('.home-editor-caret').getBoundingClientRect().toJSON()
}))
const releaseFocus = view => view.page.evaluate(() => document.activeElement?.blur())

async function geometry(view) {
  return view.frame.evaluate(element => {
    const box = element.getBoundingClientRect()
    const heading = document.querySelector('#language-service .home-section-heading')
    const headingBox = heading.getBoundingClientRect()
    const sectionBox = heading.closest('.home-section-header').getBoundingClientRect()
    const caption = document.querySelector('#language-service .home-eyebrow')
    const captionBox = caption.getBoundingClientRect()
    const file = element.querySelector('.home-editor-file-name')
    const fileBox = file.getBoundingClientRect()
    const tabBox = file.closest('.home-editor-tab').getBoundingClientRect()
    const overlay = [...element.querySelectorAll('.home-editor-hover-card, .home-editor-suggest-list, .home-editor-suggest-docs, .home-editor-picker')]
      .filter(pane => getComputedStyle(pane).visibility === 'visible' && getComputedStyle(pane).display !== 'none')
      .map(pane => ({ name: pane.className, ...pane.getBoundingClientRect().toJSON() }))
    return {
      width: box.width,
      overflow: document.documentElement.scrollWidth > innerWidth,
      headingClipped: heading.scrollWidth > heading.clientWidth + 1 || headingBox.right > sectionBox.right + 1 || headingBox.left < sectionBox.left - 1,
      captionClipped: caption.scrollWidth > caption.clientWidth + 1 || captionBox.right > sectionBox.right + 1 || captionBox.left < sectionBox.left - 1,
      fileClipped: file.scrollWidth > file.clientWidth + 1 || fileBox.right > box.right + 1 || fileBox.left < box.left - 1 || fileBox.bottom > tabBox.bottom + 1 || fileBox.top < tabBox.top - 1,
      overlay,
      clipped: overlay.filter(pane => pane.left < box.left - 1 || pane.right > box.right + 1 || pane.top < box.top - 1 || pane.bottom > box.bottom + 1),
      // Two-column layouts show the selected description on one shared line below the chapters instead.
      titles: [...document.querySelectorAll('.home-editor-chapter-title, .home-editor-chapter-body, .home-editor-chapter-note > [data-active]')].filter(title => getComputedStyle(title).display !== 'none').map(title => {
        const rect = title.getBoundingClientRect()
        const chapter = title.closest('.home-editor-chapter') ?? title.parentElement
        const parent = chapter.getBoundingClientRect()
        const style = getComputedStyle(chapter)
        return { text: title.textContent, clipped: title.scrollWidth > title.clientWidth + 1 || rect.right > parent.right - parseFloat(style.paddingRight) + 1 || rect.left < parent.left + parseFloat(style.paddingLeft) - 1 }
      }),
      footer: [...element.querySelectorAll('.home-editor-scene, .home-editor-playback')].filter(item => getComputedStyle(item).display !== 'none').map(item => ({ text: item.textContent, clipped: item.scrollWidth > item.clientWidth + 1, height: item.getBoundingClientRect().height }))
    }
  })
}

for (const width of full ? [320, 390, 768, 1024, 1440, 1920] : [390, 1440]) {
  for (const locale of full ? ['en', 'tw'] : ['en']) for (const scheme of ['light', 'dark']) {
    test(`${browserName} ${width} ${locale} ${scheme}: four readable scenes with stable geometry`, { timeout: 45000 }, async () => {
      const view = await open({ width, locale, scheme })
      try {
        const heights = []
        for (let index = 0; index < names.length; index++) {
          await choose(view, index)
          const measured = await geometry(view)
          assert.equal(measured.overflow, false, JSON.stringify(measured))
          assert.equal(measured.headingClipped, false, 'the section title stays inside its reading column')
          assert.equal(measured.fileClipped, false, 'the complete file name stays in its tab')
          assert.equal(measured.captionClipped, false, 'the section caption stays on its reading rail')
          assert.deepEqual(measured.clipped, [], JSON.stringify(measured))
          assert.ok(measured.titles.every(item => !item.clipped), JSON.stringify(measured.titles))
          assert.ok(measured.footer.every(item => !item.clipped), JSON.stringify(measured.footer))
          heights.push((await view.stage.boundingBox()).height)
          if (screenshots) await view.frame.screenshot({ path: `${screenshots}/${browserName}-${width}-${locale}-${scheme}-${names[index]}.png` })
        }
        assert.ok(Math.max(...heights) - Math.min(...heights) < 1, `the scene never shifts the page: ${heights}`)
        assert.equal(await view.stage.locator('.home-editor-playback').count(), 0, 'reduced motion has no autoplay control')
        assert.deepEqual(view.errors, [])
      } finally { await view.context.close() }
    })
  }
}

test(`${browserName}: reading the file pauses playback and preserves native horizontal scrolling`, { timeout: 45000 }, async () => {
  const view = await open({ width: 390, motion: 'no-preference' })
  try {
    await releaseFocus(view)
    await view.page.waitForTimeout(750)
    assert.ok(await progress(view) > 0, 'the visible tour begins')
    const code = view.stage.getByRole('region', { name: 'Scrollable code example' })
    await code.focus()
    const held = await snapshot(view)
    await view.page.waitForTimeout(350)
    assert.deepEqual(await snapshot(view), held, 'keyboard reading holds the film')
    const start = await code.evaluate(element => element.scrollLeft)
    await view.page.keyboard.press('ArrowRight')
    await view.page.waitForTimeout(350)
    assert.ok(await code.evaluate(element => element.scrollLeft) > start, 'the native arrow key scrolls the whole file')
    await view.page.keyboard.press('Home')
    assert.equal(await code.evaluate(element => element.scrollLeft), 0)
    await view.page.keyboard.press('End')
    await view.page.waitForTimeout(100)
    assert.ok(await code.evaluate(element => element.scrollLeft) > 400, 'every dense line is reachable')
    assert.deepEqual((await geometry(view)).clipped, [], 'floating panes stay inside the window after a manual scroll')
    await releaseFocus(view)
    const stopped = await progress(view)
    await view.page.waitForTimeout(250)
    assert.equal(await progress(view), stopped, 'reading ends automatic playback until Play')
    assert.equal(await view.stage.locator('.home-editor-playback').innerText(), 'Play demo')
    assert.deepEqual(view.errors, [])
  } finally { await view.context.close() }
})

test(`${browserName}: pointer and focus independently hold the tour`, { timeout: 45000 }, async () => {
  const view = await open({ motion: 'no-preference' })
  try {
    await view.page.waitForTimeout(350)
    await view.chapters.nth(0).hover()
    await view.chapters.nth(0).focus()
    await view.page.waitForTimeout(100)
    const focused = await progress(view)
    await view.page.mouse.move(1438, 1000)
    await view.page.waitForTimeout(250)
    assert.equal(await progress(view), focused, 'leaving with the pointer does not clear keyboard focus')
    await view.chapters.nth(0).hover()
    await releaseFocus(view)
    await view.page.waitForTimeout(100)
    const pointed = await progress(view)
    await view.page.waitForTimeout(250)
    assert.equal(await progress(view), pointed, 'blurring does not clear pointer presence')
    await view.page.mouse.move(1438, 1000)
    await view.frame.scrollIntoViewIfNeeded()
    await view.page.waitForTimeout(400)
    assert.ok(await progress(view) > pointed, 'leaving both paths resumes the tour')
    assert.deepEqual(view.errors, [])
  } finally { await view.context.close() }
})

test(`${browserName}: hidden tabs and offscreen windows freeze the timeline`, { timeout: 45000 }, async () => {
  const view = await open({ motion: 'no-preference' })
  try {
    await view.page.waitForTimeout(400)
    await view.page.evaluate(() => window.scrollTo(0, 0))
    await view.page.waitForTimeout(150)
    const offscreen = await progress(view)
    await view.page.waitForTimeout(350)
    assert.equal(await progress(view), offscreen)
    await view.frame.scrollIntoViewIfNeeded()
    await view.page.waitForTimeout(250)
    assert.ok(await progress(view) > offscreen)
    await view.page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await view.page.waitForTimeout(100)
    const hidden = await snapshot(view)
    await view.page.waitForTimeout(350)
    assert.deepEqual(await snapshot(view), hidden)
    assert.equal(await view.stage.locator('.home-editor-caret').evaluate(element => getComputedStyle(element).animationPlayState), 'paused')
    await view.page.evaluate(() => {
      delete document.hidden
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await view.page.waitForTimeout(250)
    assert.ok(await progress(view) > Number(hidden.progress))
    assert.deepEqual(view.errors, [])
  } finally { await view.context.close() }
})

test(`${browserName}: Play starts immediately under its own pointer and keyboard focus`, { timeout: 45000 }, async () => {
  const view = await open({ motion: 'no-preference' })
  try {
    await choose(view, 1)
    await view.page.waitForTimeout(3000)
    assert.equal(await progress(view), 1, 'the selected scene rests on its revealed moment')
    await view.stage.getByRole('button', { name: 'Play demo' }).click()
    await view.page.waitForTimeout(400)
    const playing = await progress(view)
    assert.ok(playing > 0 && playing < .25, `Play starts the selected scene: ${playing}`)
    await view.chapters.nth(0).hover()
    await view.page.waitForTimeout(100)
    const held = await progress(view)
    await view.page.waitForTimeout(250)
    assert.equal(await progress(view), held, 'returning to the feature copy holds playback again')
    assert.deepEqual(view.errors, [])
  } finally { await view.context.close() }
})

test(`${browserName}: keyboard color editing, reset and Escape return to the source`, { timeout: 45000 }, async () => {
  const view = await open({ width: 390, scheme: 'dark' })
  try {
    await choose(view, 3)
    const swatch = view.stage.getByRole('button', { name: 'Edit literal color' })
    await swatch.focus()
    await view.page.keyboard.press('Enter')
    const picker = view.stage.getByRole('dialog', { name: 'Color picker' })
    assert.equal(await picker.getAttribute('data-open'), '')
    const input = picker.getByLabel('Literal color')
    await view.page.mouse.move(388, 1050)
    assert.equal(await picker.getAttribute('data-open'), '', 'an explicitly opened picker stays available when the pointer leaves')
    await input.evaluate(element => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, '#218875')
      element.dispatchEvent(new Event('input', { bubbles: true }))
      element.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await view.page.waitForTimeout(100)
    assert.ok((await view.stage.locator('.home-editor-plane').innerText()).includes('color:#218875'))
    await view.page.keyboard.press('Escape')
    const literal = view.stage.locator('.home-editor-class:has(.home-editor-swatch[data-editable])')
    await literal.hover()
    await view.page.waitForTimeout(150)
    assert.equal(await view.stage.locator('.home-editor-hover-heading code').innerText(), '(color:#218875)')
    assert.match(await view.stage.locator('.home-editor-hover-css').innerText(), /color: #218875/)
    const range = await view.stage.locator('.home-editor-hover-range').boundingBox()
    assert.ok(Math.abs(range.width - (await literal.boundingBox()).width) < 1, 'the source underline includes the inline color decoration')
    await swatch.click()
    await picker.getByRole('button', { name: 'Reset color' }).click()
    assert.ok((await view.stage.locator('.home-editor-plane').innerText()).includes('color:#4f46e5'))
    await input.focus()
    await view.page.keyboard.press('Escape')
    assert.equal(await view.stage.locator('.home-editor-picker').getAttribute('data-open'), null)
    assert.equal(await swatch.evaluate(element => element === document.activeElement), true)
    assert.deepEqual(view.errors, [])
  } finally { await view.context.close() }
})

test(`${browserName}: keyboard reading keeps the inspected CSS open and scrollable`, { timeout: 45000 }, async () => {
  const view = await open({ width: 390 })
  try {
    await choose(view, 2)
    await view.stage.locator('.home-editor-class').filter({ hasText: 'fg-blue-70:hover@sm' }).hover()
    const css = view.stage.getByRole('region', { name: 'Generated CSS' })
    await css.focus()
    await view.page.mouse.move(388, 1050)
    await view.page.waitForTimeout(150)
    assert.equal(await view.stage.locator('.home-editor-hover-card').getAttribute('data-open'), '')
    assert.equal(await view.stage.locator('.home-editor-hover-heading code').innerText(), 'fg-blue-70:hover@sm')
    const before = await css.evaluate(element => element.parentElement.scrollTop)
    await view.page.keyboard.press('ArrowDown')
    assert.ok(await css.evaluate(element => element.parentElement.scrollTop) > before, 'the entire generated rule is reachable by keyboard')
    assert.deepEqual(view.errors, [])
  } finally { await view.context.close() }
})

test(`${browserName}: keyboard color edits take control of an automatic scene`, { timeout: 45000 }, async () => {
  const view = await open({ motion: 'no-preference' })
  try {
    await choose(view, 3)
    await view.stage.getByRole('button', { name: 'Play demo' }).click()
    await view.page.waitForTimeout(1400)
    const input = view.stage.getByLabel('Literal color', { exact: true })
    await input.focus()
    await input.evaluate(element => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, '#218875')
      element.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await view.page.waitForTimeout(50)
    assert.equal(await view.stage.locator('.home-editor-playback').innerText(), 'Play demo', 'an edit ends the automatic tour')
    await view.page.keyboard.press('Escape')
    await releaseFocus(view)
    await view.page.mouse.move(1438, 1050)
    const held = await snapshot(view)
    await view.page.waitForTimeout(400)
    assert.deepEqual(await snapshot(view), held, 'the film does not reopen a dismissed picker')
    assert.ok(held.text.includes('color:#218875'))
    assert.deepEqual(view.errors, [])
  } finally { await view.context.close() }
})

test(`${browserName}: the source supports native text selection`, { timeout: 45000 }, async () => {
  const view = await open()
  try {
    await choose(view, 2)
    const text = view.stage.locator('.home-editor-line').nth(8).locator('[data-tone="text"]')
    const cell = await text.evaluate(element => parseFloat(getComputedStyle(element).getPropertyValue('--editor-ch')))
    await text.dblclick({ position: { x: cell * 8, y: 8 } })
    assert.equal(await view.page.evaluate(() => getSelection().toString().trim()), 'Builds')
    assert.deepEqual(view.errors, [])
  } finally { await view.context.close() }
})

test(`${browserName}: a touch tap keeps a class inspection readable`, { timeout: 45000 }, async () => {
  const view = await open({ width: 390, touch: true })
  try {
    await choose(view, 2)
    await view.stage.locator('.home-editor-class').filter({ hasText: 'fg-blue-70:hover@sm' }).tap()
    await view.page.waitForTimeout(400)
    assert.equal(await view.stage.locator('.home-editor-hover-card').getAttribute('data-open'), '')
    assert.equal(await view.stage.locator('.home-editor-hover-heading code').innerText(), 'fg-blue-70:hover@sm')
    await view.stage.getByRole('region', { name: 'Generated CSS' }).focus()
    await view.page.touchscreen.tap(3, 1050)
    await view.page.waitForTimeout(150)
    assert.equal(await view.stage.locator('.home-editor-hover-card').getAttribute('data-open'), null)
    assert.deepEqual(view.errors, [])
  } finally { await view.context.close() }
})

test(`${browserName}: a settled scene keeps its source word visible when the editor narrows`, { timeout: 45000 }, async () => {
  const view = await open()
  try {
    await choose(view, 1)
    await view.frame.evaluate(element => { element.style.width = '350px' })
    await view.page.waitForTimeout(150)
    const code = await view.stage.locator('.home-editor-viewport').boundingBox()
    const word = await view.stage.locator('.home-editor-class').filter({ hasText: 'fg-blue-70:hover@sm' }).boundingBox()
    assert.ok(word.x >= code.x - 1 && word.x + word.width <= code.x + code.width + 1, `the inspected word stays in view: ${JSON.stringify({code,word})}`)
    assert.deepEqual((await geometry(view)).clipped, [])
    assert.deepEqual(view.errors, [])
  } finally { await view.context.close() }
})

if (browserName === 'chromium') test('a touch swipe over the file belongs to the page and pins no inspection', { timeout: 45000 }, async () => {
  const view = await open({ width: 390, touch: true })
  try {
    await choose(view, 2)
    const token = view.stage.locator('.home-editor-class').filter({ hasText: 'fg-blue-70:hover@sm' })
    await token.scrollIntoViewIfNeeded()
    const box = await token.boundingBox()
    const code = view.stage.locator('.home-editor-viewport')
    const start = await code.evaluate(element => element.scrollLeft)
    const cdp = await view.context.newCDPSession(view.page)
    const x = box.x + box.width * .7
    const y = box.y + box.height / 2
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    for (let step = 1; step <= 8; step++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - step * 10, y }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await view.page.waitForTimeout(400)
    assert.equal(await code.evaluate(element => element.scrollLeft), start, 'homepage code never scrolls under a swipe')
    assert.equal(await view.stage.locator('.home-editor-hover-card').getAttribute('data-open'), null)
    const page = await view.page.evaluate(() => scrollY)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    for (let step = 1; step <= 8; step++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - step * 15 }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await view.page.waitForTimeout(400)
    assert.ok(await view.page.evaluate(() => scrollY) > page + 40, 'a vertical swipe over the code scrolls the page')
    assert.deepEqual(view.errors, [])
  } finally { await view.context.close() }
})

for (const text of [16, 32]) {
  test(`${browserName}: pointer color editing follows the actual plane at ${text}px base text`, { timeout: 45000 }, async () => {
    const view = await open({ width: 390, text })
    try {
      await choose(view, 3)
      await view.stage.getByRole('button', { name: 'Edit literal color' }).click()
      const plane = view.stage.locator('.home-editor-picker-plane')
      const box = await plane.boundingBox()
      const x = box.x + box.width * .65
      const y = box.y + box.height * .2
      await view.page.mouse.move(box.x + box.width * .4, box.y + box.height * .4)
      await view.page.mouse.down()
      await view.page.mouse.move(x, y, { steps: 8 })
      await view.page.mouse.up()
      const handle = await view.stage.locator('.home-editor-picker-plane .home-editor-picker-handle').boundingBox()
      assert.ok(Math.abs(handle.x + handle.width / 2 - x) < 1)
      assert.ok(Math.abs(handle.y + handle.height / 2 - y) < 1)
      const input = view.stage.getByLabel('Literal color', { exact: true })
      const hex = await input.inputValue()
      assert.ok((await view.stage.locator('.home-editor-plane').innerText()).includes(`color:${hex}`))
      await view.page.mouse.move(box.x + 3, box.y + 3)
      assert.equal(await input.inputValue(), hex, 'releasing the pointer ends the drag')
      assert.deepEqual(view.errors, [])
    } finally { await view.context.close() }
  })
}

for (const width of [320, 768, 1440]) {
  test(`${browserName} ${width}: enlarged text keeps features and controls readable`, { timeout: 45000 }, async () => {
    const view = await open({ width, text: 32 })
    try {
      for (let index = 0; index < names.length; index++) {
        await choose(view, index)
        const measured = await geometry(view)
        assert.equal(measured.overflow, false, JSON.stringify(measured))
        assert.equal(measured.headingClipped, false, 'the enlarged section title stays inside its reading column')
        assert.equal(measured.fileClipped, false, 'the complete enlarged file name stays in its tab')
        assert.equal(measured.captionClipped, false, 'the enlarged section caption stays readable')
        assert.deepEqual(measured.clipped, [], JSON.stringify(measured))
        assert.ok(measured.titles.every(item => !item.clipped), JSON.stringify(measured.titles))
        assert.ok(measured.footer.every(item => !item.clipped), JSON.stringify(measured.footer))
      }
      assert.deepEqual(view.errors, [])
    } finally { await view.context.close() }
  })
}

test(`${browserName}: without JavaScript the example and guide remain available`, { timeout: 45000 }, async () => {
  const view = await open({ width: 390, js: false })
  try {
    assert.ok((await view.stage.locator('.home-editor-plane').innerText()).includes('Usage alerts'))
    assert.equal(await view.chapters.count(), 4)
    assert.equal(await view.page.locator('#language-service .home-section-link').getAttribute('href'), '/guide/language-service')
    assert.equal((await geometry(view)).overflow, false)
  } finally { await view.context.close() }
})

test(`${browserName}: changing the motion preference reveals a still scene immediately`, { timeout: 45000 }, async () => {
  const view = await open({ motion: 'no-preference' })
  try {
    await view.page.waitForTimeout(350)
    await view.page.emulateMedia({ reducedMotion: 'reduce' })
    await view.page.waitForTimeout(150)
    const held = await snapshot(view)
    assert.equal(held.progress, '1.0000')
    assert.equal(await view.stage.locator('.home-editor-playback').count(), 0)
    assert.equal(await view.stage.locator('.home-editor-caret').evaluate(element => getComputedStyle(element).animationName), 'none')
    await view.page.waitForTimeout(400)
    assert.deepEqual(await snapshot(view), held)
    await view.page.emulateMedia({ reducedMotion: 'no-preference' })
    await view.page.waitForTimeout(200)
    assert.notEqual(await progress(view), 1, 'motion resumes from the revealed moment')
    assert.deepEqual(view.errors, [])
  } finally { await view.context.close() }
})

if (browserName === 'chromium') test('forced colors preserve readable source and visible picker colors', { timeout: 45000 }, async () => {
  const view = await open({ width: 390 })
  try {
    await view.page.emulateMedia({ forcedColors: 'active' })
    await choose(view, 1)
    assert.deepEqual((await geometry(view)).clipped, [])
    const card = view.stage.locator('.home-editor-hover-card')
    assert.equal(await card.evaluate(element => getComputedStyle(element).outlineStyle), 'solid')
    await choose(view, 3)
    assert.equal(await view.stage.locator('.home-editor-picker-plane').evaluate(element => getComputedStyle(element).forcedColorAdjust), 'none')
    assert.equal((await geometry(view)).overflow, false)
    assert.deepEqual(view.errors, [])
  } finally { await view.context.close() }
})
