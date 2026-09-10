import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const workspace = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const sassDirectory = dirname(createRequire(require.resolve('vite')).resolve('sass'))
const { createServer } = await import(require.resolve('vite'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const syntax = process.env.BH_SYNTAX ?? 'scss', kinds = process.env.BH_KIND ? [process.env.BH_KIND] : ['plain-root', 'module-root', 'retained-module']
const modes = process.env.BH_MODE ? [process.env.BH_MODE] : ['static', 'runtime', 'pre-render', 'progressive']
const parent = join(workspace, 'packages/vite/tmp'); mkdirSync(parent, { recursive: true })
const rows = []
for (const kind of kinds) for (const mode of modes) {
  const root = realpathSync(mkdtempSync(join(parent, 'reference-recovery-browser-'))), clients = []
  let server
  const svg = color => `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="${color}"/></svg>`
  const tokens = padding => `@utilities{paint{padding:${padding}rem;background-image:url("./pixel.svg?v=1#icon")}}.never{border-left:99px solid red}`
  const reference = join(root, 'shared/tokens.css'), pixel = join(root, 'shared/pixel.svg')
  try {
    mkdirSync(join(root, 'node_modules')); symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
    mkdirSync(join(root, 'nested')); mkdirSync(join(root, 'shared'))
    writeFileSync(join(root, `shared/_rules.${syntax}`), syntax === 'scss' ? '@reference "./tokens.css";.target{@compose paint;}' : '@reference "./tokens.css"\n.target\n  @compose paint\n')
    writeFileSync(pixel, svg('red'))
    const source = syntax === 'scss' ? '@use "../shared/rules";' : '@use "../shared/rules"\n'
    const input = kind === 'plain-root' ? `nested/style.${syntax}` : kind === 'module-root' ? `nested/style.module.${syntax}` : 'style.module.css'
    if (kind === 'retained-module') writeFileSync(join(root, `nested/child.${syntax}`), source)
    writeFileSync(join(root, input), kind === 'retained-module' ? `@import "./nested/child.${syntax}" layer(owner);` : source)
    const plain = kind === 'plain-root'
    writeFileSync(join(root, 'client.js'), `${plain ? `import "./${input}";` : `import names from "./${input}";`}const apply=names=>{${plain ? '' : 'if(!names)return;'}document.querySelector("#target").className=${plain ? '"target"' : 'names.target'};window.ready=true};apply(${plain ? '{}' : 'names'});if(import.meta.hot)import.meta.hot.accept("./${input}",next=>apply(next?.default));window.bootID=Math.random();`)
    writeFileSync(join(root, 'index.html'), '<!doctype html><div id="target"></div><div class="never" id="leak"></div><script type="module" src="./client.js"></script>')
    server = await createServer({ root, base: '/base/', cacheDir: join(root, '.vite'), configFile: false, logLevel: 'silent', plugins: createMasterCSSVitePlugin({ mode }), server: { host: '127.0.0.1', port: 0 } }); await server.listen()
    for (const browserName of ['chromium', 'firefox', 'webkit']) {
      const browser = await browsers[browserName].launch(), page = await browser.newPage(), errors = [], messages = [], failedResponses = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('response', response => { if (response.status() >= 400) failedResponses.push({ status: response.status(), url: response.url() }) })
      page.on('websocket', socket => socket.on('framereceived', frame => { try { messages.push(JSON.parse(String(frame.payload))) } catch {} }))
      clients.push({ browserName, browser, page, errors, messages, failedResponses })
      const initialFailure = page.waitForResponse(response => response.status() === 500, { timeout: 10000 })
      await page.goto(server.resolvedUrls.local[0])
      await initialFailure
      console.log(JSON.stringify({ setup: true, syntax, kind, mode, browser: browserName, failedResponses, errors }))
      assert.equal(await page.evaluate(() => Boolean(window.ready)), false)
    }
    for (const phase of ['startup-restored', 'restored', 'resource-update']) {
      if (phase === 'startup-restored') writeFileSync(reference, tokens(2))
      if (phase === 'restored') {
        for (const client of clients) client.messages.length = 0
        rmSync(reference)
        for (const client of clients) await client.page.waitForFunction(() => Boolean(document.querySelector('vite-error-overlay')), undefined, { timeout: 10000 })
        writeFileSync(reference, tokens(7))
      }
      if (phase === 'resource-update') writeFileSync(pixel, svg('blue'))
      for (const client of clients) {
        let value, failure
        try {
          await client.page.waitForFunction(({ padding, changed, prior }) => {
            const style = getComputedStyle(document.querySelector('#target'))
            return window.ready && !document.querySelector('vite-error-overlay') && style.paddingTop === padding && (!changed || style.backgroundImage !== prior)
          }, { padding: phase === 'startup-restored' ? '32px' : '112px', changed: phase === 'resource-update', prior: client.resource }, { timeout: 10000 })
          value = await client.page.evaluate(async () => {
            const style = getComputedStyle(document.querySelector('#target')), url = style.backgroundImage.match(/^url\(["']?(.*?)["']?\)$/)?.[1]
            const image = new Image(); image.src = url; await image.decode()
            const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1
            const context = canvas.getContext('2d'); context.drawImage(image, 0, 0)
            return { padding: style.paddingTop, url, resource: style.backgroundImage, pixel: [...context.getImageData(0, 0, 1, 1).data], bootID: window.bootID, leakedBorder: getComputedStyle(document.querySelector('#leak')).borderLeftWidth }
          })
          if (phase === 'startup-restored') client.bootID = value.bootID
          assert.equal(value.bootID, client.bootID); assert.equal(value.leakedBorder, '0px')
          assert.deepEqual(value.pixel, phase === 'resource-update' ? [0, 0, 255, 255] : [255, 0, 0, 255])
          const response = await client.page.request.get(value.url)
          assert.equal(response.status(), 200); assert.ok(response.headers()['content-type'].includes('image/svg+xml'))
          assert.equal(await response.text(), svg(phase === 'resource-update' ? 'blue' : 'red'))
          assert.equal(new URL(value.url).search, '?v=1'); assert.equal(new URL(value.url).hash, '#icon')
          assert.deepEqual(client.errors, [])
          assert.ok(client.failedResponses.every(response => response.status === 500))
          client.resource = value.resource
        } catch (error) { failure = String(error) }
        const row = { syntax, kind, mode, browser: client.browserName, phase, value, failure, pass: !failure, expectedFailureEvidence: { responses: client.failedResponses, errors: client.errors, messages: client.messages.filter(message => ['error', 'full-reload'].includes(message.type)) } }
        rows.push(row); console.log(JSON.stringify(row))
      }
    }
  } finally { for (const { browser } of clients) await browser.close(); await server?.environments.client.waitForRequestsIdle(); await server?.close(); rmSync(root, { recursive: true, force: true }) }
}
console.log(JSON.stringify({ summary: true, syntax, observations: rows.length, failures: rows.filter(row => !row.pass).length }))
if (rows.some(row => !row.pass)) process.exitCode = 1
