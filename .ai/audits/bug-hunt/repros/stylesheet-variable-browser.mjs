import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createRenderBindingSession } from '../../../../packages/binding/src/engine-binding.ts'
import { compileRenderedStylesheet } from '../../../../packages/compiler/src/stylesheet/index.ts'

const cases = JSON.parse(readFileSync(new URL('../../../../crates/mastercss-render/tests/bug_hunt_variable_syntax.json', import.meta.url), 'utf8'))
const input = readFileSync(new URL('../../../../packages/binding-wasm-engine/artifacts/mastercss_binding_wasm_engine_bg.wasm', import.meta.url))
const manifest = {
  version: 1, utilities: [],
  variables: {
    color: [{ key: 'brand', value: 'red' }, { key: 'accent', value: 'blue' }, { key: '品牌', value: 'red' }],
    animation: [{ key: 'entrance', value: 'fade 1s' }]
  },
  animations: { fade: { to: { opacity: '1' } } }
}
const authorResources = ':root{--color-brand:red;--color-accent:blue;--color-品牌:red;--animation-entrance:fade 1s}@keyframes fade{to{opacity:1}}'
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
let failures = 0
for (const browserName of ['chromium', 'firefox', 'webkit']) {
  const browser = await browsers[browserName].launch()
  try {
    const page = await browser.newPage()
    for (const test of cases) {
      const outputs = {}
      for (const binding of ['native', 'wasm']) {
        const session = await createRenderBindingSession({ manifest }, { binding, wasm: { input } })
        try {
          session.ensureStylesheetResources(test.css)
          outputs[binding] = { text: session.snapshot().snapshot.text, globals: session.emittedGlobals() }
        } finally { session.dispose() }
      }
      assert.deepEqual(outputs.native, outputs.wasm, `${test.id}: binding parity`)
      assert.deepEqual(Object.keys(outputs.native.globals.variables).sort(), test.variables, `${test.id}: variable references`)
      let compiled, compilerError
      try { compiled = await compileRenderedStylesheet('/audit.css', test.css, { baseManifest: manifest }) }
      catch (error) { compilerError = error.code; if (!compilerError) throw error }
      assert.equal(compilerError, test.compilerError, `${test.id}: compiler rejection contract`)
      await page.setContent('<!doctype html><style>body{color:black}</style><div class="x">probe</div>')
      const results = {}
      const surfaces = { author: authorResources + test.css, renderer: outputs.native.text + test.css }
      if (compiled) surfaces.compiler = compiled.css
      for (const [surface, css] of Object.entries(surfaces)) {
        results[surface] = await page.evaluate(css => {
          const sheet = new CSSStyleSheet()
          sheet.replaceSync(css)
          document.adoptedStyleSheets = [sheet]
          const element = document.querySelector('.x')
          const style = getComputedStyle(element)
          const result = { color: style.color, animation: style.animationName }
          element.style.animationDuration = '1000s'
          element.style.animationFillMode = 'both'
          result.running = element.getAnimations().map(animation => animation.animationName)
          element.removeAttribute('style')
          return result
        }, css)
      }
      const expected = { color: test.color, animation: test.animation, running: test.animation === 'none' ? [] : [test.animation] }
      assert.deepEqual(results.author, expected, `${browserName}: native CSS control ${test.id}`)
      const pass = [results.renderer, ...(compiled ? [results.compiler] : [])].every(result => JSON.stringify(result) === JSON.stringify(expected))
      if (!pass) failures++
      console.log(JSON.stringify({ browser: browserName, id: test.id, css: test.css, variables: test.variables, expected, compilerError, parity: 'PASS', ...results, text: outputs.native.text, result: pass ? 'PASS' : 'FAIL' }))
    }
  } finally { await browser.close() }
}
assert.equal(failures, 0, 'Raw renderer and public compiler CSS must match native browser controls')
