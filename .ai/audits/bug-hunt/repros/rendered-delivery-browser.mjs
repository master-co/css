import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { createRequire } from 'node:module'
import { compileRenderedStylesheet } from '../../../../packages/compiler/dist/stylesheet/index-public.js'

const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const cases = JSON.parse(readFileSync(new URL('../../../../crates/mastercss-compiler/tests/bug_hunt_stylesheet_graph.json', import.meta.url)))
cases.push(
  { id: 'compose-before-native', entry: "@import './local.css';@utilities{paint{color:red}}", local: '.example{@compose paint;}.example{color:blue}', referenceEntry: "@import './local.css';", referenceLocal: '.example{color:red}.example{color:blue}', expected: 'blue' },
  { id: 'compose-in-conditional-layer', entry: "@import './local.css' layer(shared) supports(display:grid) screen;@utilities{paint{color:red}}", local: '.example{@compose paint;}', referenceEntry: "@import './local.css' layer(shared) supports(display:grid) screen;", referenceLocal: '.example{color:red}', expected: 'red', printExpected: 'black' },
  { id: 'compose-cross-file-override', entry: "@import './local.css';@utilities{paint{color:blue}}", local: '@utilities{paint{color:red}}.example{@compose paint;}', referenceEntry: "@import './local.css';", referenceLocal: '.example{color:blue}', expected: 'blue' }
)
const compiled = new Map()
const root = mkdtempSync(join(tmpdir(), 'master-rendered-boundaries-'))
try {
  for (const test of cases) {
    const entry = join(root, 'entry.css'), child = join(root, 'local.css')
    writeFileSync(child, test.local || '.example{color:red}')
    const result = await compileRenderedStylesheet(entry, test.entry, { projectDir: root,
      baseManifest: { version: 1, utilities: [] }, classes: ['example'],
      delivery: { entryURL: '/delivered/entry.css', stylesheetURL: file => `/delivered/${basename(file)}`, resourceURL: file => `/resources/${basename(file)}` }
    })
    assert.equal(result.stylesheets.find(asset => asset.id === entry).css, result.css)
    compiled.set(test.id, result)
    console.log(JSON.stringify({ id: test.id, assets: result.stylesheets.length, sourceMaps: result.stylesheets.every(asset => Boolean(asset.sourceMap)) }))
  }
} finally { rmSync(root, { recursive: true, force: true }) }
let comparisons = 0
for (const name of ['chromium', 'firefox', 'webkit']) {
  const browser = await browsers[name].launch()
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
console.log(JSON.stringify({ cases: cases.length, comparisons, failures: 0, scope: 'Built Node compileRenderedStylesheet with actual asset delivery; includes original10 external-import cases plus11 boundary/compose controls' }))
