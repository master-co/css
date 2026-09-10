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
function fixture(padding, missing = false) {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'vite-manifest-lifecycle-browser-'))), root = join(parent, 'app'), dependency = join(parent, 'external/deep/tokens.css')
  mkdirSync(root);mkdirSync(join(parent, 'external'));symlinkSync(join(workspace, 'packages/vite/node_modules'), join(root, 'node_modules'), 'dir')
  writeFileSync(join(root, 'style.css'), '@master entry;@reference "../external/deep/tokens.css";@components{card{@compose paint;}}.target{@compose paint;}')
  writeFileSync(join(root, 'entry.js'), 'import "./style.css";import manifest from "virtual:master-css-manifest";window.ready=manifest.utilities.some(item=>item.name==="card");if(import.meta.hot)import.meta.hot.accept("virtual:master-css-manifest",module=>{if(module){window.ready=module.default.utilities.some(item=>item.name==="card");window.lastManifest=module.default;window.manifestUpdates=(window.manifestUpdates||0)+1}});')
  writeFileSync(join(root, 'index.html'), '<!doctype html><html><body><div id="target" class="card target"></div><div id="runtime-probe" class="card"></div><script type="module" src="./entry.js"></script></body></html>')
  const write = (invalid = false, value = padding) => { mkdirSync(dirname(dependency), { recursive: true });writeFileSync(dependency, invalid ? '@utilities{paint{@compose lifecycle-invalid-class;}}' : `@utilities{paint{padding:${value}rem}}`) }
  if (!missing) write()
  return { parent, root, dependency, write }
}
for (const mode of ['static', 'runtime', 'pre-render', 'progressive']) {
  if (process.env.BH_MODE && mode !== process.env.BH_MODE) continue
  const fixtures = [fixture(7), fixture(9, true)], servers = [], clients = [], plugins = createMasterCSSVitePlugin({ mode })
  const record = (client, phase) => { const row = { mode, browser: client.browserName, phase, pass: true };rows.push(row);console.log(JSON.stringify(row)) }
  try {
    for (const f of fixtures) {
      const server = await createServer({ root: f.root, configFile: false, logLevel: 'silent', plugins: [plugins, { name: 'test:lost-bootstrap-watch', configureServer(server) { server.watcher.add = () => server.watcher } }], server: { host: '127.0.0.1', port: 0, fs: { allow: [f.parent, workspace] } } })
      servers.push(server);await server.listen()
    }
    for (const browserName of ['chromium', 'firefox', 'webkit']) {
      const browser = await browsers[browserName].launch(), healthy = await browser.newPage(), pending = await browser.newPage(), errors = [], messages = []
      const client = { browserName, browser, healthy, pending, errors, messages };clients.push(client)
      for (const page of [healthy, pending]) page.on('pageerror', error => errors.push(error.message))
      pending.on('websocket', socket => socket.on('framereceived', frame => { try { messages.push(JSON.parse(String(frame.payload))) } catch {} }))
      await healthy.goto(servers[0].resolvedUrls.local[0]);await healthy.waitForFunction(() => window.ready && getComputedStyle(document.querySelector('#target')).paddingTop === '112px');record(client, 'healthy-owner')
      assert.equal((await pending.goto(servers[1].resolvedUrls.local[0])).status(), 500)
      await pending.waitForFunction(() => document.querySelector('vite-error-overlay')?.shadowRoot?.textContent.includes('tokens.css'));record(client, 'failed-owner')
    }
    const previous = servers[1].environments.client, origin = servers[1].resolvedUrls.local[0]
    const navigations = clients.map(client => client.pending.waitForNavigation({ waitUntil: 'load' }))
    await previous.waitForRequestsIdle();await servers[1].restart()
    assert.notEqual(servers[1].environments.client, previous);assert.equal(servers[1].resolvedUrls.local[0], origin)
    const responses = await Promise.all(navigations)
    for (const [index, client] of clients.entries()) {
      assert.equal(responses[index].status(), 500)
      await client.pending.waitForFunction(() => document.querySelector('vite-error-overlay')?.shadowRoot?.textContent.includes('tokens.css'));record(client, 'restarted-owner')
    }
    await servers[0].environments.client.waitForRequestsIdle();await servers[0].close()
    await servers[1].environments.ssr.close()
    fixtures[1].write(true)
    for (const client of clients) {
      await client.pending.waitForFunction(() => document.querySelector('vite-error-overlay')?.shadowRoot?.textContent.includes('lifecycle-invalid-class'))
      assert.ok(client.messages.some(message => message.type === 'error' && message.err?.message.includes('lifecycle-invalid-class')));record(client, 'new-diagnostic-after-other-closes')
    }
    fixtures[1].write()
    for (const client of clients) {
      await client.pending.waitForFunction(mode => window.ready && !document.querySelector('vite-error-overlay') && getComputedStyle(document.querySelector('#target')).paddingTop === '144px' && (mode !== 'runtime' || getComputedStyle(document.querySelector('#runtime-probe')).paddingTop === '144px'), mode)
      assert.deepEqual(client.errors, []);record(client, 'recovered-owner')
    }
    if (mode === 'runtime') {
      const reloads = [], send = servers[1].ws.send.bind(servers[1].ws)
      servers[1].ws.send = (...args) => { if (args[0]?.type === 'full-reload') reloads.push({ message: args[0], stack: new Error().stack });return send(...args) }
      for (const client of clients) { await client.pending.evaluate(() => { window.keepState = 'preserve' });client.messageStart = client.messages.length }
      const environment = servers[1].environments.client, module = environment.moduleGraph.getModuleById('\0virtual:master-css-manifest')
      // Establish successful HMR before testing error recovery. Vite itself
      // reloads when its first update encounters an existing error overlay.
      fixtures[1].write(false, 8);environment.moduleGraph.invalidateModule(module);await environment.reloadModule(module)
      for (const client of clients) {
        try { await client.pending.waitForFunction(() => getComputedStyle(document.querySelector('#runtime-probe')).paddingTop === '128px', undefined, { timeout: Number(process.env.BH_TIMEOUT ?? 30000) }) } catch (error) {
          console.log(JSON.stringify({ mode, browser: client.browserName, phase: 'valid-hmr-timeout', reloads, messages: client.messages.slice(client.messageStart), state: await client.pending.evaluate(() => ({ marker: window.keepState, manifestUpdates: window.manifestUpdates, definition: window.lastManifest?.utilities.find(item => item.name === 'card'), padding: getComputedStyle(document.querySelector('#runtime-probe')).paddingTop, sheets: Array.from(document.styleSheets).map(sheet => ({ owner: sheet.ownerNode?.outerHTML?.slice(0, 180), rules: Array.from(sheet.cssRules).filter(rule => rule.cssText.includes('.card')).map(rule => rule.cssText) })) })) }));throw error
        }
        assert.equal(await client.pending.evaluate(() => window.keepState), 'preserve');record(client, 'loaded-manifest-valid-hmr')
      }
      fixtures[1].write(true)
      assert.equal(module.isSelfAccepting, false);environment.moduleGraph.invalidateModule(module)
      const failure = await fetch(new URL('/@id/__x00__virtual:master-css-manifest', origin));assert.equal(failure.status, 500);assert.ok((await failure.text()).includes('lifecycle-invalid-class'))
      fixtures[1].write(false, 10)
      for (const client of clients) {
        await client.pending.waitForFunction(() => getComputedStyle(document.querySelector('#runtime-probe')).paddingTop === '160px')
        const marker = await client.pending.evaluate(() => window.keepState)
        if (marker !== 'preserve') console.log(JSON.stringify({ mode, browser: client.browserName, marker, reloads, messages: client.messages.slice(client.messageStart), graph: [...module.importers].map(importer => ({ id: importer.id, selfAccepting: importer.isSelfAccepting, accepts: [...importer.acceptedHmrDeps].map(dependency => dependency.id) })) }))
        assert.equal(marker, 'preserve')
        assert.equal(client.messages.slice(client.messageStart).some(message => message.type === 'full-reload'), false)
        assert.deepEqual(client.errors, []);record(client, 'loaded-manifest-hmr-state-preserved')
      }
    }
  } finally {
    for (const client of clients) await client.browser.close()
    for (const server of servers) { await server.environments.client.waitForRequestsIdle();await server.close() }
    for (const f of fixtures) rmSync(f.parent, { recursive: true, force: true })
  }
}
console.log(JSON.stringify({ summary: true, observations: rows.length, failures: rows.filter(row => !row.pass).length }))
