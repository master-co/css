import assert from 'node:assert/strict'
import { createServer as createHTTPServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { join, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const workspace = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { build, createServer } = await import(require.resolve('vite'))
const engines = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const parent = join(workspace, 'packages/vite/tmp');mkdirSync(parent, { recursive: true })
const rows = [], builds = [], buildOnly = process.env.BH_TARGET === 'build', supported = process.env.BH_SUPPORTS !== 'false'
for (const mode of ['pre-render', 'progressive']) {
  const root = realpathSync(mkdtempSync(join(parent, 'qualified-prerender-'))), clients = []
  let dev
  const http = createHTTPServer((request, response) => {
    const url = new URL(request.url, 'http://localhost')
    if (url.pathname === '/external.css' || url.pathname === '/external-nested.css') {
      response.setHeader('Content-Type', 'text/css')
      response.end(url.pathname === '/external.css' ? '@import "./external-nested.css";.external{margin-left:17px}' : '.external{outline:7px solid rgb(20,30,40)}');return
    }
    const dist = join(root, 'dist'), file = resolve(dist, decodeURIComponent(url.pathname.replace(/^\/base\//, '')) || 'index.html')
    if (!file.startsWith(dist + '/')) { response.statusCode = 404;response.end();return }
    try { response.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.wasm': 'application/wasm' })[extname(file)] ?? 'application/octet-stream');response.setHeader('Cache-Control', 'no-store');response.end(readFileSync(file)) }
    catch { response.statusCode = 404;response.end() }
  })
  const entry = color => `@layer fallback,shared;@import "./styles/branch.css" layer(shared) supports(display:${supported ? 'grid' : 'not-a-layout'}) screen and (min-width:700px);@master entry;@preserve native;@theme{--color-accent:${color}}@components{card{color:var(--color-accent)}}@layer fallback{.external{margin-left:3px;outline:none}.conditional{background:rgb(1,2,3);padding-left:0}}`
  try {
    await new Promise(resolve => http.listen(0, '127.0.0.1', resolve))
    const origin = `http://127.0.0.1:${http.address().port}`
    mkdirSync(join(root, 'styles'))
    writeFileSync(join(root, 'style.css'), entry('#123456'))
    writeFileSync(join(root, 'styles/branch.css'), `@import "${origin}/external.css";.conditional{padding-left:var(--spacing-5xl);background:rgb(12,34,56)}.resource{background-image:url("pixel.svg?q=1#part")}`)
    writeFileSync(join(root, 'styles/pixel.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><title>branch-owned</title><rect width="1" height="1" fill="red"/></svg>')
    writeFileSync(join(root, 'index.html'), '<!doctype html><html><head><meta charset="utf-8"></head><body><div id="card" class="card p:0.125rem">card</div><div id="external" class="external">external</div><div id="conditional" class="conditional resource">conditional</div><script type="module" src="./client.js"></script></body></html>')
    writeFileSync(join(root, 'client.js'), 'import "./style.css";window.ready=true')
    const plugins = createMasterCSSVitePlugin({ mode })
    try {
      await build({ root, configFile: false, logLevel: 'silent', base: '/base/', plugins, build: { minify: false, cssMinify: false } })
      const html = readFileSync(join(root, 'dist/index.html'), 'utf8')
      assert.ok(html.includes('id="master-css"'));assert.ok(html.includes('master-css-hydration.'))
      builds.push({ mode, result: 'PASS' })
    } catch (error) { builds.push({ mode, result: 'FAIL', error: String(error) });continue }
    if (!buildOnly) { dev = await createServer({ root, configFile: false, logLevel: 'silent', base: '/base/', plugins, server: { host: '127.0.0.1', port: 0 } });await dev.listen() }
    for (const browserName of ['chromium', 'firefox', 'webkit']) {
      const browser = await engines[browserName].launch();const client = { browser, browserName, pages: [] };clients.push(client)
      for (const target of buildOnly ? ['build'] : ['build', 'dev']) {
        const page = await browser.newPage(), errors = [], requests = []
        page.on('pageerror', error => errors.push(error.message))
        page.on('response', response => { requests.push(response.url());if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
        client.pages.push({ page, target, errors, requests })
        await page.setViewportSize({ width: 900, height: 600 });await page.goto(target === 'build' ? origin + '/base/' : dev.resolvedUrls.local[0])
      }
    }
    for (const phase of ['wide', 'narrow', 'wide-again', ...(!buildOnly ? ['theme-update'] : [])]) {
      const width = phase === 'narrow' ? 400 : 900
      if (phase === 'theme-update') writeFileSync(join(root, 'style.css'), entry('#654321'))
      for (const client of clients) for (const item of client.pages) {
        const { page, target, errors, requests } = item
        const expectedColor = phase === 'theme-update' && target === 'dev' ? 'rgb(101, 67, 33)' : 'rgb(18, 52, 86)'
        let error, value
        try {
          await page.setViewportSize({ width, height: 600 })
          await page.waitForFunction(({ wide, color }) => {
            const card = getComputedStyle(document.querySelector('#card')), external = getComputedStyle(document.querySelector('#external')), conditional = getComputedStyle(document.querySelector('#conditional'))
            return window.ready && card.color === color && card.paddingTop === '2px' && external.marginLeft === (wide ? '17px' : '3px') && (wide ? external.outlineWidth === '7px' && external.outlineStyle === 'solid' : external.outlineStyle === 'none') && conditional.backgroundColor === (wide ? 'rgb(12, 34, 56)' : 'rgb(1, 2, 3)') && (wide ? parseFloat(conditional.paddingLeft) > 0 : conditional.paddingLeft === '0px')
          }, { wide: supported && width >= 700, color: expectedColor }, { timeout: 15000 })
          value = await page.evaluate(() => { const card = getComputedStyle(document.querySelector('#card')), external = getComputedStyle(document.querySelector('#external')), conditional = getComputedStyle(document.querySelector('#conditional'));return { color: card.color, padding: card.paddingTop, margin: external.marginLeft, outline: external.outlineWidth, outlineStyle: external.outlineStyle, background: conditional.backgroundColor, conditionalPadding: conditional.paddingLeft, resource: conditional.backgroundImage, styles: document.querySelectorAll('style#master-css').length } })
          assert.equal(value.styles, 1)
          if (supported && width >= 700) {
            const url = value.resource.match(/^url\(["']?(.*?)["']?\)$/)?.[1];assert.ok(url)
            const response = await page.request.get(url);assert.equal(response.status(), 200);assert.ok((await response.text()).includes('branch-owned'))
            assert.ok(requests.some(url => url.endsWith('/external.css')));assert.ok(requests.some(url => url.endsWith('/external-nested.css')))
          }
          if (!supported || width < 700) assert.equal(value.resource, 'none')
          assert.deepEqual(errors, [])
        } catch (cause) { error = String(cause) }
        const row = { mode, target, browser: client.browserName, phase, width, expectedColor, value, errors: [...errors], error, result: error ? 'FAIL' : 'PASS' };rows.push(row);console.log(JSON.stringify(row))
      }
    }
  } finally { for (const client of clients) await client.browser.close();await dev?.close();await new Promise(resolve => http.close(resolve));rmSync(root, { recursive: true, force: true }) }
}
const summary = { buildOnly, supported, builds, browserComparisons: rows.length, browserFailures: rows.filter(row => row.result === 'FAIL').length }
console.log(JSON.stringify(summary));assert.equal(builds.filter(row => row.result === 'FAIL').length + summary.browserFailures, 0)
