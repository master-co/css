import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, realpathSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, extname } from 'node:path'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { build } = await import(require.resolve('vite'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-virtual-watch-'))), out = join(root, 'dist')
let watcher
const rows = [], loads = [], pending = [], waiters = []
function nextBuild() {
  if (pending.length) return Promise.resolve(pending.shift())
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for Vite build event')), 30000)
    waiters.push(event => { clearTimeout(timer); resolve(event) })
  })
}
const virtualID = 'virtual:paint.css' + (process.env.BH_QUERY ? '?watch=1' : '')
const text = color => process.env.BH_MASTER === '0' ? `.example{color:${color}}` : `@master entry;@preserve native;@utilities{paint{color:${color}}}.example{@compose paint;}`
try {
  const control = join(root, 'virtual-source.txt')
  writeFileSync(control, text('red'))
  writeFileSync(join(root, 'entry.css'), `@import "${virtualID}" layer(shared) print;@master entry;`)
  writeFileSync(join(root, 'entry.js'), process.env.BH_ENTRY === 'direct' ? `import "${virtualID}"` : 'import "./entry.css"')
  writeFileSync(join(root, 'index.html'), '<div class="example">test</div><script type="module" src="./entry.js"></script>')
  watcher = await build({ root, base: './', configFile: false, logLevel: 'silent', plugins: [
    { name: 'audit-virtual-watch-source', resolveId(id) { if (id === virtualID) return '\0' + virtualID }, load(id) {
      if (id !== '\0' + virtualID) return
      this.addWatchFile(control)
      const source = readFileSync(control, 'utf8'); loads.push(source); return source
    }, buildEnd() { console.log(JSON.stringify({ phase: 'module-ids', files: Array.from(this.getModuleIds()) })) } }, ...(process.env.BH_MASTER === '0' ? [] : createMasterCSSVitePlugin({ mode: 'static', runtime: false }))
  ], build: { outDir: out, watch: {} } })
  let closeResult = Promise.resolve()
  watcher.on('event', async event => {
    if (event.code === 'BUNDLE_END') closeResult = event.result.close()
    if (event.code === 'END') await closeResult
    console.log(JSON.stringify({ phase: 'event', code: event.code }))
    if (event.code !== 'END' && event.code !== 'ERROR') return
    const receiver = waiters.shift()
    if (receiver) receiver(event); else pending.push(event)
  })
  for (const [index, color] of ['red', 'blue', 'green'].entries()) {
    if (index) writeFileSync(control, text(color))
    const event = await nextBuild()
    if (event.code === 'ERROR') throw event.error
    for (const name of ['chromium', 'firefox', 'webkit']) {
      const browser = await browsers[name].launch()
      try {
        for (const media of ['screen', 'print']) {
          const page = await browser.newPage(), missing = [], errors = []
          try {
            await page.emulateMedia({ media })
            page.on('pageerror', error => errors.push(error.message))
            await page.route('**/*', route => {
              const file = join(out, new URL(route.request().url()).pathname)
              if (!existsSync(file)) { missing.push(file); return route.fulfill({ status: 404, body: 'missing' }) }
              return route.fulfill({ contentType: { '.css': 'text/css', '.js': 'text/javascript', '.html': 'text/html' }[extname(file)], body: readFileSync(file) })
            })
            await page.goto('http://virtual-watch.test/index.html')
            const actual = await page.locator('.example').evaluate(el => getComputedStyle(el).color)
            const expected = media === 'screen' && process.env.BH_ENTRY !== 'direct' ? 'rgb(0, 0, 0)' : { red: 'rgb(255, 0, 0)', blue: 'rgb(0, 0, 255)', green: 'rgb(0, 128, 0)' }[color]
            const row = { index, color, browser: name, media, actual, expected, missing, errors, loads: loads.length, result: actual === expected && !missing.length && !errors.length ? 'PASS' : 'FAIL' }
            rows.push(row); console.log(JSON.stringify(row))
          } finally { await page.close() }
        }
      } finally { await browser.close() }
    }
  }
  const summary = { builds: 3, comparisons: rows.length, failures: rows.filter(r => r.result === 'FAIL').length, loads: loads.length }
  console.log(JSON.stringify(summary)); assert.equal(summary.failures, 0)
} finally { await watcher?.close(); rmSync(root, { recursive: true, force: true }) }
