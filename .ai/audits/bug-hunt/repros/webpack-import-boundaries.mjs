import assert from 'node:assert/strict'
import { createCompiler } from '../../../../packages/compiler/dist/index.js'
import { installDeliveryExperiment } from './webpack-delivery-experiment.mjs'
import { createRequire } from 'node:module'
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, extname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const require = createRequire(new URL('../../../../packages/webpack/package.json', import.meta.url))
const webpack = require('webpack'), browsers = require('@playwright/test')
const pluginURL = process.env.MASTER_WEBPACK_PLUGIN
  ? pathToFileURL(resolve(process.env.MASTER_WEBPACK_PLUGIN))
  : new URL('../../../../packages/webpack/dist/index.js', import.meta.url)
const Plugin = (await import(pluginURL.href)).default
const experimentalDelivery = process.env.BH_GRAPH_DELIVERY === '1'
const graphCompiler = experimentalDelivery ? await createCompiler() : undefined
const pure = process.env.BH_PURE_WEBPACK === '1'
const nestedAssets = process.env.BH_ASSET_BASE !== undefined
const assetBase = process.env.BH_ASSET_BASE ?? './'
const cssFile = nestedAssets ? 'css/entry.css' : 'entry.css'
const jsFile = nestedAssets ? 'js/entry.js' : 'entry.js'
const root = realpathSync(mkdtempSync(join(tmpdir(), 'webpack-import-boundaries-')))
const observations = [], comparisons = []
const engines = new Map()
try {
  for (const browser of ['chromium', 'firefox', 'webkit']) engines.set(browser, await browsers[browser].launch())
  for (const qualifier of ['', ' layer(cards)', ' supports(display:grid) print']) {
    for (const rootEntry of [false, true]) {
      for (const external of [false, true]) {
        const id = `${qualifier || 'unqualified'}-${rootEntry}-${external}`
        const caseRoot = join(root, `case-${observations.length}`), out = join(caseRoot, 'out')
        mkdirSync(caseRoot)
        const childCSS = `${external ? '@import "https://external.invalid/font.css";' : ''}.card{color:red}`
        const entryCSS = `@import "./child.css"${qualifier};.root{display:block}`
        writeFileSync(join(caseRoot, 'child.css'), pure ? childCSS : `${external ? '@import "https://external.invalid/font.css";' : ''}@master entry;@preserve native;.card{color:red}`)
        writeFileSync(join(caseRoot, 'entry.css'), pure ? entryCSS : `@import "./child.css"${qualifier};${rootEntry ? '@master entry;@preserve native;' : ''}.root{display:block}`)
        writeFileSync(join(caseRoot, 'entry.js'), 'import "./entry.css";document.body.dataset.ready="true"')
        const plugin = pure ? undefined : new Plugin({ mode: 'static', runtime: false }, caseRoot)
        if (experimentalDelivery) installDeliveryExperiment(plugin, graphCompiler)
        const compiler = webpack({ mode: 'production', context: caseRoot, entry: './entry.js',
          resolve: { tsconfig: false }, experiments: { css: true },
          output: { path: out, clean: true, filename: jsFile, cssFilename: cssFile, publicPath: assetBase },
          plugins: plugin ? [plugin] : [] })
        let error, stats
        try {
          stats = await new Promise((resolve, reject) => compiler.run((error, stats) => error ? reject(error) : resolve(stats)))
          if (stats.hasErrors()) error = stats.toString({ all: false, errors: true })
        } catch (failure) { error = String(failure) }
        finally { await new Promise((resolve, reject) => compiler.close(error => error ? reject(error) : resolve())) }
        const result = { id, pure, qualifier, rootEntry, external, build: error ? 'FAIL' : 'PASS', error,
          dependencies: stats ? [...stats.compilation.fileDependencies].filter(file => file.startsWith(caseRoot)).map(file => file.slice(caseRoot.length + 1)) : [] }
        observations.push(result)
        console.log(JSON.stringify(result))
        if (error) continue
        const html = `<link rel="stylesheet" href="${assetBase}${cssFile}"><div class="card root">test</div><script src="${assetBase}${jsFile}"></script>`
        writeFileSync(join(out, 'index.html'), html)
        for (const [browserName, browser] of engines) {
          for (const media of ['screen', 'print']) {
            const values = {}, missing = [], errors = [], remoteRequests = []
            for (const variant of ['author', 'built']) {
              const page = await browser.newPage()
              try {
                await page.emulateMedia({ media })
                page.on('pageerror', failure => errors.push(failure.message))
                await page.route('**/*', route => {
                  const url = new URL(route.request().url())
                  if (url.hostname === 'external.invalid') {
                    remoteRequests.push({ variant, url: url.href })
                    return route.fulfill({ contentType: 'text/css', body: '.card{color:blue}' })
                  }
                  const assetOrigin = new URL(assetBase || './', 'http://boundary.test/')
                  if (!['boundary.test', assetOrigin.hostname].includes(url.hostname)) { missing.push(url.href); return route.abort() }
                  if (variant === 'author') {
                    const content = { '/index.html': '<link rel="stylesheet" href="/entry.css"><div class="card root">test</div>', '/entry.css': entryCSS, '/child.css': childCSS }[url.pathname]
                    if (content === undefined) { missing.push(url.pathname); return route.fulfill({ status: 404, body: 'missing' }) }
                    return route.fulfill({ contentType: url.pathname.endsWith('.html') ? 'text/html' : 'text/css', body: content })
                  }
                  const prefix = assetOrigin.pathname
                  const pathname = url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length) : url.pathname
                  const file = join(out, pathname)
                  if (!existsSync(file)) { missing.push(url.pathname); return route.fulfill({ status: 404, body: 'missing' }) }
                  return route.fulfill({ contentType: ({ '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' })[extname(file)], body: readFileSync(file) })
                })
                await page.goto('http://boundary.test/index.html', { waitUntil: 'load' })
                if (variant === 'built') await page.waitForFunction(() => document.body.dataset.ready === 'true')
                values[variant] = await page.locator('.card').evaluate(element => ({ color: getComputedStyle(element).color, display: getComputedStyle(element).display }))
              } finally { await page.close() }
            }
            assert.equal(values.author.color, qualifier.includes('print') && media === 'screen' ? 'rgb(0, 0, 0)' : 'rgb(255, 0, 0)', 'Independent author CSS control')
            assert.equal(values.author.display, 'block')
            const comparison = { id, browser: browserName, media, values, missing, errors, remoteRequests,
              result: JSON.stringify(values.author) === JSON.stringify(values.built) && !missing.length && !errors.length ? 'PASS' : 'FAIL' }
            comparisons.push(comparison)
            console.log(JSON.stringify(comparison))
          }
        }
        console.log(JSON.stringify({ id, assets: readdirSync(out, { recursive: true }).filter(file => file.endsWith('.css')).map(file => ({ file, css: readFileSync(join(out, file), 'utf8') })) }))
      }
    }
  }
  const summary = { pure, experimentalDelivery, assetBase, nestedAssets, builds: observations.length, buildPass: observations.filter(row => row.build === 'PASS').length,
    buildFail: observations.filter(row => row.build === 'FAIL').length, comparisons: comparisons.length,
    comparisonPass: comparisons.filter(row => row.result === 'PASS').length, comparisonFail: comparisons.filter(row => row.result === 'FAIL').length,
    scope: 'Actual Webpack production static builds, native CSS experiment, selected plugin or explicitly pure host control; all external CSS intercepted locally; no dev/HMR/Next/SSR claim.' }
  console.log(JSON.stringify({ summary }))
  if (summary.buildFail || summary.comparisonFail) process.exitCode = 1
} finally {
  for (const browser of engines.values()) await browser.close()
  graphCompiler?.dispose()
  rmSync(root, { recursive: true, force: true })
}
