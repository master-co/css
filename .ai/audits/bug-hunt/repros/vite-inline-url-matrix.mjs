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
const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-url-matrix-'))), rows = []
const modes = ['static', 'runtime', 'relative', 'absolute', 'fallback-cdn', 'fallback-relative']
try {
  writeFileSync(join(root, 'server.js'), 'import css from "./style.css?inline";export {css}')
  writeFileSync(join(root, 'client.js'), 'import css from "./style.css?inline";window.clientCSS=css')
  writeFileSync(join(root, 'style.css'), '@import "./external.css" layer(shared);@master entry;@preserve native;.example{background:url("./pixel.svg?q=one/../two&encoded=%20#part");--literal:"https://master-css-relocation.invalid/literal"}')
  writeFileSync(join(root, 'external.css'), '@import "https://url-external.test/paint.css";.child{background:url("./pixel.svg?q=one/../two&encoded=%20#part")}')
  writeFileSync(join(root, 'pixel.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>')
  for (const mode of modes) {
    const calls = [], clientDir = join(root, mode + '-client'), serverDir = join(root, mode + '-server')
    const customBase = 'https://custom-assets.test/relocated/with space/"quoted"/'
    const base = mode === 'relative' || mode === 'fallback-cdn' ? 'https://base-assets.test/deployed/' : mode === 'fallback-relative' ? './' : '/deployed/'
    const hook = (filename, context) => {
      calls.push({ filename, ...context })
      if (mode === 'static' || (mode === 'runtime' && context.hostType !== 'js')) return customBase + filename
      if (mode === 'runtime') return { runtime: `globalThis.__bhInlineAssetURL(${JSON.stringify(filename)})` }
      if (mode === 'relative') return { relative: true }
      if (mode === 'absolute') return { relative: false }
    }
    const common = { root, base, configFile: false, logLevel: 'silent', experimental: { renderBuiltUrl: hook } }
    const output = { assetFileNames: 'styles/deep/[name]-[hash][extname]' }
    const client = await build({ ...common, plugins: createMasterCSSVitePlugin({ mode: 'static', runtime: false }), build: { outDir: clientDir, minify: false, rolldownOptions: { input: join(root, 'client.js'), output } } })
    const server = await build({ ...common, plugins: createMasterCSSVitePlugin({ mode: 'static', runtime: false }), build: { outDir: serverDir, ssr: join(root, 'server.js'), ssrEmitAssets: true, minify: false, rolldownOptions: { output: { ...output, entryFileNames: 'server.mjs' } } } })
    globalThis.__bhInlineAssetURL = filename => customBase + filename
    const { css } = await import(pathToFileURL(join(serverDir, 'server.mjs')).href)
    delete globalThis.__bhInlineAssetURL
    const entry = client.output.find(item => item.type === 'chunk' && item.isEntry).fileName
    for (const host of ['client', 'server']) {
      for (const name of ['chromium', 'firefox', 'webkit']) {
        const browser = await browsers[name].launch()
        try {
          const page = await browser.newPage(), missing = [], errors = [], requested = []
          page.on('pageerror', error => errors.push(error.message))
          await page.route('**/*', route => {
            const url = new URL(route.request().url()); requested.push(url.href)
            if (url.host === 'url-external.test') return route.fulfill({ contentType: 'text/css', body: '.example{color:blue}' })
            if (url.pathname === '/deployed/index.html') {
              const setup = `<script>globalThis.__bhInlineAssetURL=filename=>${JSON.stringify(customBase)}+filename</script>`
              return route.fulfill({ contentType: 'text/html', body: `${setup}${host === 'server' ? `<style>${css}</style>` : `<script type="module" src="/deployed/${entry}"></script>`}<div class="example">URL</div><div class="child">child</div>` })
            }
            const relative = decodeURIComponent(url.pathname).replace(/^\/(?:deployed\/|relocated\/with space\/"quoted"\/)/, '')
            const file = join(host === 'server' ? serverDir : clientDir, relative)
            if (!existsSync(file)) { missing.push(url.href); return route.fulfill({ status: 404, body: 'missing' }) }
            return route.fulfill({ contentType: { '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' }[extname(file)], body: readFileSync(file) })
          })
          await page.goto('http://inline-url.test/deployed/index.html')
          if (host === 'client') {
            await page.evaluate(() => { const style=document.createElement('style');style.onload=()=>window.ready=true;style.textContent=window.clientCSS;document.head.append(style) })
            await page.waitForFunction(() => window.ready)
          }
          const value = await page.evaluate(async () => {
            const style = getComputedStyle(document.querySelector('.example')), backgrounds = [style.backgroundImage, getComputedStyle(document.querySelector('.child')).backgroundImage]
            const loaded = await Promise.all(backgrounds.map(async background => { const image=new Image();image.src=background.slice(4,-1).replace(/^['"]|['"]$/g,'');try{await image.decode();return image.naturalWidth===1}catch{return false} }))
            return { color: style.color, literal: style.getPropertyValue('--literal'), backgrounds, loaded }
          })
          const imageURLs = requested.filter(url => url.includes('.svg'))
          const metadata = calls.some(call => call.ssr === (host === 'server') && call.hostType === 'js' && call.filename.includes('master-css-resource-')) && calls.some(call => call.ssr === (host === 'server') && call.hostType === 'css' && call.filename.includes('master-css-resource-'))
          const expectedHost = ['static','runtime'].includes(mode) ? 'custom-assets.test' : mode === 'fallback-cdn' || mode === 'relative' && host === 'server' ? 'base-assets.test' : 'inline-url.test'
          const pass = metadata && value.color === 'rgb(0, 0, 255)' && value.loaded.every(Boolean) && value.literal === '"https://master-css-relocation.invalid/literal"' && imageURLs.length > 0 && imageURLs.every(url => new URL(url).host === expectedHost && new URL(url).search.includes('q=one/../two&encoded=%20')) && !missing.length && !errors.length
          const row = { mode, host, browser: name, value, imageURLs, metadata, missing, errors, result: pass ? 'PASS' : 'FAIL' }; rows.push(row); console.log(JSON.stringify(row))
        } finally { await browser.close() }
      }
    }
  }
  const summary = { modes: modes.length, builds: modes.length * 2, comparisons: rows.length, failures: rows.filter(row => row.result === 'FAIL').length }
  console.log(JSON.stringify(summary)); assert.equal(summary.failures, 0)
} finally { delete globalThis.__bhInlineAssetURL; rmSync(root, { recursive: true, force: true }) }
