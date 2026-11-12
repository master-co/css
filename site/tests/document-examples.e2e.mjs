/** Authored example relationships survive rendering, and disclosed code stays inside its owning tray. */
import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, webkit, firefox } from '@playwright/test'

const engine = process.env.MASTER_SITE_BROWSER ?? 'chromium'
const base = process.env.MASTER_SITE_URL ?? 'http://127.0.0.1:3218'
const evidence = path.resolve(process.env.MASTER_SITE_EVIDENCE ?? fileURLToPath(new URL('../test-results/document-examples', import.meta.url)))
const captures = []
let browser
before(async () => {
  await mkdir(evidence, { recursive: true })
  browser = await ({ chromium, webkit, firefox })[engine].launch()
})
after(async () => {
  await browser?.close()
  await writeFile(path.join(evidence, `${engine}-manifest.json`), JSON.stringify({ engine, base, captures }, null, 2) + '\n')
})

const profiles = [
  ...[390, 768, 1280].flatMap(width => ['light', 'dark'].map(scheme => ({ width, scheme, dpr: width === 390 ? 2 : 1 }))),
  { width: 320, scheme: 'light', dpr: 1, enlarged: true },
  { width: 1440, scheme: 'dark', dpr: 2, round: true },
]

for (const profile of profiles) test(`${engine} ${JSON.stringify(profile)}: grouped source and output remain contained`, { timeout: 90000 }, async () => {
  const context = await browser.newContext({ viewport: { width: profile.width, height: 900 }, colorScheme: profile.scheme, deviceScaleFactor: profile.dpr, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  try {
    for (const [route, count] of [['/reference/rules/layers', 6], ['/reference/tokens/text', 2], ['/guide/typography', 2]]) {
      assert.equal((await page.goto(base + route, { waitUntil: 'networkidle' })).status(), 200)
      await page.evaluate(() => document.fonts.ready)
      if (profile.enlarged) await page.addStyleTag({ content: 'html { font-size: 200% !important }' })
      if (profile.round) await page.addStyleTag({ content: ':root { --corner-shape: round !important; --corner-scale: 1 !important }' })
      const groups = page.locator('article figure.ui-tray:has(> details[data-generated])')
      assert.equal(await groups.count(), count, `${route}: one explicit group per authored example`)
      assert.equal(await page.locator('article > details[data-generated]').count(), 0, `${route}: output is not orphaned`)
      for (const [index, group] of (await groups.all()).entries()) {
        assert.equal(await group.locator('figcaption').count(), 0, `${route}: examples without captions have no empty footer`)
        const details = group.locator(':scope > details[data-generated]')
        const summary = details.locator('summary')
        assert.equal(await details.getAttribute('open'), null)
        await summary.focus()
        await page.keyboard.press('Space')
        assert.notEqual(await details.getAttribute('open'), null)
        const bounds = await group.evaluate(figure => {
          const outer = figure.getBoundingClientRect()
          const panels = [...figure.querySelectorAll('.code-panel')].map(panel => {
            const box = panel.getBoundingClientRect()
            return { left: box.left, right: box.right, width: box.width }
          })
          return { left: outer.left, right: outer.right, panels }
        })
        assert.ok(bounds.panels.length >= 2, `${route}: source and output both remain visible`)
        for (const panel of bounds.panels) {
          assert.ok(panel.width > 0, `${route}: code is rendered`)
          assert.ok(panel.left >= bounds.left - 1 && panel.right <= bounds.right + 1, `${route}: code stays within its tray: ${JSON.stringify(bounds)}`)
        }
        if (index === (route === '/reference/rules/layers' ? count - 1 : 0)) {
          const filename = `${engine}-${profile.width}-${profile.scheme}-dpr${profile.dpr}${profile.enlarged ? '-200pct' : ''}${profile.round ? '-round' : ''}-${route.split('/').pop()}-open.png`
          const focusFilename = filename.replace('-open.png', '-focus.png')
          await group.screenshot({ path: path.join(evidence, focusFilename), animations: 'disabled' })
          await summary.evaluate(element => element.blur())
          await group.screenshot({ path: path.join(evidence, filename), animations: 'disabled' })
          captures.push({ route, profile, state: 'generated output open, resting and keyboard-focused', filename, focusFilename, bounds })
          await summary.focus()
        }
        await page.keyboard.press('Space')
        assert.equal(await details.getAttribute('open'), null)
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
      assert.ok(overflow <= 1, `${route}: document does not overflow (${overflow}px)`)
    }
    assert.deepEqual(errors, [])
  } finally { await context.close() }
})

test(`${engine}: configuration, HTML and generated CSS stay together without JavaScript`, async () => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } })
  const page = await context.newPage()
  try {
    await page.goto(base + '/reference/rules/layers')
    const group = page.locator('figure.ui-tray').filter({ hasText: '@mixin --inset' })
    assert.equal(await group.count(), 1)
    assert.match(await group.textContent(), /card p\(8\)/)
    const details = group.locator('details[data-generated]')
    await details.locator('summary').click()
    assert.notEqual(await details.getAttribute('open'), null)
    assert.match(await details.textContent(), /padding:\s*1\.5rem/)
    assert.match(await details.textContent(), /padding:\s*calc\(8 \* 1px\)/)
  } finally { await context.close() }
})
