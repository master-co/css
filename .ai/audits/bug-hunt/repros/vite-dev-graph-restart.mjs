import assert from 'node:assert/strict'
import { createServer as createHTTPServer } from 'node:http'
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'

const workspace = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { createServer } = await import(require.resolve('vite'))
const engines = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const parent = join(workspace, 'packages/vite/tmp');mkdirSync(parent, { recursive: true })
const rows = []
for (const mode of ['static', 'runtime', 'pre-render', 'progressive']) for (const middleware of [false, true]) {
  const root = realpathSync(mkdtempSync(join(parent, 'dev-graph-restart-'))), clients = []
  const name = 'pixel#?.svg', resourceFile = join(root, name)
  const svg = color => `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><title>${color}</title><rect width="1" height="1" fill="${color}"/></svg>`
  const branch = color => `@import "/base/external.css";.resource{color:${color};background-image:url("./${encodeURIComponent(name)}?variant=1#part")}`
  let server
  const http = createHTTPServer((request, response) => server.middlewares(request, response, () => { response.statusCode = 404;response.end() }))
  try {
    writeFileSync(join(root, 'style.css'), '@import "./branch.css" layer(guard) supports(display:grid);@master entry;@preserve native;')
    writeFileSync(join(root, 'branch.css'), branch('rgb(12,34,56)'))
    writeFileSync(join(root, 'external.css'), '.resource{border-left:7px solid rgb(20,30,40)}')
    writeFileSync(resourceFile, svg('red'))
    writeFileSync(join(root, 'index.html'), '<!doctype html><html><body><div id="target" class="resource">resource</div><script type="module" src="./client.js"></script></body></html>')
    writeFileSync(join(root, 'client.js'), 'import "./style.css";window.bootID=Math.random();window.ready=true')
    server = await createServer({ root, base: '/base/', configFile: false, logLevel: 'silent', plugins: createMasterCSSVitePlugin({ mode }), server: middleware ? { middlewareMode: true, ws: { server: http } } : { host: '127.0.0.1', port: 0 } })
    if (middleware) await new Promise(resolve => http.listen(0, '127.0.0.1', resolve))
    else await server.listen()
    const origin = middleware ? `http://127.0.0.1:${http.address().port}/base/` : server.resolvedUrls.local[0]
    for (const browserName of ['chromium', 'firefox', 'webkit']) {
      const browser = await engines[browserName].launch(), page = await browser.newPage(), errors = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
      clients.push({ browser, page, browserName, errors })
      await page.goto(origin)
    }
    for (const phase of ['initial', 'restart', 'child-update', 'resource-update']) {
      if (phase === 'restart') await server.restart()
      if (phase === 'child-update') writeFileSync(join(root, 'branch.css'), branch('rgb(56,34,12)'))
      if (phase === 'resource-update') writeFileSync(resourceFile, svg('blue'))
      for (const client of clients) {
        const { page, errors } = client
        let value, error
        try {
          const color = ['initial', 'restart'].includes(phase) ? 'rgb(12, 34, 56)' : 'rgb(56, 34, 12)'
          await page.waitForFunction(({ color, previous, changed, restarted, bootID }) => {
            const target = document.querySelector('#target');if (!target) return false
            const style = getComputedStyle(target)
            return window.ready && (!restarted || window.bootID !== bootID) && style.color === color && style.borderLeftWidth === '7px' && (!changed || style.backgroundImage !== previous)
          }, { color, previous: client.previousResource, changed: phase === 'resource-update', restarted: phase === 'restart', bootID: client.bootID }, { timeout: 15000 })
          value = await page.evaluate(async () => {
            const style = getComputedStyle(document.querySelector('#target'))
            const url = style.backgroundImage.match(/^url\(["']?(.*?)["']?\)$/)?.[1]
            const image = new Image();image.src = url;await image.decode()
            const canvas = document.createElement('canvas');canvas.width = canvas.height = 1
            const context = canvas.getContext('2d');context.drawImage(image, 0, 0)
            return { color: style.color, resource: style.backgroundImage, url, pixel: [...context.getImageData(0, 0, 1, 1).data], bootID: window.bootID }
          })
          if (phase === 'initial' || phase === 'restart') {
            if (phase === 'restart') { assert.notEqual(value.bootID, client.bootID);assert.notEqual(value.resource, client.previousResource) }
            client.bootID = value.bootID
          }
          assert.equal(value.bootID, client.bootID)
          assert.deepEqual(value.pixel, phase === 'resource-update' ? [0, 0, 255, 255] : [255, 0, 0, 255])
          const response = await page.request.get(value.url)
          assert.equal(response.status(), 200);assert.ok(response.headers()['content-type'].includes('image/svg+xml'))
          assert.equal(await response.text(), svg(phase === 'resource-update' ? 'blue' : 'red'))
          assert.equal(new URL(value.url).search, '?variant=1');assert.equal(new URL(value.url).hash, '#part')
          assert.deepEqual(errors, [])
          client.previousResource = value.resource
        } catch (cause) { error = String(cause) }
        const row = { mode, middleware, browser: client.browserName, phase, value, errors: [...errors], error, result: error ? 'FAIL' : 'PASS' }
        rows.push(row);console.log(JSON.stringify(row))
      }
    }
  } finally {
    for (const client of clients) await client.browser.close()
    await server?.environments.client.waitForRequestsIdle()
    await server?.close()
    if (http.listening) await new Promise(resolve => http.close(resolve))
    rmSync(root, { recursive: true, force: true })
  }
}
const result = { observations: rows.length, failures: rows.filter(row => row.result === 'FAIL').length }
console.log(JSON.stringify(result));assert.equal(result.failures, 0)
