import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { createCompiler } from '../../../../packages/compiler/dist/index.js'
import { createCompilerBindingSession } from '../../../../packages/binding/dist/compiler-binding.js'
import { compileManifestFileSync } from '../../../../packages/compiler/dist/node.js'
import { compileRenderedStylesheet } from '../../../../packages/compiler/dist/stylesheet/index-public.js'
const require = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))
const browsers = require('@playwright/test')
const cases = [
  { id: 'compose-before-native', entry: "@import './local.css';@utilities{paint{color:red}}", local: '.example{@compose paint;}.example{color:blue}', referenceEntry: "@import './local.css';", referenceLocal: '.example{color:red}.example{color:blue}', expected: 'blue' },
  { id: 'compose-in-conditional-layer', entry: "@import './local.css' layer(shared) supports(display:grid) screen;@utilities{paint{color:red}}", local: '.example{@compose paint;}', referenceEntry: "@import './local.css' layer(shared) supports(display:grid) screen;", referenceLocal: '.example{color:red}', expected: 'red', printExpected: 'black' },
  { id: 'compose-cross-file-override', entry: "@import './local.css';@utilities{paint{color:blue}}", local: '@utilities{paint{color:red}}.example{@compose paint;}', referenceEntry: "@import './local.css';", referenceLocal: '.example{color:blue}', expected: 'blue' }
]
const root = mkdtempSync(join(tmpdir(), 'master-legacy-import-position-')), sessions = {}, compilers = {}
const options = { baseManifest: { version: 1, utilities: [] }, preserveNativeCSS: true }
const rows = [], failures = []
try {
  for (const binding of ['native', 'wasm']) { sessions[binding] = await createCompilerBindingSession({ binding });compilers[binding] = await createCompiler({ binding }) }
  for (const entry of cases) {
    const main = join(root, 'entry.css'), local = join(root, 'local.css')
    writeFileSync(main, entry.entry);writeFileSync(local, entry.local)
    const graph = { entry: main, files: { [main]: entry.entry, [local]: entry.local }, edges: [{ from: main, specifier: './local.css', resolved: local }] }
    const css = {}, flattened = {}
    for (const binding of ['native', 'wasm']) {
      try { flattened[binding] = sessions[binding].resolveCSSImportGraph(graph).source;css['legacy-' + binding] = compilers[binding].compileManifest(flattened[binding], { ...options, from: main }).css }
      catch (error) { failures.push({ id: entry.id, binding, error: error.message }) }
    }
    assert.equal(flattened.wasm, flattened.native, entry.id + ' resolved source parity')
    if (css['legacy-native'] !== undefined) assert.equal(css['legacy-wasm'], css['legacy-native'], entry.id + ' compiled parity')
    for (const [method, compile] of [
      ['legacy-file', () => compileManifestFileSync(main, options)],
      ['rendered-source', () => compileRenderedStylesheet(main, entry.entry, options)]
    ]) {
      try { css[method] = (await compile()).css }
      catch (error) { failures.push({ id: entry.id, method, error: error.message }) }
    }
    rows.push({ ...entry, css });console.log(JSON.stringify({ id: entry.id, flattened: flattened.native, css }))
  }
} finally { Object.values(sessions).forEach(value => value.dispose());Object.values(compilers).forEach(value => value.dispose());rmSync(root, { recursive: true, force: true }) }
let observations = 0, controls = 0
for (const browserName of ['chromium', 'firefox', 'webkit']) {
  const browser = await browsers[browserName].launch()
  try {
    for (const entry of rows) for (const media of ['screen', 'print']) for (const method of ['author', ...Object.keys(entry.css)]) {
      const page = await browser.newPage()
      try {
        await page.emulateMedia({ media })
        await page.route('**/*', route => {
          const path = new URL(route.request().url()).pathname
          if (path === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><style>body{color:black}</style><link rel="stylesheet" href="/entry.css"><div class="example">Probe</div>' })
          if (path === '/entry.css') return route.fulfill({ contentType: 'text/css', body: method === 'author' ? entry.referenceEntry : entry.css[method] })
          if (path === '/local.css' && method === 'author') return route.fulfill({ contentType: 'text/css', body: entry.referenceLocal })
          throw new Error(`Unexpected stylesheet request: ${path}`)
        })
        await page.goto('http://legacy-compose.test/', { waitUntil: 'load' })
        const actual = await page.locator('.example').evaluate(element => getComputedStyle(element).color)
        const expected = { red: 'rgb(255, 0, 0)', blue: 'rgb(0, 0, 255)', black: 'rgb(0, 0, 0)' }[media === 'print' ? entry.printExpected ?? entry.expected : entry.expected]
        const pass = actual === expected
        const record = { id: entry.id, browser: browserName, media, method, actual, expected, pass }
        if (method === 'author') { assert(pass, 'Original authored CSS control');controls++ }
        else { observations++;if (!pass) failures.push(record) }
        console.log(JSON.stringify(record))
      } finally { await page.close() }
    }
  } finally { await browser.close() }
}
console.log(JSON.stringify({ original0114Cases: cases.length, consumers: 4, controls, observations, failures }))
process.exitCode = failures.length ? 1 : 0
