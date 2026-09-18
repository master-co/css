import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { createCompilerBindingSession } from '../../../../packages/compiler/src/session.ts'
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const remote = "@import 'https://remote.test/external.css'"
const cases = [
  { id: 'external-first', entry: `${remote};@import './local.css';`, expected: 'red' },
  { id: 'external-last', entry: `@import './local.css';${remote};`, expected: 'blue' },
  { id: 'same-layer', entry: `@import './local.css' layer(shared);${remote} layer(shared);`, expected: 'blue' },
  { id: 'different-layers', entry: `@import './local.css' layer(a);${remote} layer(b);`, expected: 'blue' },
  { id: 'predeclared-layers', entry: `@layer a,b;@import './local.css' layer(a);${remote} layer(b);`, expected: 'blue' },
  { id: 'conditional-local', entry: `@import './local.css' print;${remote};`, expected: 'blue' },
  { id: 'nested-plain', entry: "@import './local.css';", local: `${remote};.example{color:red}`, expected: 'red' },
  { id: 'nested-named', entry: "@import './local.css' layer(outer);", local: `${remote} layer(inner);.example{color:red}`, expected: 'red' },
  { id: 'nested-anonymous', entry: "@import './local.css' layer;", local: `${remote};.example{color:red}`, expected: 'red' },
  { id: 'nested-supports-media', entry: "@import './local.css' supports(display:grid) screen;", local: `${remote};.example{color:red}`, expected: 'red', printExpected: 'black' }
]
const compiler = await createCompilerBindingSession({ binding: 'native' })
try {
  for (const test of cases) {
    try {
      const graph = compiler.resolveCSSImportGraph({ entry: 'entry', files: { entry: test.entry, local: test.local || '.example{color:red}' }, edges: [{ from: 'entry', specifier: './local.css', resolved: 'local' }] })
      test.graph = graph.source
      test.compiled = compiler.compileCSS(graph.source, { preserveNativeCSS: true, classes: ['example'] }).css
    } catch (error) { test.error = { code: error.code, message: error.message } }
  }
} finally { compiler.dispose() }
const wasm = await createCompilerBindingSession({ binding: 'wasm', wasm: { input: readFileSync(new URL('../../../../packages/binding-wasm-compiler/artifacts/mastercss_binding_wasm_compiler_bg.wasm', import.meta.url)) } })
try {
  for (const test of cases) {
    let graph, compiled, error
    try {
      graph = wasm.resolveCSSImportGraph({ entry: 'entry', files: { entry: test.entry, local: test.local || '.example{color:red}' }, edges: [{ from: 'entry', specifier: './local.css', resolved: 'local' }] }).source
      compiled = wasm.compileCSS(graph, { preserveNativeCSS: true, classes: ['example'] }).css
    } catch (failure) { error = { code: failure.code, message: failure.message } }
    assert.deepEqual({ graph, compiled, error }, { graph: test.graph, compiled: test.compiled, error: test.error }, `${test.id}: native/Wasm parity`)
    console.log(JSON.stringify({ bindingParity: 'PASS', id: test.id, graph, compiled, error }))
  }
} finally { wasm.dispose() }
let failures = 0
// A browser that cannot launch must not hide the browsers after it; record the
// environment failure and carry on so the remaining engines still report.
const browserFailures = []
for (const name of (process.env.BH_IMPORT_ORDER_BROWSERS || 'chromium,firefox,webkit').split(',')) {
  let browser
  try { browser = await browsers[name].launch() } catch (error) {
    browserFailures.push({ browser: name, error: String(error).split('\n')[0] })
    console.log(JSON.stringify({ browser: name, launched: false, error: String(error).split('\n')[0] }))
    continue
  }
  try {
    for (const test of cases) {
      for (const media of ['screen', 'print']) {
        const colors = {}
        for (const version of ['original', ...(test.error ? [] : ['compiled'])]) {
          const page = await browser.newPage()
          try {
            await page.emulateMedia({ media })
            await page.route('**/*', route => {
              const url = new URL(route.request().url())
              if (url.hostname === 'remote.test') return route.fulfill({ contentType: 'text/css', body: '.example{color:blue}' })
              const sources = { '/entry.css': version === 'compiled' ? test.compiled : test.entry, '/local.css': test.local || '.example{color:red}' }
              if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><link rel="stylesheet" href="/entry.css"><div class="example">test</div>' })
              assert(url.pathname in sources, url.pathname)
              return route.fulfill({ contentType: 'text/css', body: sources[url.pathname] })
            })
            await page.goto('http://import-order.test/', { waitUntil: 'load' })
            colors[version] = await page.locator('.example').evaluate(element => getComputedStyle(element).color)
          } finally { await page.close() }
        }
        const expected = { red: 'rgb(255, 0, 0)', blue: 'rgb(0, 0, 255)', black: 'rgb(0, 0, 0)' }[media === 'print' ? test.printExpected || test.expected : test.expected]
        assert.equal(colors.original, expected, `${name}/${test.id}/${media}: browser source control`)
        const pass = !test.error && colors.compiled === colors.original
        if (!pass) failures++
        console.log(JSON.stringify({ browser: name, id: test.id, media, ...colors, expected, graph: test.graph, compiled: test.compiled, error: test.error, result: pass ? 'PASS' : 'FAIL' }))
      }
    }
  } finally { await browser.close() }
}
const launched = (process.env.BH_IMPORT_ORDER_BROWSERS || 'chromium,firefox,webkit').split(',').length - browserFailures.length
console.log(JSON.stringify({ cases: cases.length, browsers: launched, browserFailures, comparisons: cases.length * 2 * launched, failures }))
assert.equal(failures, 0, 'External import order/conditions must preserve original browser behavior')
