/** Two real-time tours, including the accepted-class reset. Opt into the full visual matrix. */
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { mkdir } from 'node:fs/promises'
import { chromium, webkit } from '@playwright/test'

const url = process.env.MASTER_EDITOR_URL ?? 'http://127.0.0.1:3000'
const browserName = process.env.MASTER_EDITOR_BROWSER ?? 'chromium'
const full = process.env.MASTER_EDITOR_MATRIX === 'full'
const screenshots = process.env.MASTER_EDITOR_SCREENSHOTS
const cases = full
  ? [320, 390, 768, 1024, 1440, 1920].flatMap(width => ['en', 'tw'].flatMap(locale => ['light', 'dark'].flatMap(scheme => [1, 2].map(density => ({ width, locale, scheme, density })))))
  : [{ width: 390, locale: 'en', scheme: 'dark', density: 1 }]
let browser
before(async () => {
  browser = await ({ chromium, webkit })[browserName].launch()
  if (screenshots) await mkdir(screenshots, { recursive: true })
})
after(async () => { await browser?.close() })

for (const { width, locale, scheme, density } of cases) {
  const label = `${browserName}-${width}-${locale}-${scheme}-${density}x`
  test(`${label}: two complete tours preserve layout, CSS and source geometry`, { timeout: 120000 }, async () => {
    const context = await browser.newContext({ viewport: { width, height: 1100 }, colorScheme: scheme, deviceScaleFactor: density, reducedMotion: 'no-preference' })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.routeWebSocket(socket => socket.hostname === new URL(url).hostname, socket => socket.onMessage(() => undefined))
    try {
      const response = await page.goto(`${url}/${locale === 'tw' ? 'tw' : ''}`, { waitUntil: 'networkidle', timeout: 45000 })
      assert.equal(response.status(), 200)
      await page.evaluate(() => document.fonts.ready)
      const stage = page.locator('.home-editor-stage')
      const frame = stage.locator('.home-editor-frame')
      await frame.scrollIntoViewIfNeeded()
      await page.mouse.move(width - 2, 1000)
      await page.evaluate(() => document.activeElement?.blur())
      await stage.evaluate(element => {
        window.editorTour = { selected: false, accepted: false }
        const observer = new MutationObserver(() => {
          if (element.querySelector('.home-editor-selection')) window.editorTour.selected = true
          if (element.querySelectorAll('.home-editor-line')[5].textContent.includes('fg-text-muted')) window.editorTour.accepted = true
        })
        observer.observe(element, { childList: true, subtree: true, characterData: true })
      })
      const original = await frame.boundingBox()
      const seen = new Set()
      const saved = new Set()
      const clips = []
      const heights = []
      const began = Date.now()
      let previous = 'complete'
      let resets = 0
      let samples = 0
      let lastLog = 0
      while (resets < 2 || seen.size < 4) {
        assert.ok(Date.now() - began < 90000, `${label}: the visible tour stopped before finishing`)
        await page.waitForTimeout(400)
        const sample = await stage.evaluate(element => {
          const box = element.querySelector('.home-editor-frame').getBoundingClientRect()
          const panes = [...element.querySelectorAll('.home-editor-hover-card, .home-editor-suggest-list, .home-editor-suggest-docs, .home-editor-picker')]
            .filter(pane => getComputedStyle(pane).display !== 'none' && getComputedStyle(pane).visibility === 'visible' && Number(getComputedStyle(pane).opacity) > .99)
          return {
            scene: element.dataset.scene,
            progress: Number(element.querySelector('[aria-pressed="true"] .home-editor-chapter-progress').style.getPropertyValue('--editor-progress')),
            height: box.height,
            y: box.y,
            overflow: document.documentElement.scrollWidth > innerWidth,
            clips: panes.filter(pane => {
              const rect = pane.getBoundingClientRect()
              return rect.left < box.left - 1 || rect.right > box.right + 1 || rect.top < box.top - 1 || rect.bottom > box.bottom + 1
            }).map(pane => ({ name: pane.className, box: pane.getBoundingClientRect().toJSON() })),
            source: element.querySelectorAll('.home-editor-line')[5].textContent,
            selection: window.editorTour.selected,
            accepted: window.editorTour.accepted
          }
        })
        samples++
        seen.add(sample.scene)
        heights.push(sample.height)
        if (sample.scene === 'complete' && previous === 'color') resets++
        previous = sample.scene
        if (sample.clips.length) clips.push({ scene: sample.scene, progress: sample.progress, clips: sample.clips })
        assert.equal(sample.overflow, false, `${label}: no page overflow`)
        assert.ok(Math.abs(sample.y - original.y) < 1, `${label}: the window stays anchored`)
        if (screenshots && !saved.has(sample.scene) && sample.progress > .42 && sample.progress < .8) {
          await frame.screenshot({ path: `${screenshots}/${label}-${sample.scene}.png` })
          saved.add(sample.scene)
        }
        if (Date.now() - lastLog > 20000) {
          lastLog = Date.now()
          console.log(JSON.stringify({ label, scene: sample.scene, progress: sample.progress, resets, samples, seconds: Math.round((Date.now() - began) / 1000) }))
        }
      }
      assert.deepEqual([...seen].sort(), ['color', 'complete', 'highlight', 'hover'])
      assert.ok(Math.max(...heights) - Math.min(...heights) < 1, `${label}: all scene heights match`)
      assert.deepEqual(clips, [], `${label}: floating panes stay inside the editor`)
      const result = await page.evaluate(() => window.editorTour)
      assert.equal(result.accepted, true, 'the manifest completion was accepted')
      assert.equal(result.selected, true, 'the next tour selects the accepted class before replacing it')
      assert.deepEqual(errors, [])
      console.log(JSON.stringify({ label, result: 'passed', samples, resets, seconds: Math.round((Date.now() - began) / 1000), height: original.height }))
    } finally { await context.close() }
  })
}
