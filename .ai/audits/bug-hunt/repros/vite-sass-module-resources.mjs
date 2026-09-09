import assert from 'node:assert/strict'
import { createServer as createHTTPServer } from 'node:http'
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync, rmSync, symlinkSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'

const workspace = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const sassDirectory = dirname(createRequire(require.resolve('vite')).resolve('sass'))
const MagicString = (await import(require.resolve('magic-string'))).default
const { createServer, build, preview } = await import(require.resolve('vite'))
const engines = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const parent = join(workspace, 'packages/vite/tmp');mkdirSync(parent, { recursive: true })
const rows = []
const command = process.env.BH_COMMAND ?? 'serve'
const rootSyntax = process.env.BH_ROOT ?? 'scss', syntax = process.env.BH_SYNTAX ?? 'scss'
const data = process.env.BH_DATA ?? 'string', style = process.env.BH_STYLE ?? 'expanded', native = process.env.BH_NATIVE === '1'
const filename = `style.module.${rootSyntax}`
for (const mode of (process.env.BH_MODES?.split(',') ?? ['static', 'runtime', 'pre-render', 'progressive'])) {
  const root = realpathSync(mkdtempSync(join(parent, 'sass-module-resources-'))), clients = []
  const name = 'pixel#?.svg', resourceFile = join(root, 'nested-copy', name)
  mkdirSync(join(root, 'nested'))
  const svg = color => `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><title>${color}</title><rect width="1" height="1" fill="${color}"/></svg>`
  mkdirSync(join(root, 'nested-copy'))
  const externalCSS = '#target{border-left:7px solid rgb(20,30,40)}'
  const externalServer = createHTTPServer((_request, response) => { response.writeHead(200, { 'content-type': 'text/css' });response.end(externalCSS) })
  await new Promise(resolve => externalServer.listen(0, '127.0.0.1', resolve))
  const externalURL = `http://127.0.0.1:${externalServer.address().port}/external.css`
  const branch = (key, color, className = 'resource') => syntax === 'scss'
    ? `@import "${externalURL}";$${key}:2rem;.${className}{${native ? 'padding:#{$' + key + '}' : '@compose p:#{$' + key + '}'};color:${color};background-image:url("./${encodeURIComponent(name)}?variant=1#part")}`
    : `@import "${externalURL}"\n$${key}: 2rem\n.${className}\n  ${native ? 'padding: #{$' + key + '}' : '@compose p:#{$' + key + '}'}\n  color: ${color}\n  background-image: url("./${encodeURIComponent(name)}?variant=1#part")\n`
  const calls = []
  let server, previewServer
  try {
    mkdirSync(join(root, 'node_modules'));symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
    writeFileSync(join(root, filename), '@import "./nested/bridge.css" layer(guard) supports(display:grid) screen and (min-width:700px);@import "./nested-copy/bridge.css" layer(guard) supports(display:grid) screen and (min-width:700px);.local{display:inline-flex}')
    for (const [directory, key, image] of [['nested', 'a', 'red'], ['nested-copy', 'b', 'blue']]) {
      writeFileSync(join(root, directory, 'bridge.css'), `@import "./branch.${syntax}";.bridge{display:block}`)
      writeFileSync(join(root, directory, `branch.${syntax}`), branch(key, 'rgb(12,34,56)'))
      writeFileSync(join(root, directory, name), svg(image))
    }
    writeFileSync(join(root, 'index.html'), '<!doctype html><html><body><div id="target">resource</div><div id="leak" class="resource">global</div><script type="module" src="./client.js"></script></body></html>')
    writeFileSync(join(root, 'client.js'), `import names from './${filename}';const apply=names=>{window.names=names;document.querySelector('#target').className=[names.local,names.resourceNext??names.resource].join(' ')};apply(names);if(import.meta.hot)import.meta.hot.accept('./${filename}',module=>apply(module.default));window.bootID=Math.random();window.ready=true`)
    const additionalData = data === 'none' ? undefined : data === 'string' ? '$prefix:1;\n' : async (source, file) => {
      calls.push({ file, source })
      const edited = new MagicString(source).prepend('$prefix:1;\n')
      return { content: edited.toString(), map: edited.generateMap({ source: file, file, includeContent: true, hires: true }) }
    }
    const config = { root, cacheDir: join(root, '.vite'), base: '/base/', configFile: false, logLevel: 'silent', plugins: createMasterCSSVitePlugin({ mode }), css: { preprocessorOptions: { scss: { style, additionalData }, sass: { style, additionalData } } }, server: { host: '127.0.0.1', port: 0 } }
    if (command === 'serve') { server = await createServer(config);await server.listen() }
    else { await build(config);previewServer = await preview({ ...config, preview: { host: '127.0.0.1', port: 0 } }) }
    for (const browserName of ['chromium', 'firefox', 'webkit']) {
      const browser = await engines[browserName].launch(), page = await browser.newPage(), errors = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
      clients.push({ browser, page, browserName, errors })
      await page.goto((server ?? previewServer).resolvedUrls.local[0])
    }
    if (data === 'map') for (const directory of ['nested', 'nested-copy']) assert.equal(calls.filter(call => call.file === join(root, directory, `branch.${syntax}`)).length, 1)
    for (const phase of (process.env.BH_PHASES?.split(',') ?? (command === 'build' ? ['initial'] : ['initial', 'child-update', 'resource-update', 'resource-restore', 'class-update']))) {
      if (phase === 'child-update') writeFileSync(join(root, 'nested-copy', `branch.${syntax}`), branch('b', 'rgb(56,34,12)'))
      if (phase === 'resource-update') writeFileSync(resourceFile, svg('green'))
      if (phase === 'resource-restore') writeFileSync(resourceFile, svg('blue'))
      if (phase === 'class-update') writeFileSync(join(root, 'nested-copy', `branch.${syntax}`), branch('b', 'rgb(56,34,12)', 'resourceNext'))
      for (const client of clients) {
        const { page, errors } = client
        let value, error
        try {
          const color = phase === 'initial' ? 'rgb(12, 34, 56)' : 'rgb(56, 34, 12)'
          await page.waitForFunction(({ color, previous, changed, display, renamed }) => {
            const target = document.querySelector('#target');if (!target) return false
            const style = getComputedStyle(target)
            return window.ready && (!renamed || window.names?.resourceNext) && style.color === color && style.borderLeftWidth === '7px' && style.paddingTop === '32px' && style.display === display && (!changed || style.backgroundImage !== previous)
          }, { color, renamed: phase === 'class-update', display: 'inline-flex', previous: client.previousResource, changed: phase.startsWith('resource-') }, { timeout: 15000 })
          value = await page.evaluate(async () => {
            const style = getComputedStyle(document.querySelector('#target'))
            const url = style.backgroundImage.match(/^url\(["']?(.*?)["']?\)$/)?.[1]
            const image = new Image();image.src = url;await image.decode()
            const canvas = document.createElement('canvas');canvas.width = canvas.height = 1
            const context = canvas.getContext('2d');context.drawImage(image, 0, 0)
            return { padding: style.paddingTop, color: style.color, resource: style.backgroundImage, url, pixel: [...context.getImageData(0, 0, 1, 1).data], bootID: window.bootID, names: window.names, leak: getComputedStyle(document.querySelector('#leak')).paddingTop }
          })
          if (phase === 'initial') client.bootID = value.bootID
          assert.equal(value.bootID, client.bootID)
          assert.equal(typeof value.names[phase === 'class-update' ? 'resourceNext' : 'resource'], 'string');assert.equal(value.leak, '0px')
          assert.deepEqual(value.pixel, phase === 'resource-update' ? [0, 128, 0, 255] : [0, 0, 255, 255])
          const response = await page.request.get(value.url)
          assert.equal(response.status(), 200);assert.ok(response.headers()['content-type'].includes('image/svg+xml'))
          assert.equal(await response.text(), svg(phase === 'resource-update' ? 'green' : 'blue'))
          assert.equal(new URL(value.url).search, '?variant=1');assert.equal(new URL(value.url).hash, '#part')
          assert.deepEqual(errors, [])
          client.previousResource = value.resource
          if (phase === 'initial') {
            for (const width of [500, 900]) {
              await page.setViewportSize({ width, height: 720 })
              await page.waitForFunction(width => getComputedStyle(document.querySelector('#target')).paddingTop === (width < 700 ? '0px' : '32px'), width)
              const state = await page.evaluate(() => {
                const style = getComputedStyle(document.querySelector('#target'))
                return { padding: style.paddingTop, border: style.borderLeftWidth, background: style.backgroundImage, bootID: window.bootID, names: window.names, leak: getComputedStyle(document.querySelector('#leak')).paddingTop }
              })
              assert.equal(state.border, width < 700 ? '0px' : '7px')
              if (width < 700) assert.equal(state.background, 'none')
              assert.equal(state.bootID, client.bootID);assert.equal(state.leak, '0px')
              const row = { command, rootSyntax, syntax, data, style, native, mode, browser: client.browserName, phase: `viewport-${width}`, state, result: 'PASS' }
              rows.push(row);console.log(JSON.stringify(row))
            }
          }
        } catch (cause) { error = String(cause) }
        const row = { command, rootSyntax, syntax, data, style, native, mode, browser: client.browserName, phase, value, errors: [...errors], error, result: error ? 'FAIL' : 'PASS' }
        rows.push(row);console.log(JSON.stringify(row))
      }
    }
  } finally {
    for (const client of clients) await client.browser.close()
    await server?.environments.client.waitForRequestsIdle()
    await server?.close()
    if (previewServer) await new Promise(resolve => previewServer.httpServer.close(resolve))
    if (externalServer.listening) await new Promise(resolve => externalServer.close(resolve))
    rmSync(root, { recursive: true, force: true })
  }
}
const result = { observations: rows.length, failures: rows.filter(row => row.result === 'FAIL').length }
console.log(JSON.stringify(result));assert.equal(result.failures, 0)
