import { createServer as createHttpServer } from 'node:http'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, realpathSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { createServer } = await import(require.resolve('vite'))
const engines = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const rows = [], ssrRows = [], liveRestart = process.env.BH_LIVE_RESTART === '1', middleware = process.env.BH_MIDDLEWARE === '1'
const cssColors = { red: 'rgb(255, 0, 0)', green: 'rgb(0, 128, 0)', blue: 'rgb(0, 0, 255)', purple: 'rgb(128, 0, 128)', orange: 'rgb(255, 165, 0)' }
for (const managed of process.env.BH_MANAGED ? [process.env.BH_MANAGED === '1'] : [false, true]) {
  const hosts = []
  try {
    for (const name of ['edited', 'independent']) {
      const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-sass-environments-'))), clients = [], messages = []
      const host = { root, name, clients, messages, generation: 0 };hosts.push(host)
      mkdirSync(join(root, 'node_modules'))
      symlinkSync(dirname(createRequire(require.resolve('vite')).resolve('sass')), join(root, 'node_modules/sass'), 'dir')
      const file = join(root, 'style.scss'), partial = join(root, '_tokens.scss')
      host.partial = partial
      writeFileSync(partial, `$tone:${name === 'edited' ? 'red' : 'purple'};`)
      writeFileSync(file, '@use "./tokens";' + (managed ? '@master entry;@preserve native;' : '') + '.example{color:tokens.$tone}')
      writeFileSync(join(root, 'server.js'), 'export {default as css} from "./style.scss?inline"')
      host.html = route => `<link id="style" rel="stylesheet" href="/${route}.scss"><div id="target" class="example" data-generation="__GEN__">test</div><script type="module">import '/@vite/client';window.ready=true;</script>`
      writeFileSync(join(root, 'index.html'), host.html(liveRestart ? '__ROUTE__' : 'old'))
      const plugins = managed ? createMasterCSSVitePlugin({ mode: 'static', runtime: false }) : []
      if (middleware) host.httpServer = createHttpServer((request, response) => host.server.middlewares(request, response, error => { response.statusCode = error ? 500 : 404;response.end(error ? String(error) : undefined) }))
      host.server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: [...plugins, { name: 'audit:sass-route', resolveId(id) { const clean = id.replace(/[?#].*$/, '');if (['/old.scss', '/new.scss', '/new2.scss'].includes(clean)) return file + id.slice(clean.length) }, transformIndexHtml(html) { return html.replaceAll('__GEN__', String(host.generation)).replaceAll('__ROUTE__', host.generation === 0 ? 'old' : host.generation === 1 ? 'new' : 'new2') } }], server: { host: '127.0.0.1', port: 0, ...(middleware ? { middlewareMode: true, ws: { server: host.httpServer } } : {}) } })
      if (middleware) {
        await new Promise(resolve => host.httpServer.listen(0, '127.0.0.1', resolve))
        host.url = `http://127.0.0.1:${host.httpServer.address().port}/`
      } else { await host.server.listen();host.url = host.server.resolvedUrls.local[0] }
      host.track = () => {
        for (const [environment, value] of Object.entries(host.server.environments)) {
          const send = value.hot.send.bind(value.hot)
          value.hot.send = (...args) => { messages.push({ environment, consumer: value.config.consumer, payload: args[0] });return send(...args) }
        }
      }
      host.track()
      await host.server.ssrLoadModule('/server.js')
      for (const browserName of ['chromium', 'firefox', 'webkit']) {
        const browser = await engines[browserName].launch(), page = await browser.newPage(), errors = []
        const client = { browser, page, browserName, errors, navigation: 0, connections: [] }
        page.on('framenavigated', frame => { if (frame === page.mainFrame()) client.navigation++ })
        page.on('websocket', socket => { const navigation = client.navigation;socket.on('framereceived', event => { try { if (JSON.parse(String(event.payload)).type === 'connected') client.connections.push(navigation) } catch {} }) })
        page.on('pageerror', error => errors.push(error.message))
        page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
        await page.addInitScript(() => { window.bootID = Math.random() })
        await page.goto(host.url);clients.push(client)
      }
    }
    for (const phase of ['initial', 'partial-update', 'restart', 'after-restart-update', ...(process.env.BH_REPEAT_RESTART ? ['restart-again', 'after-second-restart-update'] : [])]) {
      const color = phase === 'initial' ? 'red' : phase === 'after-second-restart-update' ? 'orange' : ['after-restart-update', 'restart-again'].includes(phase) ? 'blue' : 'green'
      const restarting = phase === 'restart' || phase === 'restart-again'
      if (restarting) {
        hosts[0].generation++
        if (!liveRestart) {
          for (const client of hosts[0].clients) await client.page.goto('about:blank')
          writeFileSync(join(hosts[0].root, 'index.html'), hosts[0].html(hosts[0].generation === 1 ? 'new' : 'new2'))
        }
        await hosts[0].server.restart();hosts[0].track()
        if (!liveRestart) for (const client of hosts[0].clients) { await client.page.goto(hosts[0].url);client.errors.length = 0 }
      }
      for (const host of hosts) host.messages.length = 0
      if (phase.endsWith('-update')) writeFileSync(hosts[0].partial, `$tone:${color};`)
      for (const host of hosts) {
        const expectedName = host.name === 'edited' ? color : 'purple', expected = cssColors[expectedName]
        await Promise.all(host.clients.map(async client => {
          let error
          try {
            await client.page.waitForFunction(({ expected, generation }) => window.ready && document.querySelector('#target')?.dataset.generation === String(generation) && getComputedStyle(document.querySelector('#target')).color === expected, { expected, generation: host.generation }, { timeout: 15000 })
            if (liveRestart) {
              const deadline = Date.now() + 15000
              while (!client.connections.includes(client.navigation) && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 25))
              assert.ok(client.connections.includes(client.navigation), 'Current page has not received the Vite connected message')
            }
          } catch (cause) { error = String(cause) }
          const value = await client.page.locator('#target').evaluate(element => ({ color: getComputedStyle(element).color, bootID: window.bootID, href: document.querySelector('#style')?.getAttribute('href'), generation: element.dataset.generation }))
          const previousBootID = client.bootID
          const reloaded = value.bootID !== previousBootID
          if (phase === 'initial' || restarting && host.name === 'edited') client.bootID = value.bootID
          const row = { liveRestart, middleware, managed, host: host.name, phase, previousBootID, reloaded, navigation: client.navigation, connections: [...client.connections], browser: client.browserName, expected, value, errors: [...client.errors], error, result: !error && value.color === expected && value.bootID === client.bootID && (!liveRestart || !restarting || host.name !== 'edited' || reloaded) && !client.errors.length ? 'PASS' : 'FAIL' }
          rows.push(row);console.log(JSON.stringify(row))
        }))
        let css = '', error, rendered, deadline = Date.now() + 7000
        do {
          try { css = (await host.server.ssrLoadModule('/server.js')).css;error = undefined } catch (cause) { error = String(cause) }
          rendered = await Promise.all(host.clients.map(client => client.page.evaluate(css => { const host = document.createElement('div');document.body.append(host);const shadow = host.attachShadow({ mode: 'open' });const style = document.createElement('style');style.textContent=css;const target=document.createElement('div');target.className='example';shadow.append(style,target);const color=getComputedStyle(target).color;host.remove();return color }, css)))
          if (rendered.every(color => color === expected) || Date.now() >= deadline) break
          await new Promise(resolve => setTimeout(resolve, 25))
        } while (true)
        const serverCSS = host.messages.filter(message => message.consumer === 'server' && message.payload?.type === 'update' && message.payload.updates?.some(update => update.type === 'css-update'))
        const staleURL = host.name === 'edited' && host.generation > 0 && phase.endsWith('-update') && host.messages.some(message => message.payload?.updates?.some(update => update.path === '/old.scss' || host.generation > 1 && update.path === '/new.scss'))
        const row = { middleware, managed, host: host.name, phase, expectedName, css, rendered, error, serverCSS, staleURL, result: !error && rendered.every(color => color === expected) && !serverCSS.length && !staleURL ? 'PASS' : 'FAIL' }
        ssrRows.push(row);console.log(JSON.stringify({ kind: 'ssr', ...row }))
      }
    }
  } catch (error) {
    const clients = []
    for (const host of hosts) for (const client of host.clients) clients.push({ host: host.name, browser: client.browserName, url: client.page.url(), errors: [...client.errors], content: (await client.page.content().catch(() => '')).slice(0, 5000) })
    rows.push({ managed, middleware, phase: 'host-error', error: String(error), clients, result: 'FAIL' });console.log(JSON.stringify(rows.at(-1)))
  }
  finally { for (const host of hosts) { for (const client of host.clients) await client.browser.close();await host.server?.close();if (host.httpServer) await new Promise(resolve => host.httpServer.close(resolve));rmSync(host.root, { recursive: true, force: true }) } }
}
const summary = { browserComparisons: rows.length, browserFailures: rows.filter(row => row.result === 'FAIL').length, ssrComparisons: ssrRows.length, ssrFailures: ssrRows.filter(row => row.result === 'FAIL').length }
console.log(JSON.stringify(summary));assert.equal(summary.browserFailures + summary.ssrFailures, 0)
