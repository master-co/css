import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, basename, extname } from 'node:path'
const built = process.env.BUILT === '1'
const { compileManifestFileSync } = await import(built ? '../../../../packages/compiler/dist/node.js' : '../../../../packages/compiler/src/node.ts')
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
cases.push({ id: 'resource-relocation', entry: "@import './local.css';", local: ".example{color:red;background-image:url('./pixel.svg?version=1#icon')}", expected: 'red', resource: true })
const root = mkdtempSync(join(tmpdir(), 'master-css-file-browser-'))
let comparisons = 0
try {
  mkdirSync(join(root, 'out'))
  writeFileSync(join(root, 'pixel.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="red"/></svg>')
  for (const test of cases) {
    writeFileSync(join(root, 'entry.css'), test.entry)
    writeFileSync(join(root, 'local.css'), test.local || '.example{color:red}')
    const result = compileManifestFileSync(join(root, 'entry.css'), {
      root, baseManifest: { version: 1, utilities: [] }, preserveNativeCSS: true, classes: ['example'],
      delivery: { entryURL: '/out/main.css', stylesheetURL: file => '/out/' + basename(file), resourceURL: file => '/out/' + basename(file) }
    })
    for (const asset of result.resources) copyFileSync(asset.file, join(root, asset.href))
    for (const asset of result.stylesheets) writeFileSync(join(root, asset.href), asset.css)
    for (const name of ['chromium', 'firefox', 'webkit']) {
      const browser = await browsers[name].launch()
      try {
        for (const media of ['screen', 'print']) {
          const colors = {}
          for (const version of ['original', 'compiled']) {
            const page = await browser.newPage()
            const missing = [], errors = [], images = []
            try {
              await page.emulateMedia({ media })
              page.on('pageerror', error => errors.push(error.message))
              await page.route('**/*', route => {
                const url = new URL(route.request().url())
                if (url.hostname === 'remote.test') return route.fulfill({ contentType: 'text/css', body: '.example{color:blue}' })
                if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: `<link rel="stylesheet" href="${version === 'compiled' ? '/out/main.css' : '/entry.css'}"><div class="example" style="width:10px;height:10px">test</div>` })
                try {
                  const body = readFileSync(join(root, url.pathname))
                  if (url.pathname.endsWith('.svg')) images.push(url.pathname + url.search)
                  return route.fulfill({ contentType: extname(url.pathname) === '.svg' ? 'image/svg+xml' : 'text/css', body })
                } catch { missing.push(url.pathname); return route.fulfill({ status: 404, body: 'missing' }) }
              })
              await page.goto('http://file-delivery.test/', { waitUntil: 'load' })
              colors[version] = await page.locator('.example').evaluate(element => getComputedStyle(element).color)
              assert.deepEqual(missing, []); assert.deepEqual(errors, [])
              if (test.resource) assert(images.includes((version === 'compiled' ? '/out/' : '/') + 'pixel.svg?version=1'))
            } finally { await page.close() }
          }
          const expected = { red: 'rgb(255, 0, 0)', blue: 'rgb(0, 0, 255)', black: 'rgb(0, 0, 0)' }[media === 'print' ? test.printExpected || test.expected : test.expected]
          assert.equal(colors.original, expected)
          assert.equal(colors.compiled, colors.original, `${name}/${test.id}/${media}`)
          comparisons++
          console.log(JSON.stringify({ built, id: test.id, browser: name, media, colors, resource: test.resource || false, result: 'PASS' }))
        }
      } finally { await browser.close() }
    }
  }
  console.log(JSON.stringify({ built, cases: cases.length, comparisons, failures: 0, scope: 'actual public file API with explicit delivery URLs; host writes every returned CSS/resource asset' }))
} finally { rmSync(root, { recursive: true, force: true }) }
