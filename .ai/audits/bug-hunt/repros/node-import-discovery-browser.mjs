import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { compileManifestFileSync } from '../../../../packages/compiler/src/node.ts'
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const cases = [
  { id: 'bare-local', source: '@import "child.css";', filename: 'child.css' },
  { id: 'bare-encoded', source: '@import "child%20%23.css?version=1#style";', filename: 'child #.css' },
  { id: 'uppercase', source: '@IMPORT "./child.css" print;', filename: 'child.css', screen: 'black', print: 'red' },
  { id: 'escaped', source: '@\\69mport u\\72l("./ch\\69ld.css") layer(theme) supports(display:grid) screen;', filename: 'child.css', screen: 'red', print: 'black' },
  { id: 'encoded-path-query', source: '@import "./child%20%23.css?version=1#style";', filename: 'child #.css' },
  { id: 'encoded-extension', source: '@import "./child%2Ecss";', filename: 'child.css' },
  { id: 'reference-query', source: '@reference "./child%20%23.css?version=1#context";.example{@compose paint;}', filename: 'child #.css', reference: true }
]
const root = mkdtempSync(join(tmpdir(), 'master-css-0116-browser-'))
let comparisons = 0
try {
  for (const test of cases) {
    const entry = join(root, 'entry.css')
    const child = join(root, test.filename)
    writeFileSync(entry, test.source)
    writeFileSync(child, test.reference ? '@utilities{paint{color:red}}.reference-only{color:blue}' : '.example{color:red}')
    const result = compileManifestFileSync(entry, { baseManifest: { version: 1, utilities: [] }, preserveNativeCSS: true })
    assert.deepEqual(result.dependencies, [entry, child])
    assert(!result.css.includes('reference-only'))
    test.compiled = result.css
  }
  for (const name of ['chromium', 'firefox', 'webkit']) {
    const browser = await browsers[name].launch()
    try {
      for (const test of cases) for (const media of ['screen', 'print']) {
        const colors = {}
        for (const version of ['reference', 'compiled']) {
          const page = await browser.newPage()
          try {
            await page.emulateMedia({ media })
            await page.route('**/*', route => {
              const url = new URL(route.request().url())
              if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: '<link rel="stylesheet" href="/entry.css"><div class="example">test</div>' })
              if (url.pathname === '/entry.css') return route.fulfill({ contentType: 'text/css', body: version === 'compiled' ? test.compiled : test.reference ? '.example{color:red}' : test.source })
              assert.equal(decodeURIComponent(url.pathname), `/${test.filename}`)
              return route.fulfill({ contentType: 'text/css', body: '.example{color:red}' })
            })
            await page.goto('http://file-imports.test/', { waitUntil: 'load' })
            colors[version] = await page.locator('.example').evaluate(element => getComputedStyle(element).color)
          } finally { await page.close() }
        }
        const expected = (test[media] || 'red') === 'red' ? 'rgb(255, 0, 0)' : 'rgb(0, 0, 0)'
        assert.equal(colors.reference, expected, `${name}/${test.id}/${media}: native author control`)
        assert.equal(colors.compiled, expected, `${name}/${test.id}/${media}: existing file compiler`)
        comparisons++
        console.log(JSON.stringify({ browser: name, id: test.id, media, ...colors, result: 'PASS' }))
      }
    } finally { await browser.close() }
  }
} finally { rmSync(root, { recursive: true, force: true }) }
console.log(JSON.stringify({ cases: cases.length, comparisons, failures: 0, scope: 'Existing compileManifestFileSync; full stylesheet asset delivery still unfinished' }))
