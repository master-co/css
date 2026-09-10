import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { createServer } = await import(require.resolve('vite'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const rows = []
for (const mode of ['static', 'runtime', 'pre-render', 'progressive']) {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'vite-reconciliation-diagnostics-'))), root = join(parent, 'app'), external = join(parent, 'external'), clients = []
  mkdirSync(root);mkdirSync(external)
  const dependency = join(external, 'tokens.css')
  writeFileSync(join(root, 'style.css'), '@reference "../external/tokens.css";.target{@compose paint;}')
  writeFileSync(join(root, 'entry.js'), 'import "./style.css";window.ready=true;if(import.meta.hot)import.meta.hot.accept("./style.css",()=>{});')
  writeFileSync(join(root, 'index.html'), '<div id="target" class="target"></div><script type="module" src="./entry.js"></script>')
  let server
  try {
    server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: createMasterCSSVitePlugin({ mode, runtime: false }), server: { host: '127.0.0.1', port: 0, fs: { allow: [parent] } } });await server.listen()
    server.watcher.add = () => server.watcher
    for (const browserName of ['chromium', 'firefox', 'webkit']) {
      const browser = await browsers[browserName].launch(), page = await browser.newPage(), messages = [], errors = []
      clients.push({ browserName, browser, page, messages, errors })
      page.on('pageerror', error => errors.push(error.message))
      page.on('websocket', socket => socket.on('framereceived', frame => { try { messages.push(JSON.parse(String(frame.payload))) } catch {} }))
      const failed = page.waitForResponse(response => response.status() === 500)
      await page.goto(server.resolvedUrls.local[0]);await failed
      assert.equal(await page.evaluate(() => Boolean(window.ready)), false)
    }
    writeFileSync(dependency, '@utilities{paint{@compose definitely-missing-class;}}')
    for (const client of clients) {
      await client.page.waitForFunction(() => document.querySelector('vite-error-overlay')?.shadowRoot?.textContent.includes('definitely-missing-class'))
      assert.ok(client.messages.some(message => message.type === 'error' && message.err?.message.includes('definitely-missing-class')))
      assert.equal(await client.page.evaluate(() => Boolean(window.ready)), false)
      assert.deepEqual(client.errors, [])
      const row = { mode, browser: client.browserName, phase: 'updated-error', pass: true };rows.push(row);console.log(JSON.stringify(row))
    }
    writeFileSync(dependency, '@utilities{paint{padding:7rem}}')
    for (const client of clients) {
      await client.page.waitForFunction(() => window.ready && !document.querySelector('vite-error-overlay') && getComputedStyle(document.querySelector('#target')).paddingTop === '112px')
      assert.deepEqual(client.errors, [])
      const row = { mode, browser: client.browserName, phase: 'recovered', pass: true };rows.push(row);console.log(JSON.stringify(row))
    }
  } finally { for (const { browser } of clients) await browser.close();await server?.environments.client.waitForRequestsIdle();await server?.close();rmSync(parent, { recursive: true, force: true }) }
}
console.log(JSON.stringify({ summary: true, observations: rows.length, failures: rows.filter(row => !row.pass).length }))
