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
for (const mode of ['runtime', 'progressive']) for (const order of ['manifest-first', 'globals-first']) for (const browserName of ['chromium', 'firefox', 'webkit']) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'vite-runtime-inputs-'))), style = join(root, 'style.css')
  symlinkSync(join(workspace, 'packages/vite/node_modules'), join(root, 'node_modules'), 'dir')
  const write = padding => writeFileSync(style, `@import "@master/css";@components{card{padding:${padding}rem}}`)
  write(7)
  writeFileSync(join(root, 'entry.js'), 'import "./style.css";import manifest from "virtual:master-css-manifest";import globals from "virtual:master-css-emitted-globals";window.entryReady=true;window.keepState="retained";window.updates=0;if(import.meta.hot)import.meta.hot.accept(["virtual:master-css-manifest","virtual:master-css-emitted-globals"],()=>window.updates++);')
  writeFileSync(join(root, 'index.html'), '<!doctype html><html><body><div id="probe" class="card fg:red-60"></div><script type="module" src="/entry.js"></script></body></html>')
  let globals = {}, server, browser
  try {
    // Supply explicit official-host resource metadata to isolate bootstrap input
    // retention. The matching native variable is inserted before its metadata update.
    server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: [{ name: 'test:emitted-input', enforce: 'pre', load(id) { if (id === '\0virtual:master-css-emitted-globals') return `export default ${JSON.stringify(globals)}` } }, createMasterCSSVitePlugin({ mode })], server: { host: '127.0.0.1', port: 0, watch: null, fs: { allow: [root, workspace] } } })
    await server.listen();browser = await browsers[browserName].launch()
    const page = await browser.newPage(), errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(server.resolvedUrls.local[0])
    await page.waitForFunction(() => window.entryReady && window.masterCSSRuntime?.snapshot().observing && getComputedStyle(document.querySelector('#probe')).paddingTop === '112px')
    const environment = server.environments.client
    let eventCount = 0, failure
    for (const input of order === 'manifest-first' ? ['manifest', 'globals'] : ['globals', 'manifest']) {
      if (input === 'manifest') write(9)
      else {
        await page.evaluate(() => { const style = document.createElement('style');style.textContent = ':root{--color-red-60:red}';document.head.appendChild(style) })
        globals = { variables: { 'color-red-60': 1 } }
      }
      const module = environment.moduleGraph.getModuleById(`\0virtual:master-css-${input === 'manifest' ? 'manifest' : 'emitted-globals'}`)
      assert.ok(module);environment.moduleGraph.invalidateModule(module);await environment.reloadModule(module)
      await page.waitForFunction(expected => window.updates >= expected, ++eventCount)
      await page.waitForFunction(() => window.masterCSSRuntime?.snapshot().observing)
    }
    try {
      await page.waitForFunction(() => getComputedStyle(document.querySelector('#probe')).paddingTop === '144px' && !Array.from(document.querySelector('style#master-css').sheet.cssRules).some(rule => rule.cssText.includes('--color-red-60:')), undefined, { timeout: 3000 })
    } catch (error) { failure = error.message }
    const state = await page.evaluate(() => ({ marker: window.keepState, padding: getComputedStyle(document.querySelector('#probe')).paddingTop, runtimeCSS: Array.from(document.querySelector('style#master-css').sheet.cssRules).map(rule => rule.cssText) }))
    const row = { mode, order, browser: browserName, pass: !failure && errors.length === 0 && state.marker === 'retained', state, errors, failure };rows.push(row);console.log(JSON.stringify(row))
  } finally { await browser?.close();await server?.environments.client.waitForRequestsIdle();await server?.close();rmSync(root, { recursive: true, force: true }) }
}
console.log(JSON.stringify({ summary: true, observations: rows.length, failures: rows.filter(row => !row.pass).length }))
process.exitCode = rows.some(row => !row.pass) ? 1 : 0
