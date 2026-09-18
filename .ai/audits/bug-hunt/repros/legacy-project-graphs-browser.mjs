import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const moduleURL = process.env.MASTER_PROJECT_COMPILER_MODULE
  ? pathToFileURL(resolve(process.env.MASTER_PROJECT_COMPILER_MODULE))
  : new URL('../../../../packages/compiler/dist/node-compiler.js', import.meta.url)
const { compileProjectManifest } = await import(moduleURL.href)
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const root = mkdtempSync(join(tmpdir(), 'legacy-project-browser-'))
const cases = [], failures = []
try {
  for (const qualifier of ['', ' layer', ' layer(cards)', ' supports(display:grid)', ' print', ' layer(cards) supports(display:grid) print']) {
    for (const compose of [false, true]) {
      const source = `@import "./child.css"${qualifier};.after{margin:1px}`
      const child = '@utilities{paint{padding:2rem}}' + (compose ? '.composed{@compose paint;}' : '.composed{padding:2rem}') + '.card{padding:3rem}'
      writeFileSync(join(root, 'entry.css'), source)
      writeFileSync(join(root, 'child.css'), child)
      try {
        const result = compileProjectManifest([join(root, 'entry.css')], {
          root, baseManifest: { version: 1, utilities: [] }, preserveNativeCSS: true, classes: ['composed', 'card', 'after']
        })
        assert(result.manifest.utilities.some(utility => utility.name === 'paint'))
        assert(!/@import|@utilities|@compose/.test(result.css))
        cases.push({ qualifier, compose, css: result.css, reference: {
          '/entry.css': source, '/child.css': '.composed{padding:2rem}.card{padding:3rem}'
        } })
      } catch (error) { failures.push({ qualifier, compose, error: String(error) }) }
    }
  }
} finally { rmSync(root, { recursive: true, force: true }) }
let comparisons = 0
for (const name of ['chromium', 'firefox', 'webkit']) {
  const browser = await browsers[name].launch()
  try {
    for (const item of cases) for (const media of ['screen', 'print']) {
      const values = {}
      for (const version of ['authored', 'compiled']) {
        const page = await browser.newPage()
        try {
          await page.emulateMedia({ media })
          await page.route('**/*', route => {
            const url = new URL(route.request().url())
            if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><style>html{font-size:16px}</style><link rel="stylesheet" href="/entry.css"><div class="composed">Compose</div><div class="card after">Native</div>' })
            const sources = version === 'authored' ? item.reference : { '/entry.css': item.css }
            assert(url.pathname in sources, url.pathname)
            return route.fulfill({ contentType: 'text/css', body: sources[url.pathname] })
          })
          await page.goto('http://legacy-project.test/', { waitUntil: 'load' })
          values[version] = await page.locator('div').evaluateAll(elements => elements.map(element => ({ padding: getComputedStyle(element).paddingTop, margin: getComputedStyle(element).marginTop })))
        } finally { await page.close() }
      }
      assert.deepEqual(values.compiled, values.authored, `${name}/${media}/${item.qualifier}/${item.compose}`)
      comparisons++
      console.log(JSON.stringify({ browser: name, media, qualifier: item.qualifier, compose: item.compose, values, pass: true }))
    }
  } finally { await browser.close() }
}
console.log(JSON.stringify({ compiled: cases.length, compileFailures: failures, comparisons, scope: 'Legacy Node multi-entry helper; 12 qualifier/compose cases, authored CSS comparisons in three browsers; not raw binding API closure' }))
process.exitCode = failures.length ? 1 : 0
