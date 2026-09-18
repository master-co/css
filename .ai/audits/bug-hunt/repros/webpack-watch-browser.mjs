import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { extname } from 'node:path'

const browsers = createRequire(new URL('../../../../packages/webpack/package.json', import.meta.url))('@playwright/test')
const observations = readFileSync(process.argv[2], 'utf8').split('\n').flatMap(line => {
  try { const row = JSON.parse(line).observation; return row?.result === 'PASS' && !row.expectError && row.css ? [row] : [] }
  catch { return [] }
})
assert(observations.length >= 7, 'Complete successful watch checkpoints required')
const expected = { initial: 'rgb(255, 0, 0)', 'restore-initial': 'rgb(255, 0, 0)', 'edit-css': 'rgb(0, 128, 0)', 'edit-resource': 'rgb(0, 128, 0)',
  'restore-resource': 'rgb(0, 128, 0)', 'restore-child': 'rgb(128, 0, 128)', 'rename-child': 'rgb(128, 0, 128)', unmanage: 'rgb(0, 255, 255)' }
const rows = []
for (const name of ['chromium', 'firefox', 'webkit']) {
  const browser = await browsers[name].launch()
  try {
    for (const observation of observations) {
      const page = await browser.newPage(), missing = [], errors = []
      try {
        page.on('pageerror', error => errors.push(error.message))
        await page.route('**/*', route => {
          const url = new URL(route.request().url())
          if (url.hostname === 'external.invalid') return route.fulfill({ contentType: 'text/css', body: '.card{color:blue}' })
          if (url.hostname !== 'watch-snapshot.test') { missing.push(url.href); return route.abort() }
          if (url.pathname === '/') {
            const scripts = Object.keys(observation.assets).filter(file => file.endsWith('.js'))
            assert.equal(scripts.length, 1)
            return route.fulfill({ contentType: 'text/html', body: `<link rel="stylesheet" href="/assets/${observation.css}"><div class="card" style="width:20px;height:20px">test</div><script src="/assets/${scripts[0]}"></script>` })
          }
          const file = url.pathname.replace(/^\/assets\//, ''), content = observation.assets[file]
          if (content === undefined) { missing.push(url.href); return route.fulfill({ status: 404, body: 'missing' }) }
          return route.fulfill({ contentType: ({ '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' })[extname(file)] ?? 'text/plain', body: content })
        })
        await page.goto('http://watch-snapshot.test/', { waitUntil: 'load' })
        await page.waitForFunction(() => document.body.dataset.ready === 'true')
        const actual = await page.locator('.card').evaluate(async element => {
          const style = getComputedStyle(element), url = style.backgroundImage.match(/^url\(["']?(.*?)["']?\)$/)?.[1]
          let width
          if (url) { const image = new Image();image.src = url;await image.decode();width = image.naturalWidth }
          return { color: style.color, image: style.backgroundImage, width }
        })
        const pass = actual.color === expected[observation.phase] && !missing.length && !errors.length
          && (observation.phase === 'unmanage' ? actual.image === 'none' : actual.width === 7 && actual.image.includes('?q=1#mark'))
        const row = { browser: name, phase: observation.phase, actual, expected: expected[observation.phase], missing, errors, result: pass ? 'PASS' : 'FAIL' }
        rows.push(row);console.log(JSON.stringify(row))
      } finally { await page.close() }
    }
  } finally { await browser.close() }
}
const summary = { observations: rows.length, failures: rows.filter(row => row.result === 'FAIL').length,
  scope: 'Three-browser render and real image decoding of immutable output snapshots from actual compiler.watch callbacks; does not claim live browser HMR.' }
console.log(JSON.stringify({ summary }));if (summary.failures) process.exitCode = 1
