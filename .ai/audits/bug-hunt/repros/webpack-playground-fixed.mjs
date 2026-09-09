import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import config from '../../../../packages/webpack/playground/webpack.config.js'

const require = createRequire(new URL('../../../../examples/webpack/package.json', import.meta.url))
const webpack = require('webpack')
const browsers = createRequire(new URL('../../../../packages/webpack/package.json', import.meta.url))('@playwright/test')
const root = mkdtempSync(join(tmpdir(), 'master-css-webpack-playground-'))
try {
  assert.equal(config.output.filename, 'bundle.js')
  const stats = await new Promise((resolve, reject) => webpack({
    ...config, mode: 'production',
    output: { ...config.output, path: root },
    // Exercise published exports and already-installed loaders; do not change
    // playground source, filename, entry, plugins, dependencies or lockfiles.
    resolve: { ...config.resolve, tsconfig: false },
    resolveLoader: { modules: [fileURLToPath(new URL('../../../../examples/webpack/node_modules', import.meta.url))] }
  }, (error, stats) => error || stats?.hasErrors() ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve(stats)))
  console.log(stats.toString({ all: false, errors: true, warnings: true }))
  const entries = stats.toJson({ all: false, entrypoints: true }).entrypoints
  const runtimeFile = entries['master-css-runtime'].assets.find(asset => /\.m?js$/.test(asset.name)).name
  assert.equal(entries.main.assets.find(asset => /\.m?js$/.test(asset.name)).name, 'bundle.js')
  assert.match(runtimeFile, /^_master-css\/master-css-runtime\.[a-f0-9]{8}\.js$/)
  for (const name of ['chromium', 'firefox', 'webkit']) {
    const browser = await browsers[name].launch()
    try {
      const page = await browser.newPage()
      const errors = [], missing = [], messages = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('console', message => { messages.push(message.text()); if (message.type() === 'error') errors.push(message.text()) })
      await page.route('http://webpack-playground.test/**', route => {
        const path = new URL(route.request().url()).pathname
        const file = join(root, path === '/' ? 'index.html' : path.slice(1))
        if (!existsSync(file)) { missing.push(path); return route.fulfill({ status: 404, body: 'Missing asset' }) }
        return route.fulfill({ contentType: ({ '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.wasm': 'application/wasm' })[extname(file)] ?? 'application/octet-stream', body: readFileSync(file) })
      })
      await page.goto('http://webpack-playground.test/')
      await browsers.expect(page.locator('body')).toHaveCSS('display', 'grid')
      await browsers.expect(page.locator('.btn')).toHaveCSS('background-color', 'rgb(0, 97, 255)')
      await page.evaluate(() => { const element = document.createElement('div'); element.id = 'new-class'; element.className = 'hidden'; document.body.append(element) })
      await browsers.expect(page.locator('#new-class')).toHaveCSS('display', 'none')
      const gridItemDisplay = await page.evaluate(() => {
        const parent = document.createElement('div'), child = document.createElement('div')
        parent.style.display = 'grid'; child.style.display = 'inline-flex'
        parent.append(child); document.body.append(parent)
        const value = getComputedStyle(child).display
        parent.remove(); return value
      })
      assert.equal(gridItemDisplay, 'flex')
      await page.locator('#new-class').evaluate(element => { element.className = 'grid' })
      await browsers.expect(page.locator('#new-class')).toHaveCSS('display', 'grid')
      assert(messages.includes('Master CSS Webpack playground ready'))
      assert.deepEqual(errors, [])
      assert.deepEqual(missing, [])
      console.log(JSON.stringify({ browser: name, originalPlayground: true, app: 'bundle.js', runtimeFile, appCSS: 'PASS', runtimeMutation: 'PASS', gridItemDisplay, errors, missing }))
    } finally { await browser.close() }
  }
} finally { rmSync(root, { recursive: true, force: true }) }
