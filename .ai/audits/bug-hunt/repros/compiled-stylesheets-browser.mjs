import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createCompiler } from '../../../../packages/compiler/dist/index.js'

const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const cases = JSON.parse(readFileSync(new URL('../../../../crates/mastercss-compiler/tests/bug_hunt_stylesheet_graph.json', import.meta.url)))
cases.push(
  { id: 'compose-before-native', entry: "@import './local.css';@utilities{paint{color:red}}", local: '.example{@compose paint;}.example{color:blue}', referenceEntry: "@import './local.css';", referenceLocal: '.example{color:red}.example{color:blue}', expected: 'blue' },
  { id: 'compose-in-conditional-layer', entry: "@import './local.css' layer(shared) supports(display:grid) screen;@utilities{paint{color:red}}", local: '.example{@compose paint;}', referenceEntry: "@import './local.css' layer(shared) supports(display:grid) screen;", referenceLocal: '.example{color:red}', expected: 'red', printExpected: 'black' },
  { id: 'compose-cross-file-override', entry: "@import './local.css';@utilities{paint{color:blue}}", local: '@utilities{paint{color:red}}.example{@compose paint;}', referenceEntry: "@import './local.css';", referenceLocal: '.example{color:blue}', expected: 'blue' }
)
const wasmBytes = readFileSync(new URL('../../../../packages/binding-wasm-compiler/artifacts/mastercss_binding_wasm_compiler_bg.wasm', import.meta.url))
const compiled = new Map()
const native = await createCompiler({ binding: 'native' })
const wasm = await createCompiler({ binding: 'wasm', wasm: { input: wasmBytes } })
try {
  for (const test of cases) {
    const request = { inlineImports: process.env.BH_INLINE_IMPORTS === '1', graph: { entry: 'entry', files: { entry: test.entry, local: test.local || '.example{color:red}' }, edges: [{ from: 'entry', specifier: './local.css', resolved: 'local' }] }, urls: { entry: '/delivered/entry.css', local: '/delivered/local.css' }, baseManifest: { version: 1, utilities: [] }, options: { classes: ['example'] } }
    const result = native.compileStylesheets(request)
    assert.deepEqual(wasm.compileStylesheets(request), result, `${test.id}: public native/Wasm parity`)
    compiled.set(test.id, result)
    console.log(JSON.stringify({ id: test.id, parity: 'PASS', assets: result.stylesheets.length }))
  }
} finally { native.dispose(); wasm.dispose() }
let comparisons = 0
for (const name of (process.env.BH_BROWSERS || 'chromium,firefox,webkit').split(',')) {
  // A browser that cannot launch must not hide the ones after it.
  let browser
  try { browser = await browsers[name].launch() } catch (error) { console.log(JSON.stringify({ browser: name, launched: false, error: String(error).split('\n')[0] }));continue }
  try {
    for (const test of cases) for (const media of ['screen', 'print']) {
      const colors = {}
      for (const version of ['original', 'compiled']) {
        const page = await browser.newPage()
        try {
          await page.emulateMedia({ media })
          await page.route('**/*', route => {
            const url = new URL(route.request().url())
            if (url.hostname === 'remote.test') return route.fulfill({ contentType: 'text/css', body: test.remote || '.example{color:blue}' })
            if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: `<!doctype html><link rel="stylesheet" href="${version === 'compiled' ? '/delivered/entry.css' : '/entry.css'}"><div class="example">test</div>` })
            const sources = version === 'compiled' ? Object.fromEntries(compiled.get(test.id).stylesheets.map(asset => [asset.href, asset.css])) : { '/entry.css': test.referenceEntry || test.entry, '/local.css': test.referenceLocal || test.local || '.example{color:red}' }
            assert(url.pathname in sources, url.pathname)
            return route.fulfill({ contentType: 'text/css', body: sources[url.pathname] })
          })
          await page.goto('http://compiled-stylesheets.test/', { waitUntil: 'load' })
          colors[version] = await page.locator('.example').evaluate(element => getComputedStyle(element).color)
        } finally { await page.close() }
      }
      const expected = { red: 'rgb(255, 0, 0)', blue: 'rgb(0, 0, 255)', black: 'rgb(0, 0, 0)' }[media === 'print' ? test.printExpected || test.expected : test.expected]
      assert.equal(colors.original, expected, `${name}/${test.id}/${media}: author control`)
      assert.equal(colors.compiled, expected, `${name}/${test.id}/${media}: public compiled output`)
      comparisons++
      console.log(JSON.stringify({ browser: name, id: test.id, media, ...colors, result: 'PASS' }))
    }
  } finally { await browser.close() }
}
console.log(JSON.stringify({ inlineImports: process.env.BH_INLINE_IMPORTS === '1', cases: cases.length, comparisons, failures: 0, scope: 'Public compileStylesheets; existing file/project/build/CLI entrypoints still require integration' }))
