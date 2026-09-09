import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, realpathSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, extname } from 'node:path'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { build } = await import(require.resolve('vite'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-inline-worker-'))), rows = []
try {
  writeFileSync(join(root, 'index.html'), '<div class="example">worker CSS</div><script type="module" src="./entry.js"></script>')
  writeFileSync(join(root, 'worker.js'), 'import css from "./style.css?inline";self.postMessage(css)')
  writeFileSync(join(root, 'style.css'), '@import "./external.css" layer(shared);@master entry;@preserve native;.example{background:url(./pixel.svg?q=1#part)}')
  writeFileSync(join(root, 'external.css'), '@import "https://worker-external.test/paint.css";')
  writeFileSync(join(root, 'pixel.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>')
  for (const format of ['iife', 'es']) {
    writeFileSync(join(root, 'entry.js'), 'const worker=new Worker(new URL("./worker.js",import.meta.url),WORKER_OPTIONS);worker.onmessage=({data:css})=>{window.css=css;const style=document.createElement("style");style.textContent=css;style.onload=()=>window.ready=true;document.head.append(style)};worker.onerror=event=>window.workerError=event.message'.replace('WORKER_OPTIONS', format === 'es' ? '{type:"module"}' : '{}'))
    const outDir = join(root, format)
    await build({ root, base: './', configFile: false, logLevel: 'silent', plugins: createMasterCSSVitePlugin({ mode: 'static', runtime: false }), worker: { format, plugins: () => createMasterCSSVitePlugin({ mode: 'static', runtime: false }), rolldownOptions: { output: { assetFileNames: 'styles/deep/[name]-[hash][extname]', entryFileNames: 'workers/deep/[name]-[hash].js' } } }, build: { outDir } })
    for (const name of ['chromium', 'firefox', 'webkit']) {
      const browser = await browsers[name].launch()
      try {
        const page = await browser.newPage(), missing = [], errors = []
        page.on('pageerror', error => errors.push(error.message))
        await page.route('**/*', route => {
          const url = new URL(route.request().url())
          if (url.host === 'worker-external.test') return route.fulfill({ contentType: 'text/css', body: '.example{color:blue}' })
          const file = join(outDir, url.pathname.replace(/^\/deployed\//, ''))
          if (!existsSync(file)) { missing.push(url.href); return route.fulfill({ status: 404, body: 'missing' }) }
          return route.fulfill({ contentType: { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }[extname(file)], body: readFileSync(file) })
        })
        await page.goto('http://inline-worker.test/deployed/index.html')
        await page.waitForFunction(() => window.ready || window.workerError)
        const value = await page.evaluate(async () => {
          const style = getComputedStyle(document.querySelector('.example')), image = new Image()
          image.src = style.backgroundImage.slice(4, -1).replace(/^['"]|['"]$/g, '')
          let imageLoaded = false; try { await image.decode(); imageLoaded = image.naturalWidth === 1 } catch {}
          return { color: style.color, imageLoaded, css: window.css, workerError: window.workerError }
        })
        const row = { format, browser: name, value, missing, errors, result: value.color === 'rgb(0, 0, 255)' && value.imageLoaded && !value.workerError && !missing.length && !errors.length ? 'PASS' : 'FAIL' }; rows.push(row); console.log(JSON.stringify(row))
      } finally { await browser.close() }
    }
  }
  const summary = { builds: 2, comparisons: rows.length, failures: rows.filter(row => row.result === 'FAIL').length }
  console.log(JSON.stringify(summary)); assert.equal(summary.failures, 0)
} finally { rmSync(root, { recursive: true, force: true }) }
