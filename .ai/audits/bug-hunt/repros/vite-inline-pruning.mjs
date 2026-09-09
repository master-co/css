import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, realpathSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, extname } from 'node:path'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { build } = await import(require.resolve('vite'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-inline-pruning-')))
const rows = []
try {
  writeFileSync(join(root, 'index.html'), '<div class="example">test</div><script type="module" src="./entry.js"></script>')
  writeFileSync(join(root, 'pixel.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>')
  for (const scenario of ['unused', 'used-leaf', 'used-resource', 'shared-used-unused', 'lazy']) {
    const resource = ['unused', 'used-resource', 'lazy'].includes(scenario)
    writeFileSync(join(root, 'entry.js'), scenario === 'lazy' ? 'window.loadCSS = () => import("./lazy.js").then(m => m.default)' : `import css from './style.css?inline';${scenario === 'shared-used-unused' ? 'import unused from "./other.css?inline";' : ''}${scenario === 'unused' ? 'window.alive = true' : 'window.css = css'}`)
    writeFileSync(join(root, 'lazy.js'), 'import css from "./style.css?inline";export default css')
    for (const managed of [false, true]) {
      const prefix = managed ? '@master entry;@preserve native;' : ''
      writeFileSync(join(root, 'style.css'), `${prefix}.example{color:blue${resource ? ';background:url(./pixel.svg)' : ''}}`)
      writeFileSync(join(root, 'other.css'), `${prefix}.other{background:url(./pixel.svg)}`)
      const result = await build({ root, configFile: false, logLevel: 'silent', base: './', plugins: managed ? createMasterCSSVitePlugin({ mode: 'static', runtime: false }) : [], build: { write: false, minify: false, assetsInlineLimit: 0 } })
      const assets = result.output.filter(item => item.type === 'asset' && item.fileName !== 'index.html')
      const js = result.output.filter(item => item.type === 'chunk').map(item => item.code).join('\n')
      const redundantCSS = assets.filter(item => item.fileName.endsWith('.css') && !item.fileName.includes('master-css-inline-base-'))
      const unusedOutput = scenario === 'unused' && (assets.length !== 0 || js.includes('.example'))
      const resourceCount = assets.filter(item => item.fileName.endsWith('.svg')).length
      // Pure Vite also retains resources from unused inline imports. Record that
      // separately; the managed adapter must clean up only its own publications.
      const baseline = !managed && ['unused', 'shared-used-unused'].includes(scenario) && resourceCount > 0
      const bad = unusedOutput || redundantCSS.length !== 0 || (scenario === 'shared-used-unused' && resourceCount !== 0)
      const row = { scenario, managed, phase: 'assets', assets: assets.map(item => ({ fileName: item.fileName, bytes: item.source.length })), cssInJS: js.includes('.example'), result: baseline ? 'BASELINE' : bad ? 'FAIL' : 'PASS' }
      rows.push(row); console.log(JSON.stringify(row))
      const files = new Map(result.output.map(item => [item.fileName, item.type === 'chunk' ? item.code : item.source]))
      for (const name of ['chromium', 'firefox', 'webkit']) {
        const browser = await browsers[name].launch()
        try {
          const page = await browser.newPage(), missing = [], errors = []
          page.on('pageerror', error => errors.push(error.message))
          await page.route('**/*', route => {
            const url = new URL(route.request().url()), file = url.pathname.slice('/deployed/'.length)
            if (!files.has(file)) { missing.push(url.href); return route.fulfill({ status: 404, body: 'missing' }) }
            return route.fulfill({ contentType: { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }[extname(file)], body: files.get(file) })
          })
          await page.goto('http://inline-pruning.test/deployed/index.html')
          const value = await page.evaluate(async scenario => {
            const target = document.querySelector('.example'), before = getComputedStyle(target).color
            if (scenario !== 'unused') {
              const css = window.loadCSS ? await window.loadCSS() : window.css
              const sheet = document.createElement('style'); sheet.textContent = css; document.head.append(sheet)
            }
            const style = getComputedStyle(target), background = style.backgroundImage
            let imageLoaded = false
            if (background.startsWith('url(')) {
              const image = new Image(); image.src = background.slice(4, -1).replace(/^['"]|['"]$/g, '')
              try { await image.decode(); imageLoaded = image.naturalWidth === 1 } catch {}
            }
            return { before, color: style.color, imageLoaded }
          }, scenario)
          const pass = value.before === 'rgb(0, 0, 0)' && value.color === (scenario === 'unused' ? 'rgb(0, 0, 0)' : 'rgb(0, 0, 255)') && (!resource || scenario === 'unused' || value.imageLoaded) && !missing.length && !errors.length
          const row = { scenario, managed, phase: 'browser', browser: name, value, missing, errors, result: pass ? 'PASS' : 'FAIL' }
          rows.push(row); console.log(JSON.stringify(row))
        } finally { await browser.close() }
      }
    }
  }
  const summary = { builds: 10, comparisons: rows.filter(row => row.phase === 'browser').length, failures: rows.filter(row => row.result === 'FAIL').length, baselineAssetObservations: rows.filter(row => row.result === 'BASELINE').length }
  console.log(JSON.stringify(summary)); assert.equal(summary.failures, 0)
} finally { rmSync(root, { recursive: true, force: true }) }
