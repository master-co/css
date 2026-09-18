import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../../../', import.meta.url))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const cases = JSON.parse(readFileSync(new URL('../../../../crates/mastercss-compiler/tests/bug_hunt_stylesheet_graph.json', import.meta.url)))
// Exercise the owning Rust implementation. This is not native/Wasm ABI or host integration evidence.
const output = execFileSync('cargo', ['test', '-p', 'mastercss-compiler', '--test', 'bug_hunt_stylesheet_graph', 'browser_corpus_assets', '--', '--nocapture'], { cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 })
const rendered = output.split('\n').filter(line => line.startsWith('BH_GRAPH_JSON:')).map(line => JSON.parse(line.slice('BH_GRAPH_JSON:'.length)))
assert.equal(rendered.length, cases.length)
let comparisons = 0
for (const name of (process.env.BH_BROWSERS || 'chromium,firefox,webkit').split(',')) {
  // A browser that cannot launch must not hide the ones after it.
  let browser
  try { browser = await browsers[name].launch() } catch (error) { console.log(JSON.stringify({ browser: name, launched: false, error: String(error).split('\n')[0] }));continue }
  try {
    for (const test of cases) {
      const assets = rendered.find(result => result.id === test.id)?.assets
      assert.equal(assets?.length, 2, test.id)
      for (const media of ['screen', 'print']) {
        const colors = {}
        for (const version of ['original', 'graph']) {
          const page = await browser.newPage()
          const requested = []
          try {
            await page.emulateMedia({ media })
            await page.route('**/*', route => {
              const url = new URL(route.request().url())
              requested.push(url.href)
              if (url.hostname === 'remote.test') return route.fulfill({ contentType: 'text/css', body: test.remote || '.example{color:blue}' })
              if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: `<!doctype html><link rel="stylesheet" href="${version === 'graph' ? assets.find(asset => asset.id === 'entry').href : '/entry.css'}"><div class="example">test</div>` })
              const sources = version === 'graph'
                ? Object.fromEntries(assets.map(asset => [asset.href, asset.css]))
                : { '/entry.css': test.entry, '/local.css': test.local || '.example{color:red}' }
              assert(url.pathname in sources, url.pathname)
              return route.fulfill({ contentType: 'text/css', body: sources[url.pathname] })
            })
            await page.goto('http://stylesheet-graph.test/', { waitUntil: 'load' })
            colors[version] = await page.locator('.example').evaluate(element => getComputedStyle(element).color)
          } finally { await page.close() }
          assert(requested.some(url => url.endsWith('/entry.css')), `${test.id}: actual stylesheet delivery`)
        }
        const expected = { red: 'rgb(255, 0, 0)', blue: 'rgb(0, 0, 255)', black: 'rgb(0, 0, 0)' }[media === 'print' ? test.printExpected || test.expected : test.expected]
        assert.equal(colors.original, expected, `${name}/${test.id}/${media}: authored control`)
        assert.equal(colors.graph, expected, `${name}/${test.id}/${media}: Rust graph output`)
        comparisons++
        console.log(JSON.stringify({ browser: name, id: test.id, media, ...colors, expected, result: 'PASS' }))
      }
    }
  } finally { await browser.close() }
}
console.log(JSON.stringify({ cases: cases.length, comparisons, failures: 0, scope: 'Rust graph renderer; public compiler and host delivery not yet integrated' }))
