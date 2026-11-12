/** Built CSS documents must consume UI material without repainting a parallel recipe. */
import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { chromium, webkit, firefox } from '@playwright/test'

const engine = process.env.MASTER_SITE_BROWSER ?? 'chromium'
const base = process.env.MASTER_SITE_URL ?? 'http://127.0.0.1:3218'
let browser
before(async () => { browser = await ({ chromium, webkit, firefox })[engine].launch() })
after(async () => { await browser?.close() })

const profiles = [
  { width: 1440, scheme: 'light', dpr: 1 },
  { width: 390, scheme: 'dark', dpr: 2 },
  { width: 320, scheme: 'light', dpr: 1, enlarged: true },
  { width: 1440, scheme: 'dark', dpr: 1, round: true },
]

/** Remove only the site hook temporarily: canonical UI parts and the actual parent context stay in place. */
async function assertFace(locator, hook, required) {
  assert.ok(await locator.count(), `${hook} has a real document consumer`)
  const result = await locator.first().evaluate((element, { hook, required }) => {
    const properties = ['backgroundColor', 'backgroundImage', 'boxShadow', 'borderRadius', 'cornerShape', 'borderTopWidth', 'borderTopColor']
    const read = () => Object.fromEntries(properties.map(property => [property, getComputedStyle(element)[property]]))
    const classes = [...element.classList]
    const actual = read()
    element.classList.remove(hook)
    const canonical = read()
    element.classList.add(hook)
    return { classes, actual, canonical, required }
  }, { hook, required })
  for (const part of required) assert.ok(result.classes.includes(part), `${hook} consumes ${part}`)
  assert.notEqual(result.canonical.boxShadow, 'none', `${hook} loads its UI material`)
  assert.deepEqual(result.actual, result.canonical, `${hook} does not override its canonical UI face`)
}

for (const profile of profiles) test(`${engine} ${JSON.stringify(profile)}: actual document material comes from UI`, { timeout: 90000 }, async () => {
  const context = await browser.newContext({ viewport: { width: profile.width, height: 900 }, colorScheme: profile.scheme, deviceScaleFactor: profile.dpr, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  async function open(route) {
    assert.equal((await page.goto(base + route, { waitUntil: 'networkidle' })).status(), 200)
    await page.evaluate(() => document.fonts.ready)
    if (profile.enlarged) await page.addStyleTag({ content: 'html { font-size: 200% !important }' })
    // Explicit round-token scenario; engine-native unsupported-corner coverage is separate.
    if (profile.round) await page.addStyleTag({ content: ':root { --corner-shape: round !important; --corner-scale: 1 !important }' })
  }
  try {
    await open('/reference/tokens/color-roles')
    const headings = await page.locator('th.table-cell.table-primary[scope="row"]').evaluateAll(elements => elements.map(element => {
      const style = getComputedStyle(element)
      const peer = document.createElement('td')
      peer.className = element.className
      peer.setAttribute('role', 'rowheader')
      element.after(peer)
      const expected = getComputedStyle(peer)
      const result = { alignment: style.textAlign, weight: style.fontWeight, expectedAlignment: expected.textAlign, expectedWeight: expected.fontWeight }
      peer.remove()
      return result
    }))
    assert.ok(headings.length > 5, 'native data rows are exercised')
    for (const heading of headings) {
      assert.equal(heading.alignment, 'start', 'native row labels align with their data')
      assert.equal(heading.alignment, heading.expectedAlignment)
      assert.equal(heading.weight, heading.expectedWeight, 'native and role-based row headings share the UI weight')
    }
    const plain = page.locator('.ref-table tbody code:not(.code)').first()
    assert.ok(await plain.count(), 'lookup identifiers remain plain')
    assert.equal(await plain.evaluate(element => getComputedStyle(element).boxShadow), 'none')
    if (profile.width <= 390) {
      const region = page.locator('.ref-value-table[data-modes][tabindex]').first()
      assert.ok(await region.evaluate(element => element.scrollWidth > element.clientWidth), 'a real narrow lookup table overflows inside its frame')
      await region.focus()
      await region.press('ArrowRight')
      await page.waitForFunction(element => element.scrollLeft > 0, await region.elementHandle())
      const right = await region.evaluate(element => element.scrollLeft)
      await region.press('ArrowLeft')
      assert.ok(await region.evaluate(element => element.scrollLeft) < right, 'keyboard scrolling returns toward the first column')
    }
    await assertFace(page.locator('.ui-stage'), 'ui-stage', ['sheet', 'sheet-flat'])
    await assertFace(page.locator('.ui-tray'), 'ui-tray', ['tray'])
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'lookup content stays within its page at enlarged text')

    await open('/guide/theme')
    await assertFace(page.locator('.ui-code.code-panel'), 'ui-code', ['code-panel'])
    const overlay = page.locator('.ui-code > .ui-copy:visible').first()
    assert.ok(await overlay.count(), 'a real untitled source block has an overlay copy control')
    const copyGeometry = await overlay.evaluate(element => {
      const box = element.getBoundingClientRect()
      const panel = element.parentElement.getBoundingClientRect()
      const style = getComputedStyle(element)
      return { inset: Number.parseFloat(style.right), rightGap: panel.right - box.right, radius: Number.parseFloat(style.borderTopRightRadius), panelRadius: Number.parseFloat(getComputedStyle(element.parentElement).borderTopRightRadius), corner: style.cornerShape, panelCorner: getComputedStyle(element.parentElement).cornerShape }
    })
    assert.ok(copyGeometry.inset > 0 && copyGeometry.rightGap >= copyGeometry.inset - 1, 'the copy overlay stays inside the code panel edge')
    assert.ok(copyGeometry.radius > 0, 'the overlay background has its own inset corner')
    assert.ok(Math.abs(copyGeometry.radius - (copyGeometry.panelRadius - copyGeometry.inset)) <= 1, 'the overlay subtracts its inset from the already-scaled outer radius')
    assert.equal(copyGeometry.corner, copyGeometry.panelCorner, 'the overlay follows the supported panel corner shape')
    const copyButton = overlay.locator('button')
    await copyButton.focus()
    const focus = await copyButton.evaluate(element => {
      const button = element.getBoundingClientRect()
      const panel = element.closest('.ui-code').getBoundingClientRect()
      const style = getComputedStyle(element)
      const extent = Number.parseFloat(style.outlineWidth) + Number.parseFloat(style.outlineOffset)
      return { visible: element.matches(':focus-visible'), outline: style.outlineStyle, width: Number.parseFloat(style.outlineWidth), contained: button.left - extent >= panel.left - 1 && button.right + extent <= panel.right + 1 && button.top - extent >= panel.top - 1 && button.bottom + extent <= panel.bottom + 1 }
    })
    assert.ok(focus.visible && focus.outline !== 'none' && focus.width > 0, 'the copy button retains a visible keyboard focus indicator')
    assert.ok(focus.contained, 'the entire copy focus outline fits inside its code panel')
    const tab = page.locator('.ui-tabs [role="tab"]').first()
    assert.ok(await tab.count())
    assert.equal(await tab.evaluate(element => element.classList.contains('tabs-item')), true)
    await tab.focus()
    await tab.press('ArrowRight')
    const active = page.locator('.ui-tabs [role="tab"][aria-selected="true"]').first()
    assert.equal(await active.evaluate(element => document.activeElement === element), true)
    const panelId = await active.getAttribute('aria-controls')
    assert.equal(await page.locator(`[id="${panelId}"]`).isVisible(), true)
    if (profile.width <= 390) {
      let scrollableCode
      for (const code of await page.locator('.ui-code pre[tabindex]').all()) {
        if (await code.evaluate(element => element.scrollWidth > element.clientWidth && element.clientWidth > 0)) { scrollableCode = code; break }
      }
      assert.ok(scrollableCode, 'the narrow document has a real long source line')
      await scrollableCode.focus()
      await scrollableCode.press('ArrowRight')
      await page.waitForFunction(element => element.scrollLeft > 0, await scrollableCode.elementHandle())
      const right = await scrollableCode.evaluate(element => element.scrollLeft)
      await scrollableCode.press('ArrowLeft')
      assert.ok(await scrollableCode.evaluate(element => element.scrollLeft) < right, 'keyboard scrolling returns toward the start of the source line')
    }
    const chips = page.locator('.ui-prose > p code.code')
    assert.ok(await chips.count(), 'editorial inline literals consume UI code')
    assert.notEqual(await chips.first().evaluate(element => getComputedStyle(element).boxShadow), 'none')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true)
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})
