import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire, stripTypeScriptTypes } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
const packageDir = fileURLToPath(new URL('../../../../packages/webpack/', import.meta.url))
const require = createRequire(new URL('../../../../examples/webpack/package.json', import.meta.url))
const webpack = require('webpack'), WebpackDevServer = require('webpack-dev-server'), HtmlWebpackPlugin = require('html-webpack-plugin')
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const { default: MasterCSSWebpackPlugin } = await import('../../../../packages/webpack/dist/index.js')
const baseline = process.env.BH_BASELINE === '1', deliveryBaseline = process.env.BH_DELIVERY_BASELINE === '1', rows = []
const baselineSource = baseline ? execFileSync('git', ['show', 'HEAD:packages/webpack/src/runtime.ts'], { cwd: packageDir, encoding: 'utf8' }) : undefined
const oldDelivery = deliveryBaseline ? JSON.parse(readFileSync(new URL('../evidence/0183-runtime-hosts-webpack-delivery-before.json', import.meta.url), 'utf8')).source : undefined
console.log(JSON.stringify({ baseline, deliveryBaseline, sourceSha256: createHash('sha256').update(baselineSource ?? oldDelivery ?? readFileSync(join(packageDir, 'dist/runtime.js'))).digest('hex') }))
for (const browserName of ['chromium', 'firefox', 'webkit']) {
  const root = mkdtempSync(join(tmpdir(), 'webpack-runtime-start-hmr-')), css = join(root, 'app.css')
  writeFileSync(join(root, 'entry.js'), 'window.entryReady=true;')
  const write = value => writeFileSync(css, `@master entry;@components{card{padding:${value}rem}}`)
  write(7)
  if (baseline) writeFileSync(join(root, 'baseline-runtime.js'), stripTypeScriptTypes(baselineSource))
  if (deliveryBaseline) writeFileSync(join(root, 'baseline-runtime.js'), oldDelivery.replace('"./_virtual/_rolldown/runtime.js"', JSON.stringify(join(packageDir, 'dist/_virtual/_rolldown/runtime.js'))))
  const compiler = webpack({ mode: 'development', context: root, entry: './entry.js', devtool: false,
    output: { path: join(root, 'dist'), filename: '[name].js', publicPath: '/' }, optimization: { runtimeChunk: 'single' },
    resolve: { tsconfig: false, modules: [join(packageDir, 'node_modules'), 'node_modules'], ...(baseline || deliveryBaseline ? { alias: { [join(packageDir, 'dist/runtime.js') + '$']: join(root, 'baseline-runtime.js') } } : {}) },
    plugins: [new HtmlWebpackPlugin({ templateContent: '<!doctype html><html><body><div id="probe" class="card">Probe</div></body></html>' }), new MasterCSSWebpackPlugin({ mode: 'runtime' }, root)] })
  const server = new WebpackDevServer({ host: '127.0.0.1', port: 0, hot: true, liveReload: false, client: { logging: 'none' }, devMiddleware: { stats: 'errors-only' } }, compiler)
  let browser, release, page
  const errors = [], diagnostics = []
  try {
    await server.start()
    await new Promise(resolve => server.middleware.waitUntilValid(resolve))
    const url = `http://127.0.0.1:${server.server.address().port}`
    browser = await browsers[browserName].launch()
    page = await browser.newPage()
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') diagnostics.push(message.text()) })
    let requested
    const seen = new Promise(resolve => { requested = resolve }), gate = new Promise(resolve => { release = resolve })
    await page.route('**/*.wasm*', async route => { requested(route.request().url());await gate;await route.continue() })
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    const wasmURL = await seen, started = Date.now()
    await page.waitForFunction(() => window.__MASTER_CSS_WEBPACK_RUNTIME__?.generation)
    await page.evaluate(() => { window.initialGeneration = window.__MASTER_CSS_WEBPACK_RUNTIME__.generation;window.keepState = 'retained' })
    write(9)
    await page.waitForFunction(() => window.__MASTER_CSS_WEBPACK_RUNTIME__.generation > window.initialGeneration, undefined, { timeout: 2000 })
    const heldMs = Date.now() - started
    release()
    let failure
    try { await page.waitForFunction(() => getComputedStyle(document.querySelector('#probe')).paddingTop === '144px', undefined, { timeout: 4000 }) } catch (error) { failure = error.message }
    const state = await page.evaluate(() => ({ marker: window.keepState, padding: getComputedStyle(document.querySelector('#probe')).paddingTop, styles: Array.from(document.querySelectorAll('style#master-css')).map(style => Array.from(style.sheet.cssRules).map(rule => rule.cssText)) }))
    const pass = !failure && errors.length === 0 && state.marker === 'retained' && !diagnostics.some(message => message.includes('RUNTIME_STARTUP_TIMEOUT'))
    const row = { browser: browserName, pass, wasmURL, heldMs, state, errors, diagnostics, failure };rows.push(row);console.log(JSON.stringify(row))
  } catch (error) {
    const state = page && await page.evaluate(() => ({ marker: window.keepState, initialGeneration: window.initialGeneration, generation: window.__MASTER_CSS_WEBPACK_RUNTIME__?.generation, padding: document.querySelector('#probe') && getComputedStyle(document.querySelector('#probe')).paddingTop }))
    const row = { browser: browserName, pass: false, harnessOrHostFailure: String(error), state, errors, diagnostics };rows.push(row);console.log(JSON.stringify(row))
  } finally { release?.();await browser?.close();await server.stop();rmSync(root, { recursive: true, force: true }) }
}
console.log(JSON.stringify({ summary: true, observations: rows.length, failures: rows.filter(row => !row.pass).length }))
process.exitCode = rows.some(row => !row.pass) ? 1 : 0
