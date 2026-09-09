import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, realpathSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'

const workspace = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { createServer, build, preview } = await import(require.resolve('vite'))
const engines = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const parent = join(workspace, 'packages/vite/tmp');mkdirSync(parent, { recursive: true })
const rows = []
const command = process.env.BH_COMMAND ?? 'serve', kind = process.env.BH_KIND ?? 'css', inline = process.env.BH_INLINE === '1'
const multiple = process.env.BH_MULTI === '1'
const filename = kind === 'module' ? 'style.module.css' : 'style.css'
for (const mode of (process.env.BH_MODES?.split(',') ?? ['static', 'runtime', 'pre-render', 'progressive'])) {
  const root = realpathSync(mkdtempSync(join(parent, 'local-dev-graph-resources-'))), clients = []
  const name = 'pixel#?.svg', resourceFile = join(root, name)
  const svg = color => `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><title>${color}</title><rect width="1" height="1" fill="${color}"/></svg>`
  const branch = color => `@import "/base/external.css";.resource{@compose p:2rem;color:${color};background-image:url("./${encodeURIComponent(name)}?variant=1#part")}`
  let server, previewServer
  try {
    writeFileSync(join(root, filename), '@import "./branch.css" layer(guard) supports(display:grid) screen and (min-width:700px);.local{@compose inline-flex;}')
    writeFileSync(join(root, 'branch.css'), branch('rgb(12,34,56)'))
    mkdirSync(join(root, 'public'));writeFileSync(join(root, 'public/external.css'), '.resource{border-left:7px solid rgb(20,30,40)}')
    writeFileSync(resourceFile, svg('red'))
    writeFileSync(join(root, 'index.html'), '<!doctype html><html><body><div id="target" class="resource local">resource</div><script type="module" src="./client.js"></script></body></html>')
    writeFileSync(join(root, 'client.js'), (inline ? `import css from './${filename}?inline';const style=document.createElement('style');style.textContent=css;document.head.append(style);` : kind === 'module' ? `import names from './${filename}';document.querySelector('#target').classList.add(names.local);` : `import './${filename}';`) + 'window.bootID=Math.random();window.ready=true')
    if (multiple) {
      writeFileSync(join(root, 'second.css'), '@import "./second-child.css" layer(second);.local{@compose flex;}')
      writeFileSync(join(root, 'second-child.css'), '@import "/base/second-external.css";.secondary{@compose m:1rem;}')
      writeFileSync(join(root, 'public/second-external.css'), '.secondary{color:purple}')
      const client = readFileSync(join(root, 'client.js'), 'utf8')
      writeFileSync(join(root, 'client.js'), client + ';import "./second.css";')
    }
    const config = { root, base: '/base/', configFile: false, logLevel: 'silent', plugins: createMasterCSSVitePlugin({ mode }), server: { host: '127.0.0.1', port: 0 } }
    if (command === 'serve') { server = await createServer(config);await server.listen() }
    else { await build(config);previewServer = await preview({ ...config, preview: { host: '127.0.0.1', port: 0 } }) }
    for (const browserName of ['chromium', 'firefox', 'webkit']) {
      const browser = await engines[browserName].launch(), page = await browser.newPage(), errors = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
      clients.push({ browser, page, browserName, errors })
      await page.goto((server ?? previewServer).resolvedUrls.local[0])
    }
    for (const phase of (process.env.BH_PHASES?.split(',') ?? (command === 'build' ? ['initial'] : ['initial', 'child-update', 'resource-update', 'resource-restore']))) {
      if (phase === 'child-update') writeFileSync(join(root, 'branch.css'), branch('rgb(56,34,12)'))
      if (phase === 'resource-update') writeFileSync(resourceFile, svg('blue'))
      if (phase === 'resource-restore') writeFileSync(resourceFile, svg('red'))
      for (const client of clients) {
        const { page, errors } = client
        let value, error
        try {
          const color = phase === 'initial' ? 'rgb(12, 34, 56)' : 'rgb(56, 34, 12)'
          await page.waitForFunction(({ color, previous, changed, display }) => {
            const target = document.querySelector('#target');if (!target) return false
            const style = getComputedStyle(target)
            return window.ready && style.color === color && style.borderLeftWidth === '7px' && style.paddingTop === '32px' && style.display === display && (!changed || style.backgroundImage !== previous)
          }, { color, display: multiple ? 'flex' : 'inline-flex', previous: client.previousResource, changed: phase.startsWith('resource-') }, { timeout: 15000 })
          value = await page.evaluate(async () => {
            const style = getComputedStyle(document.querySelector('#target'))
            const url = style.backgroundImage.match(/^url\(["']?(.*?)["']?\)$/)?.[1]
            const image = new Image();image.src = url;await image.decode()
            const canvas = document.createElement('canvas');canvas.width = canvas.height = 1
            const context = canvas.getContext('2d');context.drawImage(image, 0, 0)
            return { padding: style.paddingTop, color: style.color, resource: style.backgroundImage, url, pixel: [...context.getImageData(0, 0, 1, 1).data], bootID: window.bootID }
          })
          if (phase === 'initial') client.bootID = value.bootID
          assert.equal(value.bootID, client.bootID)
          assert.deepEqual(value.pixel, phase === 'resource-update' ? [0, 0, 255, 255] : [255, 0, 0, 255])
          const response = await page.request.get(value.url)
          assert.equal(response.status(), 200);assert.ok(response.headers()['content-type'].includes('image/svg+xml'))
          assert.equal(await response.text(), svg(phase === 'resource-update' ? 'blue' : 'red'))
          assert.equal(new URL(value.url).search, '?variant=1');assert.equal(new URL(value.url).hash, '#part')
          assert.deepEqual(errors, [])
          client.previousResource = value.resource
          if (phase === 'initial') {
            for (const width of [500, 900]) {
              await page.setViewportSize({ width, height: 720 })
              await page.waitForFunction(width => getComputedStyle(document.querySelector('#target')).paddingTop === (width < 700 ? '0px' : '32px'), width)
              const state = await page.evaluate(() => {
                const style = getComputedStyle(document.querySelector('#target'))
                return { padding: style.paddingTop, border: style.borderLeftWidth, background: style.backgroundImage, bootID: window.bootID }
              })
              assert.equal(state.border, width < 700 ? '0px' : '7px')
              if (width < 700) assert.equal(state.background, 'none')
              assert.equal(state.bootID, client.bootID)
              const row = { command, kind, inline, multiple, mode, browser: client.browserName, phase: `viewport-${width}`, state, result: 'PASS' }
              rows.push(row);console.log(JSON.stringify(row))
            }
          }
        } catch (cause) { error = String(cause) }
        const row = { command, kind, inline, multiple, mode, browser: client.browserName, phase, value, errors: [...errors], error, result: error ? 'FAIL' : 'PASS' }
        rows.push(row);console.log(JSON.stringify(row))
      }
    }
  } finally {
    for (const client of clients) await client.browser.close()
    await server?.environments.client.waitForRequestsIdle()
    await server?.close()
    if (previewServer) await new Promise(resolve => previewServer.httpServer.close(resolve))
    rmSync(root, { recursive: true, force: true })
  }
}
const result = { observations: rows.length, failures: rows.filter(row => row.result === 'FAIL').length }
console.log(JSON.stringify(result));assert.equal(result.failures, 0)
