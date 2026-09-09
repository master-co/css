import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, realpathSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { createServer } = await import(require.resolve('vite'))
const engines = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const rows = []
for (const extension of process.env.BH_EXTENSION ? [process.env.BH_EXTENSION] : ['css', 'scss']) {
  for (const request of process.env.BH_REQUEST ? [process.env.BH_REQUEST] : ['normal', 'inline', 'raw', 'url']) {
    for (const managed of process.env.BH_MANAGED ? [process.env.BH_MANAGED === '1'] : [false, true]) {
      const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-dev-style-request-'))), clients = []
      let server
      try {
        mkdirSync(join(root, 'node_modules'))
        symlinkSync(dirname(createRequire(require.resolve('vite')).resolve('sass')), join(root, 'node_modules/sass'), 'dir')
        const file = `style.${extension}`, specifier = `./${file}` + (request === 'normal' ? '' : `?${request}`)
        const source = color => (managed ? '@master entry;@preserve native;\n' : '') + (extension === 'scss' ? `$tone: ${color};\n` : '') + `.example { color: ${extension === 'scss' ? '$tone' : color}; background-color: blue; }`
        writeFileSync(join(root, file), source('red'))
        writeFileSync(join(root, 'index.html'), '<div id="target" class="example">test</div><script type="module" src="./entry.js"></script>')
        writeFileSync(join(root, 'entry.js'), (request === 'normal' ? `import '${specifier}';window.payload='normal';` : `import value from '${specifier}';window.payload=value;`) + `window.updates=0;window.ready=true;if(import.meta.hot)import.meta.hot.accept('${specifier}',mod=>{window.updates++;window.payload=mod?.default});`)
        const masterPlugins = managed ? createMasterCSSVitePlugin({ mode: 'static', runtime: false }) : []
        if (process.env.BH_TRACE) for (const plugin of masterPlugins) {
          if (typeof plugin.handleHotUpdate !== 'function') continue
          const handler = plugin.handleHotUpdate
          plugin.handleHotUpdate = async function (context) {
            const before = context.modules.map(module => module.id)
            const result = await handler.call(this, context)
            console.log(JSON.stringify({ phase: 'master-hot-hook', plugin: plugin.name, before, returned: result?.map(module => module.id) }))
            return result
          }
        }
        server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: [
          ...(process.env.BH_TRACE ? [{ name: 'audit:before', enforce: 'pre', transform(code, id) { if (id.startsWith(root) && id.includes(file)) console.log(JSON.stringify({ phase: 'transform-before', id, code })) } }] : []),
          ...masterPlugins,
          ...(process.env.BH_TRACE ? [{ name: 'audit:after', enforce: 'post', transform(code, id) { if (id.startsWith(root) && id.includes(file)) console.log(JSON.stringify({ phase: 'transform-after', id, code })) }, handleHotUpdate(context) { console.log(JSON.stringify({ phase: 'hot-update', file: context.file, modules: context.modules.map(module => ({ id: module.id, url: module.url, file: module.file, type: module.type })) })) } }] : [])
        ], server: { host: '127.0.0.1', port: 0 } })
        await server.listen()
        for (const name of ['chromium', 'firefox', 'webkit']) {
          const browser = await engines[name].launch(), page = await browser.newPage(), errors = [], requests = []
          if (process.env.BH_TRACE) page.on('websocket', socket => socket.on('framereceived', event => console.log(JSON.stringify({ phase: 'websocket', browser: name, payload: String(event.payload) }))))
          page.on('pageerror', error => errors.push(error.message))
          page.on('response', response => { if (response.status() >= 400) requests.push({ url: response.url(), status: response.status() }) })
          await page.addInitScript(() => { window.bootID = Math.random() })
          await page.goto(server.resolvedUrls.local[0])
          clients.push({ browser, page, name, errors, requests, bootID: await page.evaluate(() => window.bootID) })
        }
        for (const color of ['red', 'green']) {
          if (color === 'green') writeFileSync(join(root, file), source(color))
          await Promise.all(clients.map(async ({ page, name, errors, requests, bootID }) => {
            const expected = color === 'red' ? 'rgb(255, 0, 0)' : 'rgb(0, 128, 0)'
            let waitError
            try {
              await page.waitForFunction(({ request, color, expected }) => window.ready && (color === 'red' || request === 'url' || (request === 'normal' ? getComputedStyle(document.querySelector('#target')).color === expected : window.updates > 0)), { request, color, expected }, { timeout: 7000 })
            } catch (error) { waitError = error.message }
            const value = await page.evaluate(async ({ request, expectedSource }) => {
              const target = document.querySelector('#target'), before = { color: getComputedStyle(target).color, background: getComputedStyle(target).backgroundColor }
              let after, fetched, rawEqual
              if (request === 'inline' && typeof window.payload === 'string') {
                const style = document.createElement('style');style.textContent = window.payload;document.head.append(style)
                after = { color: getComputedStyle(target).color, background: getComputedStyle(target).backgroundColor };style.remove()
              }
              if (request === 'raw') rawEqual = window.payload === expectedSource
              if (request === 'url' && typeof window.payload === 'string') {
                const response = await fetch(window.payload, { headers: { Accept: 'text/css' }, cache: 'no-store' })
                fetched = { status: response.status, body: await response.text() }
                const link = document.createElement('link');link.id='request-probe-style';link.rel='stylesheet';link.href=window.payload
                await new Promise((resolve, reject) => { link.onload=resolve;link.onerror=reject;document.head.append(link) })
                after = { color: getComputedStyle(target).color, background: getComputedStyle(target).backgroundColor }
              }
              return { before, after, fetched, rawEqual, payload: window.payload, updates: window.updates, bootID: window.bootID }
            }, { request, expectedSource: source(color) })
            if (request === 'url') {
              try { await page.waitForFunction(expected => getComputedStyle(document.querySelector('#target')).color === expected, expected, { timeout: 7000 }) }
              catch (error) { waitError = error.message }
              value.after = await page.locator('#target').evaluate(el => ({ color: getComputedStyle(el).color, background: getComputedStyle(el).backgroundColor }))
              await page.evaluate(() => document.querySelector('#request-probe-style')?.remove())
            }
            const untouched = value.before.color === 'rgb(0, 0, 0)' && value.before.background === 'rgba(0, 0, 0, 0)'
            const correct = request === 'normal' ? value.before.color === expected && value.before.background === 'rgb(0, 0, 255)' : request === 'inline' ? untouched && value.after?.color === expected && value.after?.background === 'rgb(0, 0, 255)' : request === 'raw' ? untouched && value.rawEqual : untouched && value.fetched?.status === 200 && value.after?.color === expected && value.after?.background === 'rgb(0, 0, 255)'
            const row = { extension, request, managed, color, browser: name, expected, expectedBootID: bootID, coldStartReload: color === 'red' && value.bootID !== bootID, correct, value, errors: [...errors], requests: [...requests], waitError, result: !waitError && correct && (color === 'red' || value.bootID === bootID) && !errors.length && !requests.length ? 'PASS' : 'FAIL' }
            if (color === 'red') clients.find(client => client.name === name).bootID = value.bootID
            rows.push(row); console.log(JSON.stringify(row))
          }))
        }
      } catch (error) { rows.push({ extension, request, managed, phase: 'host-error', error: String(error), result: 'FAIL' });console.log(JSON.stringify(rows.at(-1))) }
      finally { for (const client of clients) await client.browser.close();await server?.close();rmSync(root, { recursive: true, force: true }) }
    }
  }
}
const summary = { comparisons: rows.length, failures: rows.filter(row => row.result === 'FAIL').length }
console.log(JSON.stringify(summary));assert.equal(summary.failures, 0)
