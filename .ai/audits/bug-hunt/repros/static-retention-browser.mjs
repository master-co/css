import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createEngineBindingSession } from '../../../../packages/binding/src/engine-binding.ts'
import { compileRenderedStylesheet } from '../../../../packages/compiler/src/stylesheet/index.ts'
const cases = JSON.parse(readFileSync(new URL('../../../../packages/compiler/tests/bug-hunt-static-retention.json', import.meta.url)))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const input = readFileSync(new URL('../../../../packages/binding-wasm-engine/artifacts/mastercss_binding_wasm_engine_bg.wasm', import.meta.url))
const controls = []
for (const entry of cases) {
  const compiled = await compileRenderedStylesheet('/static.css', entry.css, { baseManifest: { version: 1, utilities: [] } })
  const results = {}
  for (const binding of ['native', 'wasm']) {
    const engine = await createEngineBindingSession({ manifest: compiled.manifest }, { binding, wasm: { input } })
    try {
      const initial = engine.snapshot()
      assert.deepEqual(initial.resources.variables.map(v => v.name).sort(), entry.names)
      engine.ensureClassRules(['fg:brand'])
      const ensured = engine.snapshot()
      engine.deleteClassRules(['fg:brand'])
      const deleted = engine.snapshot()
      assert.deepEqual(deleted, initial)
      results[binding] = { initial, ensured, deleted }
      const hydrated = await createEngineBindingSession({ manifest: compiled.manifest, emittedGlobals: compiled.emittedGlobals }, { binding, wasm: { input } })
      try { assert.equal(hydrated.snapshot().text, '') } finally { hydrated.dispose() }
    } finally { engine.dispose() }
  }
  assert.deepEqual(results.native, results.wasm)
  controls.push({ entry, css: { compiled: compiled.css, ...Object.fromEntries(Object.entries(results.native).map(([name, value]) => [name, value.text])) } })
}
for (const name of ['chromium', 'firefox', 'webkit']) {
  const browser = await browsers[name].launch()
  try {
    const page = await browser.newPage()
    for (const { entry, css } of controls) {
      for (const [mode, expected] of [['', entry.color], ...(entry.darkColor ? [['dark', entry.darkColor]] : [])]) {
        await page.setContent(`<html class="${mode}"><head></head><body><div class="probe">probe</div></body></html>`)
        for (const [phase, text] of Object.entries(css)) {
          const actual = await page.evaluate(({ text, phase }) => {
            const sheet = new CSSStyleSheet()
            sheet.replaceSync(text + '.probe{color:var(--color-brand,green)}')
            document.adoptedStyleSheets = [sheet]
            const probe = document.querySelector('.probe')
            probe.classList.toggle('fg:brand', phase === 'ensured')
            return getComputedStyle(probe).color
          }, { text, phase })
          assert.equal(actual, expected, `${name}/${entry.id}/${mode}/${phase}`)
          console.log(JSON.stringify({ browser: name, id: entry.id, mode, phase, expected, actual, parity: 'PASS', result: 'PASS' }))
        }
      }
    }
  } finally { await browser.close() }
}
