import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, realpathSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { createServer, createRunnableDevEnvironment, isRunnableDevEnvironment } = await import(require.resolve('vite'))
const engines = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const rows = [], ssrRows = [], hosts = [], perEnvironment = process.env.BH_PER_ENV === '1', replace = process.env.BH_REPLACE === '1'
const colors = { red: 'rgb(255, 0, 0)', green: 'rgb(0, 128, 0)', purple: 'rgb(128, 0, 128)' }
for (const managed of [false, true]) for (const closing of ['edge', 'ssr']) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-custom-environments-'))), clients = [], messages = []
  let server
  try {
    mkdirSync(join(root, 'node_modules'))
    symlinkSync(dirname(createRequire(require.resolve('vite')).resolve('sass')), join(root, 'node_modules/sass'), 'dir')
    const partial = join(root, '_tokens.scss')
    writeFileSync(partial, '$tone:red;')
    writeFileSync(join(root, 'style.scss'), '@use "./tokens";' + (managed ? '@master entry;@preserve native;' : '') + '.example{color:tokens.$tone}')
    writeFileSync(join(root, 'server.js'), 'export {default as css} from "./style.scss?inline"')
    writeFileSync(join(root, 'index.html'), '<link rel="stylesheet" href="/style.scss"><div id="target" class="example">test</div><script type="module">import "/@vite/client";window.ready=true;</script>')
    server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: managed ? createMasterCSSVitePlugin({ mode: 'static', runtime: false }) : [], environments: { edge: { consumer: 'server', dev: { createEnvironment: (name, config) => createRunnableDevEnvironment(name, config) } } }, server: { host: '127.0.0.1', port: 0, perEnvironmentStartEndDuringDev: perEnvironment } })
    await server.listen()
    const edge = server.environments.edge
    assert.ok(isRunnableDevEnvironment(edge))
    const consumers = { ssr: () => server.ssrLoadModule('/server.js'), edge: () => edge.runner.import('/server.js') }
    for (const [name, environment] of Object.entries(server.environments)) {
      const send = environment.hot.send.bind(environment.hot)
      environment.hot.send = (...args) => { messages.push({ name, consumer: environment.config.consumer, payload: args[0] });return send(...args) }
    }
    for (const name of ['chromium', 'firefox', 'webkit']) {
      const browser = await engines[name].launch(), page = await browser.newPage(), errors = []
      const client = { name, browser, page, errors, connected: false };clients.push(client)
      page.on('websocket', socket => socket.on('framereceived', frame => { try { if (JSON.parse(String(frame.payload)).type === 'connected') client.connected = true } catch {} }))
      page.on('pageerror', error => errors.push(error.message))
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
      await page.addInitScript(() => { window.bootID = Math.random() })
      await page.goto(server.resolvedUrls.local[0])
    }
    for (const phase of ['initial', 'closed', 'partial-update', 'second-update']) {
      const color = phase === 'partial-update' ? 'green' : phase === 'second-update' ? 'purple' : 'red'
      if (phase === 'closed') {
        const old = server.environments[closing]
        if (replace) {
          const replacement = createRunnableDevEnvironment(closing, server.config)
          await replacement.init({ watcher: server.watcher, previousInstance: old })
          server.environments[closing] = replacement
          await old.close()
          await replacement.listen(server)
          consumers[closing] = () => replacement.runner.import('/server.js')
          const send = replacement.hot.send.bind(replacement.hot)
          replacement.hot.send = (...args) => { messages.push({ name: closing, consumer: replacement.config.consumer, payload: args[0] });return send(...args) }
        } else await old.close()
      }
      messages.length = 0
      if (phase.endsWith('update')) writeFileSync(partial, `$tone:${color};`)
      for (const client of clients) {
        let error
        try {
          await client.page.waitForFunction(expected => window.ready && getComputedStyle(document.querySelector('#target')).color === expected, colors[color], { timeout: 15000 })
          const deadline = Date.now() + 10000
          while (!client.connected && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 25))
          assert.ok(client.connected, 'Vite WebSocket did not connect')
        } catch (cause) { error = String(cause) }
        const value = await client.page.evaluate(() => ({ color: getComputedStyle(document.querySelector('#target')).color, bootID: window.bootID }))
        if (phase === 'initial') client.bootID = value.bootID
        const row = { managed, perEnvironment, replace, closing, phase, browser: client.name, expected: colors[color], value, errors: [...client.errors], error, result: !error && value.color === colors[color] && value.bootID === client.bootID && !client.errors.length ? 'PASS' : 'FAIL' }
        rows.push(row);console.log(JSON.stringify(row))
      }
      for (const [consumer, load] of Object.entries(consumers)) {
        if (!replace && phase !== 'initial' && consumer === closing) continue
        let css = '', rendered, error
        const deadline = Date.now() + 5000
        do {
          try { css = (await load()).css;error = undefined } catch (cause) { error = String(cause) }
          rendered = await Promise.all(clients.map(client => client.page.evaluate(css => { const host = document.createElement('div');document.body.append(host);const root = host.attachShadow({ mode: 'open' });const style = document.createElement('style');style.textContent=css;const target=document.createElement('div');target.className='example';root.append(style,target);const color=getComputedStyle(target).color;host.remove();return color }, css)))
          if (!error && rendered.every(value => value === colors[color]) || Date.now() >= deadline) break
          await new Promise(resolve => setTimeout(resolve, 25))
        } while (true)
        const serverCSS = messages.filter(message => message.consumer === 'server' && message.payload?.updates?.some(update => update.type === 'css-update'))
        const row = { managed, perEnvironment, replace, closing, phase, consumer, css, rendered, error, serverCSS, result: !error && rendered.every(value => value === colors[color]) && !serverCSS.length ? 'PASS' : 'FAIL' }
        ssrRows.push(row);console.log(JSON.stringify({ kind: 'ssr', ...row }))
      }
    }
  } catch (error) { const row = { managed, perEnvironment, replace, closing, error: String(error), result: 'FAIL' };hosts.push(row);console.log(JSON.stringify({ kind: 'host-error', ...row })) }
  finally { for (const client of clients) await client.browser.close();await server?.close();rmSync(root, { recursive: true, force: true }) }
}
const summary = { browserComparisons: rows.length, browserFailures: rows.filter(row => row.result === 'FAIL').length, ssrOutputs: ssrRows.length, ssrFailures: ssrRows.filter(row => row.result === 'FAIL').length, hostErrors: hosts.length }
console.log(JSON.stringify(summary));assert.equal(summary.browserFailures + summary.ssrFailures + summary.hostErrors, 0)
