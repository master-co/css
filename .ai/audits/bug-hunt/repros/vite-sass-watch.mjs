import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, realpathSync, writeFileSync, readFileSync, rmSync, existsSync, mkdirSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, extname, dirname } from 'node:path'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { build } = await import(require.resolve('vite'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-sass-watch-'))), out = join(root, 'dist')
let watcher
const rows = [], loads = [], pending = [], waiters = []
function nextBuild() {
  if (pending.length) return Promise.resolve(pending.shift())
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for Vite build event')), 30000)
    waiters.push(event => { clearTimeout(timer); resolve(event) })
  })
}
const text = color => `.example{color:${color}}`
try {
  mkdirSync(join(root, 'styles')); mkdirSync(join(root, 'node_modules'))
  symlinkSync(dirname(createRequire(require.resolve('vite')).resolve('sass')), join(root, 'node_modules/sass'), 'dir')
  const control = join(root, 'styles/_paint.scss')
  writeFileSync(control, text('red'))
  writeFileSync(join(root, 'entry.scss'), '@use "./styles/paint";@master entry;@preserve native;')
  writeFileSync(join(root, 'entry.css'), '@import "./entry.scss" layer(shared) print;@master entry;')
  writeFileSync(join(root, 'entry.js'), process.env.BH_ENTRY === 'direct' ? 'import "./entry.scss"' : 'import "./entry.css"')
  writeFileSync(join(root, 'index.html'), '<div class="example">test</div><script type="module" src="./entry.js"></script>')
  watcher = await build({ root, base: './', configFile: false, logLevel: 'silent', css: { preprocessorOptions: { scss: { additionalData(source) { loads.push(source); return source } } } }, plugins: createMasterCSSVitePlugin({ mode: 'static', runtime: false }), build: { outDir: out, watch: {} } })
  let closeResult = Promise.resolve(), failedBuild = false
  watcher.on('event', async event => {
    if (event.code === 'START') failedBuild = false
    if (event.code === 'ERROR') failedBuild = true
    if (event.code === 'END' && failedBuild) return
    if (event.code === 'BUNDLE_END') closeResult = event.result.close()
    if (event.code === 'END') await closeResult
    console.log(JSON.stringify({ phase: 'event', code: event.code }))
    if (event.code !== 'END' && event.code !== 'ERROR') return
    const receiver = waiters.shift()
    if (receiver) receiver(event); else pending.push(event)
  })
  for (const [index, color] of ['red', 'blue', 'green'].entries()) {
    if (index === 1 && process.env.BH_RECOVERY) {
      writeFileSync(control, '.example{color:$undefined-paint}')
      const failure = await nextBuild()
      assert.equal(failure.code, 'ERROR')
      const message = failure.error.message
      assert.ok(message.includes('_paint.scss') && message.includes('Undefined variable'))
      console.log(JSON.stringify({ phase: 'sass-error', result: 'PASS', message }))
    }
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
            await page.goto('http://sass-watch.test/index.html')
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
