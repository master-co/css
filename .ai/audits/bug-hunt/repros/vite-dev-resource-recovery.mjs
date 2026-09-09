import assert from 'node:assert/strict'
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
for (const mode of ['static', 'runtime', 'pre-render', 'progressive']) {
  const root = realpathSync(mkdtempSync(join(parent, 'dev-resource-recovery-'))), clients = []
  const file = join(root, 'pixel.svg')
  const svg = color => `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><title>${color}</title><rect width="1" height="1" fill="${color}"/></svg>`
  let server
  try {
    writeFileSync(join(root, 'style.css'), '@import "./child.css" layer(guard);@master entry;@preserve native;')
    writeFileSync(join(root, 'child.css'), '@import "/base/external.css";.resource{background-image:url("./pixel.svg?q=1#part")}')
    writeFileSync(join(root, 'external.css'), '.resource{border-left:7px solid rgb(20,30,40)}')
    writeFileSync(file, svg('red'))
    writeFileSync(join(root, 'index.html'), '<!doctype html><html><body><div id="target" class="resource">resource</div><script type="module" src="./client.js"></script></body></html>')
    writeFileSync(join(root, 'client.js'), 'import "./style.css";window.bootID=Math.random();window.ready=true')
    server = await createServer({ root, base: '/base/', configFile: false, logLevel: 'silent', plugins: createMasterCSSVitePlugin({ mode }), server: { host: '127.0.0.1', port: 0 } })
    await server.listen()
    for (const browserName of ['chromium', 'firefox', 'webkit']) {
      const browser = await engines[browserName].launch(), page = await browser.newPage(), errors = [], responses = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('response', response => { if (response.status() >= 400) responses.push({ status: response.status(), url: response.url() }) })
      clients.push({ browser, page, browserName, errors, responses })
      await page.goto(server.resolvedUrls.local[0])
    }
    for (const phase of ['initial', 'deleted', 'restored', 'updated-again']) {
      if (phase === 'deleted') rmSync(file)
      if (phase === 'restored') writeFileSync(file, svg('blue'))
      if (phase === 'updated-again') writeFileSync(file, svg('red'))
      for (const client of clients) {
        const { page, errors, responses } = client
        let value, error
        try {
          await page.waitForFunction(({ missing, previous, initial }) => {
            const target = document.querySelector('#target');if (!target || !window.ready) return false
            const style = getComputedStyle(target)
            if (style.borderLeftWidth !== '7px' || style.backgroundImage === 'none') return false
            const overlay = document.querySelector('vite-error-overlay')
            return missing ? !!overlay : !overlay && (initial || getComputedStyle(target).backgroundImage !== previous)
          }, { missing: phase === 'deleted', previous: client.previousResource, initial: phase === 'initial' }, { timeout: 15000 })
          value = await page.evaluate(async () => {
            const style = getComputedStyle(document.querySelector('#target'))
            const url = style.backgroundImage.match(/^url\(["']?(.*?)["']?\)$/)?.[1]
            const image = new Image();image.src = url;await image.decode()
            const canvas = document.createElement('canvas');canvas.width = canvas.height = 1
            const context = canvas.getContext('2d');context.drawImage(image, 0, 0)
            return { resource: style.backgroundImage, url, pixel: [...context.getImageData(0, 0, 1, 1).data], bootID: window.bootID, overlay: document.querySelector('vite-error-overlay')?.shadowRoot?.textContent?.split('\n').filter(line => line.includes('pixel.svg')).slice(0, 2).join('\n') }
          })
          if (phase === 'initial') { client.bootID = value.bootID;client.originalURL = value.url }
          assert.equal(value.bootID, client.bootID)
          assert.deepEqual(value.pixel, phase === 'restored' ? [0, 0, 255, 255] : [255, 0, 0, 255])
          if (phase === 'deleted') assert.ok(value.overlay.includes('pixel.svg'))
          const original = await page.request.get(client.originalURL)
          assert.equal(original.status(), 200);assert.equal(await original.text(), svg('red'))
          assert.deepEqual(errors, [])
          assert.ok(responses.every(response => response.status === 500 && new URL(response.url).pathname === '/base/style.css'))
          if (phase !== 'deleted') client.previousResource = value.resource
        } catch (cause) { error = String(cause) }
        const row = { mode, browser: client.browserName, phase, value, errors: [...errors], responses: [...responses], error, result: error ? 'FAIL' : 'PASS' }
        rows.push(row);console.log(JSON.stringify(row))
      }
    }
  } finally {
    for (const client of clients) await client.browser.close()
    await server?.environments.client.waitForRequestsIdle()
    await server?.close();rmSync(root, { recursive: true, force: true })
  }
}
const result = { observations: rows.length, failures: rows.filter(row => row.result === 'FAIL').length }
console.log(JSON.stringify(result));assert.equal(result.failures, 0)
