import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { createRenderBindingSession } from '../../../../packages/binding/src/engine-binding.ts'
import { compileRenderedStylesheet } from '../../../../packages/compiler/src/stylesheet/index.ts'

const cases = JSON.parse(readFileSync(new URL('../../../../crates/mastercss-render/tests/bug_hunt_animation_variables.json', import.meta.url), 'utf8'))
const wasm = readFileSync(new URL('../../../../packages/binding-wasm-engine/artifacts/mastercss_binding_wasm_engine_bg.wasm', import.meta.url))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
let failures = 0
for (const browserName of ['chromium', 'firefox', 'webkit']) {
  const browser = await browsers[browserName].launch()
  try {
    const page = await browser.newPage()
    for (const test of cases) {
      const manifest = {
        version: 1, settings: { modes: ['dark'] }, utilities: [], variables: { animation: test.variables },
        animations: Object.fromEntries(['fade', 'linear', 'running'].map(name => [name, { to: { opacity: '1' } }]))
      }
      const outputs = {}
      for (const binding of ['native', 'wasm']) {
        const session = await createRenderBindingSession({ manifest }, { binding, wasm: { input: wasm } })
        try {
          session.ensureStylesheetResources(test.css)
          outputs[binding] = { text: session.snapshot().snapshot.text, globals: session.emittedGlobals() }
        } finally { session.dispose() }
      }
      assert.deepEqual(outputs.native, outputs.wasm, `${test.id}: binding parity`)
      const compiled = await compileRenderedStylesheet('/audit.css', test.css, { baseManifest: manifest })
      for (const [mode, expected] of Object.entries(test.controls)) {
        await page.emulateMedia({ colorScheme: mode === 'dark' ? 'dark' : 'light' })
        await page.setContent('<!doctype html><div class="x">probe</div>')
        const actual = await page.evaluate(({ text, css, mode, compilerCSS }) => {
          document.documentElement.className = mode
          const raw = new CSSStyleSheet()
          raw.replaceSync(text + css)
          document.adoptedStyleSheets = [raw]
          const element = document.querySelector('.x')
          const names = () => getComputedStyle(element).animationName.split(',').map(name => name.trim().replace(/^['"]|['"]$/g, '')).filter(name => name !== 'none').sort()
          const animationNames = names()
          element.style.animationDuration = '1000s'
          element.style.animationFillMode = 'both'
          const running = element.getAnimations().map(animation => animation.animationName).sort()
          const definitions = [...raw.cssRules].filter(rule => rule.type === CSSRule.KEYFRAMES_RULE).map(rule => rule.name).sort()
          const compiledSheet = new CSSStyleSheet()
          compiledSheet.replaceSync(compilerCSS)
          document.adoptedStyleSheets = [compiledSheet]
          const compilerNames = names()
          const compilerRunning = element.getAnimations().map(animation => animation.animationName).sort()
          return { animationNames, running, definitions, compilerNames, compilerRunning }
        }, { text: outputs.native.text, css: test.css, mode, compilerCSS: compiled.css })
        const sorted = [...expected].sort()
        const pass = ['animationNames', 'running', 'compilerNames', 'compilerRunning'].every(key => JSON.stringify(actual[key]) === JSON.stringify(sorted))
          && JSON.stringify(actual.definitions) === JSON.stringify(test.retained)
        if (!pass) failures++
        console.log(JSON.stringify({ browser: browserName, id: test.id, mode, expected: sorted, retained: test.retained, parity: 'PASS', ...actual, text: outputs.native.text, result: pass ? 'PASS' : 'FAIL' }))
      }
    }
  } finally { await browser.close() }
}
assert.equal(failures, 0, 'Variable expansion and browser animation behavior must agree')
