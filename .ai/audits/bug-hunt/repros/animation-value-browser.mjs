import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createRenderBindingSession } from '../../../../packages/binding/src/engine-binding.ts'

const source = readFileSync(new URL('../../../../crates/mastercss-render/tests/bug_hunt_animation_value_slots.rs', import.meta.url), 'utf8')
const pattern = /animation_value_case!\(\s*(\w+),\s*("(?:\\.|[^"\\])*"),\s*("(?:\\.|[^"\\])*"),?\s*\);/g
const cases = [...source.matchAll(pattern)].map(match => [match[1], JSON.parse(match[2]), JSON.parse(match[3])])
assert.equal(cases.length, 29)
const baseline = process.env.BASELINE_WASM
const wasm = readFileSync(baseline || new URL('../../../../packages/binding-wasm-engine/artifacts/mastercss_binding_wasm_engine_bg.wasm', import.meta.url))
const wasmHash = createHash('sha256').update(wasm).digest('hex')
if (baseline) {
  const before = JSON.parse(readFileSync(new URL('../evidence/0108-payload-before.json', import.meta.url), 'utf8'))
  assert.equal(wasmHash, before['packages/binding-wasm-engine/artifacts/mastercss_binding_wasm_engine_bg.wasm'].sha256)
}
const names = ['fade', 'linear', 'infinite', 'backwards']
const manifest = {
  version: 1,
  utilities: [],
  variables: { animation: [{ key: 'easing', value: 'linear' }] },
  animations: Object.fromEntries(names.map(name => [name, { to: { opacity: '1' } }]))
}
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
let mismatches = 0
for (const browserName of ['chromium', 'firefox', 'webkit']) {
  const browser = await browsers[browserName].launch()
  try {
    const page = await browser.newPage()
    for (const [id, value, expected] of cases) {
      const css = `.x{animation:${value}}`
      const results = {}
      for (const binding of baseline ? ['wasm'] : ['native', 'wasm']) {
        const session = await createRenderBindingSession({ manifest }, { binding, wasm: { input: wasm } })
        try {
          session.ensureStylesheetResources(css)
          results[binding] = { text: session.snapshot().snapshot.text, globals: session.emittedGlobals() }
        } finally { session.dispose() }
      }
      if (!baseline) assert.deepEqual(results.native, results.wasm, `${id}: native/Wasm parity`)
      const generated = results.wasm.text
      await page.setContent('<!doctype html><style>:root{--animation-easing:linear}</style><div class="x">probe</div>')
      const actual = await page.evaluate(({ css, generated, names, value }) => {
        const sheet = new CSSStyleSheet()
        sheet.replaceSync(css)
        document.adoptedStyleSheets = [sheet]
        const element = document.querySelector('.x')
        const animationName = getComputedStyle(element).animationName.replace(/^['"]|['"]$/g, '')
        const parsed = [...sheet.cssRules].map(rule => rule.cssText)
        const emitted = new CSSStyleSheet()
        emitted.replaceSync(generated)
        document.adoptedStyleSheets = [emitted, sheet]
        element.style.animationDuration = '1000s'
        element.style.animationFillMode = 'both'
        const running = element.getAnimations().map(animation => animation.animationName)
        const generatedNames = [...emitted.cssRules].filter(rule => rule.type === CSSRule.KEYFRAMES_RULE).map(rule => rule.name)
        return { animationName, parsed, generatedNames, running, syntaxSupported: CSS.supports('animation', value), needsGenerated: names.includes(animationName) }
      }, { css, generated, names, value })
      const browserExpected = id === 'auto_duration' && !actual.syntaxSupported ? 'none' : expected
      assert.equal(actual.animationName, browserExpected, `${browserName}: browser expectation ${id}`)
      const expectedNames = expected === 'none' ? [] : [expected]
      const pass = JSON.stringify(actual.generatedNames.sort()) === JSON.stringify(expectedNames)
        && JSON.stringify(actual.running.sort()) === JSON.stringify(browserExpected === 'none' ? [] : [browserExpected])
      if (!pass) mismatches++
      console.log(JSON.stringify({ browser: browserName, id, css, expected, browserExpected, baseline: !!baseline, wasmHash, parity: baseline ? 'not compared' : 'PASS', generated, ...actual, result: pass ? 'PASS' : 'FAIL' }))
    }
  } finally { await browser.close() }
}
assert.equal(mismatches, 0, 'Generated animation resources must agree with browser value parsing')
