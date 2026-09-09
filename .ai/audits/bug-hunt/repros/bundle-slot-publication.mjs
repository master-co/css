import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createCompilerSync } from '../../../../packages/compiler/dist/node.js'
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const remote = "@import 'https://remote.test/external.css';"
const managed = "@import './local.css';" + remote
const local = '.example{color:red}'
const counts = { graph: { pass: 0, fail: 0 }, insertion: { pass: 0, fail: 0 }, hoist: { pass: 0, fail: 0 } }
for (const test of [
  { id: 'before', before: '.example{color:green}', after: '' },
  { id: 'after', before: '', after: '.example{color:green}' },
  { id: 'both', before: '.example{color:green}', after: '.example{background-color:yellow}' }
]) {
  const files = { entry: "@import './before.css';@import './managed.css';@import './after.css';", before: test.before, managed, local, after: test.after }
  const edges = [
    { from: 'entry', specifier: './before.css', resolved: 'before' },
    { from: 'entry', specifier: './managed.css', resolved: 'managed' },
    { from: 'entry', specifier: './after.css', resolved: 'after' },
    { from: 'managed', specifier: './local.css', resolved: 'local' }
  ]
  const compiler = createCompilerSync()
  let result
  try { result = compiler.compileStylesheets({ graph: { entry: 'entry', files, edges }, urls: Object.fromEntries(Object.keys(files).map(id => [id, `/graph/${id}.css`])), baseManifest: { version: 1, utilities: [] } }) }
  finally { compiler.dispose() }
  const css = new Map(result.stylesheets.map(asset => [asset.href, asset.css]))
  // These are explicit test-owned segments, not a parser for arbitrary build CSS.
  css.set('/original.css', files.entry)
  css.set('/before.css', files.before); css.set('/managed.css', files.managed); css.set('/after.css', files.after); css.set('/local.css', files.local)
  css.set('/insertion.css', test.before + managed + test.after)
  css.set('/hoist.css', remote + test.before + local + test.after)
  for (const name of ['chromium', 'firefox', 'webkit']) {
    const browser = await browsers[name].launch()
    try {
      for (const media of ['screen', 'print']) {
        const values = {}
        for (const variant of ['original', 'insertion', 'hoist', 'graph']) {
          const page = await browser.newPage()
          try {
            await page.emulateMedia({ media })
            await page.route('**/*', route => {
              const url = new URL(route.request().url())
              if (url.hostname === 'remote.test') return route.fulfill({ contentType: 'text/css', body: '.example{color:blue}' })
              if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: `<link rel="stylesheet" href="${variant === 'graph' ? '/graph/entry.css' : '/' + variant + '.css'}"><div class="example">test</div>` })
              assert(css.has(url.pathname), url.pathname)
              return route.fulfill({ contentType: 'text/css', body: css.get(url.pathname) })
            })
            await page.goto('http://slot-publication.test/')
            values[variant] = await page.locator('.example').evaluate(element => ({ color: getComputedStyle(element).color, background: getComputedStyle(element).backgroundColor }))
          } finally { await page.close() }
        }
        assert.equal(values.original.color, test.id === 'after' ? 'rgb(0, 128, 0)' : 'rgb(0, 0, 255)')
        for (const variant of ['insertion', 'hoist', 'graph']) {
          const pass = JSON.stringify(values[variant]) === JSON.stringify(values.original)
          counts[variant][pass ? 'pass' : 'fail']++
          console.log(JSON.stringify({ id: test.id, browser: name, media, variant, original: values.original, actual: values[variant], result: pass ? 'PASS' : 'FAIL' }))
        }
      }
    } finally { await browser.close() }
  }
}
assert.equal(counts.graph.fail, 0)
assert(counts.insertion.fail > 0 && counts.hoist.fail > 0)
console.log(JSON.stringify({ counts, scope: 'explicit segment proof only; arbitrary bundler CSS slot discovery and publication integration are not implemented' }))
