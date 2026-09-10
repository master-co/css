import assert from 'node:assert/strict'
import { mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { createServer } = await import(require.resolve('vite'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const workspace = realpathSync(new URL('../../../../', import.meta.url).pathname), rows = []
for (const mode of ['runtime', 'progressive']) for (const browserName of ['chromium', 'firefox', 'webkit']) for (const timing of ['pending', 'ready', 'burst']) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'vite-runtime-start-hmr-')))
  symlinkSync(join(workspace, 'packages/vite/node_modules'), join(root, 'node_modules'), 'dir')
  const style = join(root, 'style.css'), write = padding => writeFileSync(style, `@master entry;@components{card{padding:${padding}rem}}`)
  write(7)
  writeFileSync(join(root, 'entry.js'), 'import "./style.css";import manifest from "virtual:master-css-manifest";window.entryReady=true;window.keepState="retained";if(import.meta.hot)import.meta.hot.accept("virtual:master-css-manifest",module=>{window.latestManifest=module?.default;window.updates=(window.updates||0)+1});')
  writeFileSync(join(root, 'index.html'), '<!doctype html><html><body><div id="probe" class="card"></div><script type="module" src="/entry.js"></script></body></html>')
  let server, browser, release
  try {
    server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: createMasterCSSVitePlugin({ mode }), server: { host: '127.0.0.1', port: 0, watch: null, fs: { allow: [root, workspace] } } })
    await server.listen();browser = await browsers[browserName].launch()
    const page = await browser.newPage(), errors = [], messages = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('websocket', socket => socket.on('framereceived', frame => { try { messages.push(JSON.parse(String(frame.payload))) } catch {} }))
    let requested
    const requestSeen = new Promise(resolve => { requested = resolve })
    const gate = new Promise(resolve => { release = resolve })
    await page.route('**/*.wasm*', async route => { requested(route.request().url());await gate;await route.continue() })
    await page.goto(server.resolvedUrls.local[0], { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => window.entryReady)
    const wasmURL = await requestSeen
    if (timing === 'ready') {
      release()
      await page.waitForFunction(() => getComputedStyle(document.querySelector('#probe')).paddingTop === '112px')
    } else assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#probe')).paddingTop), mode === 'runtime' ? '0px' : '112px')
    write(9)
    const environment = server.environments.client, module = environment.moduleGraph.getModuleById('\0virtual:master-css-manifest')
    environment.moduleGraph.invalidateModule(module);await environment.reloadModule(module)
    await page.waitForFunction(() => window.updates === 1)
    if (timing === 'burst') {
      write(10);environment.moduleGraph.invalidateModule(module);await environment.reloadModule(module)
      await page.waitForFunction(() => window.updates === 2)
    }
    release()
    let failure
    try { await page.waitForFunction(expected => getComputedStyle(document.querySelector('#probe')).paddingTop === expected, timing === 'burst' ? '160px' : '144px', { timeout: 4000 }) } catch (error) { failure = error.message }
    const state = await page.evaluate(() => ({ marker: window.keepState, updates: window.updates, latest: window.latestManifest?.utilities.find(item => item.name === 'card'), padding: getComputedStyle(document.querySelector('#probe')).paddingTop, styles: Array.from(document.querySelectorAll('style#master-css')).map(style => Array.from(style.sheet.cssRules).map(rule => rule.cssText)) }))
    const pass = !failure && state.marker === 'retained' && errors.length === 0 && !messages.some(message => message.type === 'full-reload')
    const row = { mode, browser: browserName, timing, pass, wasmURL, state, errors, failure, messages };rows.push(row);console.log(JSON.stringify(row))
  } finally {
    release?.();await browser?.close();await server?.environments.client.waitForRequestsIdle();await server?.close();rmSync(root, { recursive: true, force: true })
  }
}
console.log(JSON.stringify({ summary: true, observations: rows.length, failures: rows.filter(row => !row.pass).length }))
process.exitCode = rows.some(row => !row.pass) ? 1 : 0
