import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, extname } from 'node:path'
import { createRequire } from 'node:module'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
import WebpackPlugin from '../../../../packages/webpack/dist/index.js'
const vr = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const wr = createRequire(new URL('../../../../packages/webpack/package.json', import.meta.url))
const { build } = await import(vr.resolve('vite'))
const webpack = wr('webpack'), browsers = wr('@playwright/test')
const remote = "@import 'https://remote.test/external.css'"
const cases = [
  { id: 'plain-control', entry: '.example{color:green}', expected: 'rgb(0, 128, 0)' },
  { id: 'external-first', entry: `${remote};@import './local.css';`, expected: 'rgb(255, 0, 0)' },
  { id: 'external-last', entry: `@import './local.css';${remote};`, expected: 'rgb(0, 0, 255)' },
  { id: 'nested-layer', entry: "@import './local.css' layer(shared);", local: `${remote};.example{color:red}`, expected: 'rgb(255, 0, 0)' },
  { id: 'nested-anonymous', entry: "@import './local.css' layer;", local: `${remote};.example{color:red}`, expected: 'rgb(255, 0, 0)' },
  { id: 'nested-supports-print', entry: "@import './local.css' supports(display:grid) print;", local: `${remote};.example{color:red}`, expected: 'rgb(0, 0, 0)', print: 'rgb(255, 0, 0)' },
  { id: 'ordinary-before-managed', before: '.example{color:green}', entry: `@import './local.css';${remote};`, expected: 'rgb(0, 0, 255)' },
  { id: 'ordinary-after-managed', after: '.example{color:green}', entry: `@import './local.css';${remote};`, expected: 'rgb(0, 128, 0)' }
]
const root = mkdtempSync(join(tmpdir(), 'master-css-build-delivery-'))
const results = []
try {
  for (const test of cases) {
    writeFileSync(join(root, 'entry.css'), `${test.entry}\n@master entry;@preserve native;`)
    writeFileSync(join(root, 'local.css'), test.local || '.example{color:red}')
    writeFileSync(join(root, 'before.css'), test.before || '')
    writeFileSync(join(root, 'after.css'), test.after || '')
    writeFileSync(join(root, 'entry.js'), `${test.before ? "import './before.css';" : ''}import './entry.css';${test.after ? "import './after.css';" : ''}`)
    writeFileSync(join(root, 'index.html'), '<div class="example">test</div><script type="module" src="./entry.js"></script>')
    for (const host of ['vite', 'webpack']) {
      const out = join(root, `out-${host}`)
      rmSync(out, { recursive: true, force: true })
      try {
        if (host === 'vite') await build({ root, base: './', configFile: false, logLevel: 'silent', plugins: createMasterCSSVitePlugin({ mode: 'static', runtime: false }), build: { outDir: out } })
        else {
          const compiler = webpack({ mode: 'production', context: root, entry: './entry.js', resolve: { tsconfig: false }, experiments: { css: true }, output: { path: out, clean: true, filename: 'entry.js', cssFilename: 'entry.css', publicPath: './' }, plugins: [new WebpackPlugin({ mode: 'static', runtime: false }, root)] })
          try {
            await new Promise((resolve, reject) => compiler.run((error, stats) => error ? reject(error) : stats.hasErrors() ? reject(new Error(stats.toString({ all: false, errors: true }))) : resolve()))
          } finally { await new Promise((resolve, reject) => compiler.close(error => error ? reject(error) : resolve())) }
          writeFileSync(join(out, 'index.html'), '<link rel="stylesheet" href="./entry.css"><div class="example">test</div><script defer src="./entry.js"></script>')
        }
      } catch (error) {
        const result = { host, id: test.id, phase: 'build', result: 'FAIL', message: error.message }
        results.push(result); console.log(JSON.stringify(result)); continue
      }
      for (const browserName of ['chromium', 'firefox', 'webkit']) {
        const browser = await browsers[browserName].launch()
        try {
          for (const media of ['screen', 'print']) {
            const colors = {}, errors = [], missing = []
            for (const variant of ['original', 'built']) {
              const page = await browser.newPage()
              try {
                await page.emulateMedia({ media })
                page.on('pageerror', error => errors.push(error.message))
                await page.route('**/*', route => {
                  const url = new URL(route.request().url())
                  if (url.hostname === 'remote.test') return route.fulfill({ contentType: 'text/css', body: '.example{color:blue}' })
                  if (variant === 'original' && url.pathname === '/index.html') return route.fulfill({ contentType: 'text/html', body: `${test.before ? '<link rel="stylesheet" href="/before.css">' : ''}<link rel="stylesheet" href="/original.css">${test.after ? '<link rel="stylesheet" href="/after.css">' : ''}<div class="example">test</div>` })
                  if (variant === 'original' && url.pathname === '/original.css') return route.fulfill({ contentType: 'text/css', body: test.entry })
                  const file = join(variant === 'built' ? out : root, url.pathname)
                  if (!existsSync(file)) { missing.push(url.pathname); return route.fulfill({ status: 404, body: 'missing' }) }
                  return route.fulfill({ contentType: ({ '.css': 'text/css', '.js': 'text/javascript', '.html': 'text/html' })[extname(file)], body: readFileSync(file) })
                })
                await page.goto('http://build-delivery.test/index.html', { waitUntil: 'load' })
                colors[variant] = await page.locator('.example').evaluate(element => getComputedStyle(element).color)
              } finally { await page.close() }
            }
            assert.equal(colors.original, media === 'print' ? test.print || test.expected : test.expected, `${test.id}: original control`)
            const result = { host, id: test.id, phase: 'browser', browser: browserName, media, colors, errors, missing, result: colors.built === colors.original && !errors.length && !missing.length ? 'PASS' : 'FAIL' }
            results.push(result); console.log(JSON.stringify(result))
          }
        } finally { await browser.close() }
      }
      const assets = readdirSync(out, { recursive: true }).filter(file => file.endsWith('.css')).map(file => ({ file, css: readFileSync(join(out, file), 'utf8') }))
      console.log(JSON.stringify({ host, id: test.id, assets }))
    }
  }
  const summary = { builds: cases.length * 2, buildFailures: results.filter(r => r.phase === 'build').length, comparisons: results.filter(r => r.phase === 'browser').length, browserFailures: results.filter(r => r.phase === 'browser' && r.result === 'FAIL').length }
  console.log(JSON.stringify(summary)); if (summary.buildFailures || summary.browserFailures) process.exitCode = 1
} finally { rmSync(root, { recursive: true, force: true }) }
