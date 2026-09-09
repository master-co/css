import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, realpathSync, mkdirSync, writeFileSync, rmSync, symlinkSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { createServer } = await import(require.resolve('vite'))
const engines = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const rows = [], nested = process.env.BH_NESTED === '1'
for (const request of process.env.BH_REQUEST ? [process.env.BH_REQUEST] : ['normal', 'inline', 'url']) {
  for (const managed of process.env.BH_MANAGED ? [process.env.BH_MANAGED === '1'] : [false, true]) {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-sass-partial-hmr-'))), clients = []
    let server
    try {
      mkdirSync(join(root, 'node_modules'));mkdirSync(join(root, 'theme/deep'), { recursive: true })
      symlinkSync(dirname(createRequire(require.resolve('vite')).resolve('sass')), join(root, 'node_modules/sass'), 'dir')
      const directory = nested ? 'theme/deep' : 'theme', partial = join(root, directory, '_tokens.scss')
      if (nested) writeFileSync(join(root, 'theme/_tokens.scss'), '@forward "./deep/tokens";')
      const source = color => `$tone:${color};@mixin paint{color:$tone;background-image:url('./pixel.svg');}`
      const asset = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><path fill="red" d="M0 0h1v1H0z"/><!--partial-owned' + 'x'.repeat(10000) + '--></svg>'
      writeFileSync(join(root, directory, 'pixel.svg'), asset);writeFileSync(partial, source('red'))
      writeFileSync(join(root, 'style.scss'), '@use "./theme/tokens";' + (managed ? '@master entry;@preserve native;' : '') + '.example{@include tokens.paint;}')
      const specifier = './style.scss' + (request === 'normal' ? '' : `?${request}`)
      writeFileSync(join(root, 'index.html'), '<div id="target" class="example">test</div><script type="module" src="./entry.js"></script>')
      const initial = request === 'normal' ? `import '${specifier}';` : request === 'inline' ? `import css from '${specifier}';const style=document.createElement('style');style.textContent=css;document.head.append(style);` : `import url from '${specifier}';const link=document.createElement('link');link.id='persistent-link';link.rel='stylesheet';link.href=url;document.head.append(link);`
      writeFileSync(join(root, 'entry.js'), initial + `window.ready=true;window.updates=0;if(import.meta.hot)import.meta.hot.accept('${specifier}',mod=>{window.updates++;${request === 'inline' ? 'if(mod)style.textContent=mod.default;' : ''}});`)
      server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: managed ? createMasterCSSVitePlugin({ mode: 'static', runtime: false }) : [], server: { host: '127.0.0.1', port: 0 } })
      if (process.env.BH_TRACE) server.watcher.on('all', (event, file) => console.log(JSON.stringify({ phase: 'watch', event, file })))
      await server.listen()
      for (const name of ['chromium', 'firefox', 'webkit']) {
        const browser = await engines[name].launch(), page = await browser.newPage(), frames = [], httpErrors = [], pageErrors = []
        page.on('websocket', socket => socket.on('framereceived', event => { try { frames.push(JSON.parse(String(event.payload))) } catch {} }))
        page.on('response', response => { if (response.status() >= 400) httpErrors.push({ url: response.url(), status: response.status() }) })
        page.on('pageerror', error => pageErrors.push(error.message))
        await page.addInitScript(() => { window.bootID = Math.random() })
        await page.goto(server.resolvedUrls.local[0]);clients.push({ browser, page, name, frames, httpErrors, pageErrors })
      }
      for (const phase of ['initial', 'partial-update', ...(process.env.BH_SKIP_DELETE ? [] : ['delete']), 'recovery']) {
        const color = phase === 'initial' ? 'red' : phase === 'partial-update' ? 'green' : 'blue'
        for (const client of clients) { client.frames.length = 0;client.httpErrors.length = 0;client.pageErrors.length = 0 }
        if (phase === 'delete') unlinkSync(partial)
        else if (phase !== 'initial') writeFileSync(partial, source(color))
        await Promise.all(clients.map(async client => {
          const { page, name, frames, httpErrors, pageErrors } = client
          let waitError, value
          if (phase === 'delete') {
            const deadline = Date.now() + 7000
            while (Date.now() < deadline && !frames.some(frame => frame.type === 'error') && !httpErrors.length) await new Promise(resolve => setTimeout(resolve, 25))
            value = { frames: [...frames], httpErrors: [...httpErrors], pageErrors: [...pageErrors], bootID: await page.evaluate(() => window.bootID) }
            const detected = frames.some(frame => frame.type === 'error' && /sass|stylesheet|import|tokens/i.test(frame.err?.message ?? '')) || httpErrors.some(response => response.status === 500)
            const row = { request, managed, nested, phase, browser: name, value, result: detected && value.bootID === client.bootID ? 'PASS' : 'FAIL' }
            rows.push(row);console.log(JSON.stringify(row));return
          }
          const expected = color === 'red' ? 'rgb(255, 0, 0)' : color === 'green' ? 'rgb(0, 128, 0)' : 'rgb(0, 0, 255)'
          try { await page.waitForFunction(expected => window.ready && getComputedStyle(document.querySelector('#target')).color === expected, expected, { timeout: 7000 }) } catch (error) { waitError = error.message }
          value = await page.locator('#target').evaluate(async (element, expectedAsset) => {
            const style = getComputedStyle(element), url = /^url\(["']?(.*?)["']?\)$/.exec(style.backgroundImage)?.[1]
            const response = url ? await fetch(url, { cache: 'no-store' }) : undefined
            return { color: style.color, backgroundImage: style.backgroundImage, resourceURL: url, resourceStatus: response?.status, resourceMatches: await response?.text() === expectedAsset, bootID: window.bootID, updates: window.updates, links: document.querySelectorAll('#persistent-link').length }
          }, asset)
          if (phase === 'initial') client.bootID = value.bootID
          const correct = value.color === expected && value.resourceStatus === 200 && value.resourceMatches && new URL(value.resourceURL).pathname === `/${directory}/pixel.svg` && (request !== 'url' || value.links === 1)
          const row = { request, managed, nested, phase, browser: name, expected, value, waitError, frames: [...frames], httpErrors: [...httpErrors], pageErrors: [...pageErrors], result: correct && !waitError && value.bootID === client.bootID && !httpErrors.length && !pageErrors.length ? 'PASS' : 'FAIL' }
          rows.push(row);console.log(JSON.stringify(row))
        }))
      }
    } catch (error) { const row = { request, managed, nested, phase: 'host-error', error: String(error), result: 'FAIL' };rows.push(row);console.log(JSON.stringify(row)) }
    finally { for (const client of clients) await client.browser.close();await server?.close();rmSync(root, { recursive: true, force: true }) }
  }
}
const summary = { comparisons: rows.length, failures: rows.filter(row => row.result === 'FAIL').length }
console.log(JSON.stringify(summary));assert.equal(summary.failures, 0)
