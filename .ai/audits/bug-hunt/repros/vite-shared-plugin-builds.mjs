import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { join, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const workspace = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { build } = await import(require.resolve('vite'))
const engines = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const parent = join(workspace, 'packages/vite/tmp');mkdirSync(parent, { recursive: true })
const rows = [], builds = []
for (const mode of ['static', 'runtime', 'pre-render', 'progressive']) {
  const roots = [0, 1].map(() => realpathSync(mkdtempSync(join(parent, 'shared-browser-'))))
  const clients = []
  const plugins = createMasterCSSVitePlugin({ mode })
  const host = createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost'), index = url.pathname.startsWith('/root-0/') ? 0 : url.pathname.startsWith('/root-1/') ? 1 : -1
    if (index < 0) { response.statusCode = 404;response.end();return }
    const path = decodeURIComponent(url.pathname.slice('/root-0/'.length)) || 'index.html', dist = join(roots[index], 'dist'), file = resolve(dist, path)
    if (!file.startsWith(dist + '/')) { response.statusCode = 403;response.end();return }
    try { const bytes = readFileSync(file);response.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.wasm': 'application/wasm' })[extname(file)] ?? 'application/octet-stream');response.setHeader('Cache-Control', 'no-store');response.end(bytes) }
    catch { response.statusCode = 404;response.end() }
  })
  try {
    await new Promise(resolve => host.listen(0, '127.0.0.1', resolve))
    for (const name of ['chromium', 'firefox', 'webkit']) {
      const browser = await engines[name].launch();clients.push({ name, browser })
    }
    for (const phase of ['initial', 'reuse']) {
      const colors = phase === 'initial' ? ['#123456', '#abcdef'] : ['#234567', '#bcdef0']
      for (const [index, root] of roots.entries()) {
        writeFileSync(join(root, 'style.css'), `@master entry;@preserve native;@components{card{color:${colors[index]}}}.example{background-image:url(pixel.svg)}`)
        writeFileSync(join(root, 'pixel.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="${colors[index]}"/></svg>`)
        writeFileSync(join(root, 'index.html'), '<!doctype html><html><head><meta charset="utf-8"></head><body><div id="target" class="example card p:0.125rem">test</div><script type="module" src="./client.js"></script></body></html>')
        writeFileSync(join(root, 'client.js'), 'import "./style.css";window.ready=true')
      }
      const outcomes = await Promise.allSettled(roots.map((root, index) => build({ root, configFile: false, logLevel: 'silent', base: `/root-${index}/`, plugins, build: { minify: false, cssMinify: false } })))
      for (const [index, outcome] of outcomes.entries()) { builds.push({ mode, phase, index, result: outcome.status === 'fulfilled' ? 'PASS' : 'FAIL', error: outcome.status === 'rejected' ? String(outcome.reason) : undefined });console.log(JSON.stringify({ kind: 'build', ...builds.at(-1) })) }
      if (outcomes.some(outcome => outcome.status === 'rejected')) continue
      for (const [index] of roots.entries()) for (const client of clients) {
        const page = await client.browser.newPage(), errors = [], requests = []
        page.on('pageerror', error => errors.push(error.message))
        page.on('response', response => { requests.push({ url: response.url(), status: response.status() });if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
        let value, error
        try {
          const origin = `http://127.0.0.1:${host.address().port}`, expected = `rgb(${colors[index].slice(1).match(/../g).map(value => parseInt(value, 16)).join(', ')})`
          await page.goto(`${origin}/root-${index}/`)
          await page.waitForFunction(expected => window.ready && getComputedStyle(document.querySelector('#target')).color === expected && getComputedStyle(document.querySelector('#target')).paddingTop === '2px', expected)
          value = await page.locator('#target').evaluate(element => { const style = getComputedStyle(element);return { color: style.color, padding: style.paddingTop, background: style.backgroundImage } })
          assert.ok(value.background.includes(`/root-${index}/`))
          const resource = value.background.match(/^url\(["']?(.*?)["']?\)$/)?.[1]
          assert.ok(resource);const response = await page.request.get(resource);assert.equal(response.status(), 200);assert.ok((await response.text()).includes(colors[index]))
          assert.ok(requests.some(request => request.url.endsWith('.svg')))
          assert.ok(!requests.some(request => request.url.includes(`/root-${1 - index}/`)))
          assert.deepEqual(errors, [])
        } catch (cause) { error = String(cause) }
        const row = { mode, phase, root: index, browser: client.name, expected: colors[index], value, errors, requests, error, result: error ? 'FAIL' : 'PASS' };rows.push(row);console.log(JSON.stringify(row));await page.close()
      }
    }
  } finally { for (const client of clients) await client.browser.close();await new Promise(resolve => host.close(resolve));for (const root of roots) rmSync(root, { recursive: true, force: true }) }
}
const summary = { builds: builds.length, buildFailures: builds.filter(row => row.result === 'FAIL').length, browserComparisons: rows.length, browserFailures: rows.filter(row => row.result === 'FAIL').length }
console.log(JSON.stringify(summary));assert.equal(summary.buildFailures + summary.browserFailures, 0)
