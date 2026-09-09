import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, extname, posix } from 'node:path'
import Plugin from '../../../../packages/webpack/dist/index.js'

const require = createRequire(new URL('../../../../packages/webpack/package.json', import.meta.url))
const webpack = require('webpack')
const browsers = require('@playwright/test')
const root = mkdtempSync(join(tmpdir(), 'master-css-webpack-relative-'))
const names = ['index.html', 'pages/deep/index.html', 'js/shared.html']
const cases = [
  { publicPath: './', module: false }, { publicPath: './', module: true },
  { publicPath: '', module: false }, { publicPath: 'auto', module: true },
  { publicPath: '/mount/', module: false }
]
try {
  writeFileSync(join(root, 'entry.js'), 'globalThis.__APP_FILENAME_PROBE__ = true')
  writeFileSync(join(root, 'app.css'), '@master entry;\n@import "@master/css";')
  const selected = process.env.FIXED_FILENAME ? [
    { publicPath: './', module: false, filename: 'bundle.js', label: 'fixed' },
    { publicPath: './', module: true, filename: 'js/bundle.mjs', label: 'fixed module' },
    { publicPath: 'auto', module: false, filename: () => 'bundle.js', label: 'callback' },
    { publicPath: './', module: false, filename: 'bundle.[fullhash:8].js', label: 'build hash' }
  ] : process.env.SHARED_RUNTIME ? [{ publicPath: './', module: false, shared: true }] : process.env.FIRST_CASE ? cases.slice(0, 1) : cases
  for (const config of selected) {
    await new Promise((resolve, reject) => webpack({
      mode: 'production', context: root, entry: './entry.js', resolve: { tsconfig: false },
      experiments: { outputModule: config.module },
      ...(config.shared ? { optimization: { runtimeChunk: 'single' } } : {}),
      output: { path: join(root, 'dist'), clean: true, filename: config.filename ?? 'js/[name].js', chunkFilename: 'chunks/[name].js', publicPath: config.publicPath, module: config.module },
      plugins: [new Plugin({ mode: 'runtime' }, root), {
        apply(compiler) {
          compiler.hooks.thisCompilation.tap('RelativeRuntimeFixture', compilation => {
            compilation.hooks.processAssets.tap({ name: 'RelativeRuntimeFixture', stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS }, () => {
              for (const name of names) {
                const scripts = config.filename ? compilation.entrypoints.get('main').getFiles().filter(file => /\.m?js$/.test(file)).map(file => `<script ${config.module ? 'type="module"' : 'defer'} src="${posix.relative(posix.dirname(name), file)}"></script>`).join('') : ''
                compilation.emitAsset(name, new compiler.webpack.sources.RawSource(`<!doctype html><html><head></head><body><div id="probe" class="inline-flex"></div>${scripts}</body></html>`))
              }
            })
          })
        }
      }]
    }, (error, stats) => error || stats?.hasErrors() ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()))
    for (const browserName of ['chromium', 'firefox', 'webkit']) {
      const browser = await browsers[browserName].launch()
      try {
        for (const name of names) {
          const page = await browser.newPage()
          const missing = [], errors = [], assets = []
          try {
            page.on('pageerror', error => errors.push(error.message))
            page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
            await page.route('http://webpack-relative.test/**', route => {
              const pathname = new URL(route.request().url()).pathname
              const file = join(root, 'dist', pathname.slice('/mount/'.length))
              if (!pathname.startsWith('/mount/') || !existsSync(file)) {
                missing.push(pathname)
                return route.fulfill({ status: 404, body: 'Missing asset' })
              }
              assets.push(pathname)
              return route.fulfill({ contentType: ({ '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm' })[extname(file)] ?? 'application/octet-stream', body: readFileSync(file) })
            })
            await page.goto('http://webpack-relative.test/mount/' + name)
            await browsers.expect(page.locator('#probe')).toHaveCSS('display', 'inline-flex', { timeout: 15000 })
            await page.locator('#probe').evaluate(element => { element.className = 'grid' })
            await browsers.expect(page.locator('#probe')).toHaveCSS('display', 'grid')
            assert.equal(await page.locator('script[src*="master-css-runtime"]').count(), 1)
            if (config.filename) assert.equal(await page.evaluate(() => globalThis.__APP_FILENAME_PROBE__), true)
            assert.equal(await page.locator('#master-css').count(), 1)
            assert(assets.some(asset => asset.endsWith('.json')))
            assert(assets.some(asset => asset.endsWith('.wasm')))
            assert.deepEqual(missing, [])
            assert.deepEqual(errors, [])
            console.log(JSON.stringify({ ...config, browser: browserName, page: name, actualRuntime: 'PASS', observedMutation: 'PASS', assets, missing, errors }))
          } catch (error) {
            console.error(JSON.stringify({ ...config, browser: browserName, page: name, assets, missing, errors }))
            throw error
          } finally { await page.close() }
        }
      } finally { await browser.close() }
    }
  }
} finally { rmSync(root, { recursive: true, force: true }) }
