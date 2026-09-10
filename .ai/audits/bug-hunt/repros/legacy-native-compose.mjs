import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { createCompiler } from '../../../../packages/compiler/dist/index.js'
import { compileManifestSync, compileManifestFileSync } from '../../../../packages/compiler/dist/node.js'
import { compileRenderedStylesheet } from '../../../../packages/compiler/dist/stylesheet/index-public.js'
const require = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))
const browsers = require('@playwright/test')
const definitions = '@utilities{paint{color:red}green{color:green}priority{color:red!important}}'
const cases = [
  ['before-native', '.example{@compose paint;}.example{color:blue}', '.example{color:red}.example{color:blue}', 'blue'],
  ['after-native', '.example{color:blue}.example{@compose paint;}', '.example{color:blue}.example{color:red}', 'red'],
  ['interleaved', '.example{@compose paint;}.example{color:blue}.example{@compose green;}', '.example{color:red}.example{color:blue}.example{color:green}', 'green'],
  ['declaration-before', '.example{color:blue;@compose paint;}', '.example{color:blue;color:red}', 'red'],
  ['declaration-after', '.example{color:blue;@compose paint;color:green}', '.example{color:blue;color:red;color:green}', 'green'],
  ['later-important', '.example{@compose paint;}.example{color:blue!important}', '.example{color:red}.example{color:blue!important}', 'blue'],
  ['earlier-important', '.example{@compose priority;}.example{color:blue}', '.example{color:red!important}.example{color:blue}', 'red'],
  ['anonymous-layer', '@layer{.example{@compose paint;}.example{color:blue}}', '@layer{.example{color:red}.example{color:blue}}', 'blue'],
  ['important-layer-order', '@layer first,second;@layer first{.example{@compose priority;}}@layer second{.example{color:blue!important}}', '@layer first,second;@layer first{.example{color:red!important}}@layer second{.example{color:blue!important}}', 'red'],
  ['screen-container', '@media screen{.example{@compose paint;}.example{color:blue}}', '@media screen{.example{color:red}.example{color:blue}}', 'blue', 'black'],
  ['false-supports', '@supports(display:invalid-value){.example{@compose paint;}}', '@supports(display:invalid-value){.example{color:red}}', 'black'],
  ['selector-list', '.example,.other{@compose paint;}.example{color:blue}', '.example,.other{color:red}.example{color:blue}', 'blue']
]
const root = mkdtempSync(join(tmpdir(), 'master-legacy-compose-browser-'))
const native = await createCompiler({ binding: 'native' }), wasm = await createCompiler({ binding: 'wasm' })
const outputs = new Map(), errors = []
try {
  for (const [name, body, reference, expected, printExpected] of cases) {
    const source = definitions + body, file = join(root, name + '.css'), options = { baseManifest: { version: 1, utilities: [] }, preserveNativeCSS: true, from: file }
    writeFileSync(file, source)
    const methods = {
      'public-native': () => native.compileManifest(source, options),
      'public-wasm': () => wasm.compileManifest(source, options),
      'sync-source': () => compileManifestSync(source, options),
      'legacy-file': () => compileManifestFileSync(file, options),
      'rendered-source': () => compileRenderedStylesheet(file, source, options)
    }
    const css = {}
    for (const [method, compile] of Object.entries(methods)) {
      try { css[method] = (await compile()).css }
      catch (error) { const row = { name, method, error: error.message };errors.push(row);console.log(JSON.stringify(row)) }
    }
    if ('public-native' in css && 'public-wasm' in css) assert.equal(css['public-wasm'], css['public-native'], name + ' parity')
    outputs.set(name, { reference, expected, printExpected: printExpected ?? expected, css })
  }
} finally { native.dispose();wasm.dispose();rmSync(root, { recursive: true, force: true }) }
const color = { red: 'rgb(255, 0, 0)', blue: 'rgb(0, 0, 255)', green: 'rgb(0, 128, 0)', black: 'rgb(0, 0, 0)' }
let observations = 0, failures = errors.length, controls = 0
for (const browserName of ['chromium', 'firefox', 'webkit']) {
  const browser = await browsers[browserName].launch()
  try {
    const page = await browser.newPage()
    for (const [name, entry] of outputs) for (const media of ['screen', 'print']) {
      await page.emulateMedia({ media })
      const expected = color[media === 'print' ? entry.printExpected : entry.expected]
      for (const [method, css] of Object.entries({ author: entry.reference, ...entry.css })) {
        await page.setContent(`<style>body{color:black}${css}</style><div class="example">Probe</div>`)
        const actual = await page.locator('.example').evaluate(element => getComputedStyle(element).color)
        const pass = actual === expected
        if (method === 'author') { assert(pass, `${browserName}/${name}/${media}: author control ${actual} vs ${expected}`);controls++ }
        else { observations++;if (!pass) failures++ }
        console.log(JSON.stringify({ browser: browserName, name, media, method, actual, expected, pass }))
      }
    }
  } finally { await browser.close() }
}
console.log(JSON.stringify({ cases: cases.length, consumers: 5, controls, observations, failures, scope: 'Original direct source/native compose placement; no compileStylesheets substitute, no claim about unresolved external import delivery' }))
process.exitCode = failures ? 1 : 0
