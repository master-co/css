import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { createServer } = await import(require.resolve('vite'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const workspace = realpathSync(new URL('../../../../', import.meta.url).pathname), rows = []
for (const runtime of [false, true]) for (const mode of ['static', 'runtime', 'pre-render', 'progressive']) {
  if (process.env.BH_MODE && mode !== process.env.BH_MODE) continue
  if (process.env.BH_RUNTIME && String(runtime) !== process.env.BH_RUNTIME) continue
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'vite-manifest-startup-browser-'))), root = join(parent, 'app'), dependency = join(parent, 'external/nested/tokens.css'), clients = []
  mkdirSync(root);mkdirSync(join(parent, 'external'))
  symlinkSync(join(workspace, 'packages/vite/node_modules'), join(root, 'node_modules'), 'dir')
  writeFileSync(join(root, 'style.css'), '@master entry;@reference "../external/nested/tokens.css";@components{card{@compose paint;}}.target{@compose paint;}')
  writeFileSync(join(root, 'entry.js'), 'import "./style.css";import manifest from "virtual:master-css-manifest";window.ready=manifest.utilities.some(item=>item.name==="card");')
  writeFileSync(join(root, 'index.html'), '<!doctype html><html><body><div id="target" class="card target"></div><script type="module" src="./entry.js"></script></body></html>')
  let server
  try {
    server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: [createMasterCSSVitePlugin({ mode, runtime }), { name: 'test:lost-manifest-watch-registration', configureServer(server) { server.watcher.add = () => server.watcher } }], server: { host: '127.0.0.1', port: 0, fs: { allow: [parent, workspace] } } });await server.listen()
    for (const browserName of ['chromium', 'firefox', 'webkit']) {
      const browser = await browsers[browserName].launch(), page = await browser.newPage(), messages = [], errors = []
      clients.push({ browserName, browser, page, messages, errors })
      page.on('pageerror', error => errors.push(error.message))
      page.on('websocket', socket => socket.on('framereceived', frame => { try { messages.push(JSON.parse(String(frame.payload))) } catch {} }))
      const response = await page.goto(server.resolvedUrls.local[0]);assert.equal(response.status(), 500)
      await page.waitForFunction(() => document.querySelector('vite-error-overlay')?.shadowRoot?.textContent.includes('tokens.css'))
      assert.equal(await page.evaluate(() => Boolean(window.ready)), false)
      const row = { mode, runtime, browser: browserName, phase: 'initial-error', pass: true };rows.push(row);console.log(JSON.stringify(row))
    }
    mkdirSync(dirname(dependency), { recursive: true });writeFileSync(dependency, '@utilities{paint{@compose definitely-missing-class;}}')
    for (const client of clients) {
      await client.page.waitForFunction(() => document.querySelector('vite-error-overlay')?.shadowRoot?.textContent.includes('definitely-missing-class'))
      assert.ok(client.messages.some(message => message.type === 'error' && message.err?.message.includes('definitely-missing-class')))
      assert.equal(await client.page.evaluate(() => Boolean(window.ready)), false)
      const row = { mode, runtime, browser: client.browserName, phase: 'updated-error', pass: true };rows.push(row);console.log(JSON.stringify(row))
    }
    writeFileSync(dependency, '@utilities{paint{padding:7rem}}')
    for (const client of clients) {
      try {
        await client.page.waitForFunction(() => window.ready && !document.querySelector('vite-error-overlay') && getComputedStyle(document.querySelector('#target')).paddingTop === '112px')
      } catch (error) {
        console.log(JSON.stringify({ mode, runtime, browser: client.browserName, failure: String(error), errors: client.errors, messages: client.messages.map(({ type, err }) => ({ type, error: err?.message })), page: await client.page.evaluate(() => ({ ready: window.ready, target: document.querySelector('#target')?.outerHTML, padding: document.querySelector('#target') && getComputedStyle(document.querySelector('#target')).paddingTop, overlay: document.querySelector('vite-error-overlay')?.shadowRoot?.textContent.slice(0, 1200) })) }))
        throw error
      }
      assert.deepEqual(client.errors, [])
      const row = { mode, runtime, browser: client.browserName, phase: 'recovered', pass: true };rows.push(row);console.log(JSON.stringify(row))
    }
  } finally { for (const { browser } of clients) await browser.close();await server?.environments.client.waitForRequestsIdle();await server?.close();rmSync(parent, { recursive: true, force: true }) }
}
console.log(JSON.stringify({ summary: true, observations: rows.length, failures: rows.filter(row => !row.pass).length }))
