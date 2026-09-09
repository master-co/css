import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, realpathSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, extname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { build } = await import(require.resolve('vite'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-inline-ssr-'))), rows = []
const bases = ['/deployed/']
try {
  writeFileSync(join(root, 'server.js'), 'import css from "./style.css?inline";export {css}')
  writeFileSync(join(root, 'client.js'), 'import css from "./style.css?inline";window.clientCSS=css')
  writeFileSync(join(root, 'style.css'), '@import "./external.css" layer(shared);@master entry;@preserve native;.example{background:url(./pixel.svg?q=1#part)}')
  writeFileSync(join(root, 'external.css'), '@import "https://inline-external.test/paint.css";')
  writeFileSync(join(root, 'pixel.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>')
  for (const [baseIndex, base] of bases.entries()) for (const format of ['es', 'cjs']) for (const emit of [false, true]) {
    const id = `${baseIndex}-${format}-${emit}`, clientDir = join(root, id + '-client'), serverDir = join(root, id + '-server')
    const calls = []
    const common = { root, base, configFile: false, logLevel: 'silent', experimental: { renderBuiltUrl(filename, context) { calls.push({ filename, ...context }); return `https://custom-assets.test/relocated/${filename}` } } }
    const naming = { assetFileNames: 'styles/deep/[name]-[hash][extname]' }
    try {
      await build({ ...common, plugins: createMasterCSSVitePlugin({ mode: 'static', runtime: false }), build: { outDir: clientDir, minify: false, rolldownOptions: { input: join(root, 'client.js'), output: naming } } })
      const server = await build({ ...common, plugins: createMasterCSSVitePlugin({ mode: 'static', runtime: false }), build: { outDir: serverDir, minify: false, ssr: join(root, 'server.js'), ssrEmitAssets: emit, rolldownOptions: { output: { ...naming, format, entryFileNames: `server.${format === 'es' ? 'mjs' : 'cjs'}` } } } })
      const entry = server.output.find(item => item.type === 'chunk' && item.isEntry)
      const { css } = format === 'cjs' ? require(join(serverDir, entry.fileName)) : await import(pathToFileURL(join(serverDir, entry.fileName)).href)
      const assets = server.output.filter(item => item.type === 'asset').map(item => item.fileName)
      const assetPass = (emit ? assets.length > 0 : assets.length === 0) && css.includes('https://custom-assets.test/relocated/') && calls.some(call => call.ssr && call.filename.includes('master-css-resource-'))
      const assetRow = { id, base, format, emit, phase: 'assets', assets, css, calls, result: assetPass && !css.includes('file:') ? 'PASS' : 'FAIL' }; rows.push(assetRow); console.log(JSON.stringify(assetRow))
      for (const name of ['chromium', 'firefox', 'webkit']) {
        const browser = await browsers[name].launch()
        try {
          const page = await browser.newPage(), missing = [], errors = []
          page.on('pageerror', error => errors.push(error.message))
          await page.route('**/*', route => {
            const url = new URL(route.request().url())
            if (url.host === 'inline-external.test') return route.fulfill({ contentType: 'text/css', body: '.example{color:blue}' })
            if (url.pathname === '/deployed/index.html') return route.fulfill({ contentType: 'text/html', body: `<style>${css}</style><div class="example">SSR</div>` })
            const file = join(emit ? serverDir : clientDir, url.pathname.replace(/^\/(?:deployed|relocated)\//, ''))
            if (!existsSync(file)) { missing.push(url.href); return route.fulfill({ status: 404, body: 'missing' }) }
            return route.fulfill({ contentType: { '.css': 'text/css', '.svg': 'image/svg+xml' }[extname(file)], body: readFileSync(file) })
          })
          await page.goto('http://inline-ssr.test/deployed/index.html')
          const value = await page.evaluate(async () => {
            const style = getComputedStyle(document.querySelector('.example')), image = new Image()
            image.src = style.backgroundImage.slice(4, -1).replace(/^['"]|['"]$/g, '')
            let imageLoaded = false; try { await image.decode(); imageLoaded = image.naturalWidth === 1 } catch {}
            return { color: style.color, background: style.backgroundImage, imageLoaded }
          })
          const row = { id, phase: 'browser', browser: name, value, missing, errors, result: value.color === 'rgb(0, 0, 255)' && value.imageLoaded && value.background.includes('https://custom-assets.test/relocated/') && !missing.length && !errors.length ? 'PASS' : 'FAIL' }; rows.push(row); console.log(JSON.stringify(row))
        } finally { await browser.close() }
      }
    } catch (error) { const row = { id, phase: 'build-or-load', message: error.message, result: 'FAIL' }; rows.push(row); console.log(JSON.stringify(row)) }
  }
  const summary = { scenarios: bases.length * 4, builds: bases.length * 8, browserComparisons: rows.filter(row => row.phase === 'browser').length, failures: rows.filter(row => row.result === 'FAIL').length }
  console.log(JSON.stringify(summary)); assert.equal(summary.failures, 0)
} finally { rmSync(root, { recursive: true, force: true }) }
