import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'

const workspace = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const sassDirectory = dirname(createRequire(require.resolve('vite')).resolve('sass'))
const { build, createServer, preview } = await import(require.resolve('vite'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const command = process.env.BH_COMMAND ?? 'serve', syntax = process.env.BH_SYNTAX ?? 'scss'
assert.ok(['serve', 'build'].includes(command)); assert.ok(['scss', 'sass'].includes(syntax))
const parent = join(workspace, 'packages/vite/tmp'); mkdirSync(parent, { recursive: true })
const rows = []
for (const mode of ['static', 'runtime', 'pre-render', 'progressive']) {
  const root = realpathSync(mkdtempSync(join(parent, 'partial-reference-browser-'))), clients = []
  let server, previewServer
  const svg = color => `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="${color}"/></svg>`
  const tokens = padding => `@utilities{paint{padding:${padding}rem;background-image:url("./pixel.svg?v=1#icon")}}.never{border-left:99px solid red}`
  try {
    mkdirSync(join(root, 'node_modules')); symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
    mkdirSync(join(root, 'nested')); mkdirSync(join(root, 'shared'))
    writeFileSync(join(root, 'tokens.css'), '@utilities{paint{padding:99rem}}')
    writeFileSync(join(root, 'nested/tokens.css'), '@utilities{paint{padding:99rem}}')
    writeFileSync(join(root, 'shared/tokens.css'), tokens(2))
    writeFileSync(join(root, 'shared/next.css'), tokens(4))
    const partial = target => syntax === 'scss' ? `@reference "./${target}.css";.target{@compose paint;}` : `@reference "./${target}.css"\n.target\n  @compose paint\n`
    writeFileSync(join(root, `shared/_rules.${syntax}`), partial('tokens'))
    writeFileSync(join(root, 'shared/pixel.svg'), svg('red'))
    writeFileSync(join(root, `nested/child.${syntax}`), syntax === 'scss' ? '@use "../shared/rules";' : '@use "../shared/rules"\n')
    writeFileSync(join(root, 'style.module.css'), `@import "./nested/child.${syntax}" layer(owner);`)
    writeFileSync(join(root, 'client.js'), 'import names from "./style.module.css";const apply=names=>{document.querySelector("#target").className=names.target;window.ready=true};apply(names);if(import.meta.hot)import.meta.hot.accept("./style.module.css",next=>apply(next.default));window.bootID=Math.random();')
    writeFileSync(join(root, 'index.html'), '<!doctype html><div id="target"></div><div class="never" id="leak"></div><script type="module" src="./client.js"></script>')
    const config = { root, base: '/base/', cacheDir: join(root, '.vite'), configFile: false, logLevel: 'silent', plugins: createMasterCSSVitePlugin({ mode }), server: { host: '127.0.0.1', port: 0 }, build: { assetsInlineLimit: 0 } }
    if (command === 'serve') { server = await createServer(config); await server.listen() }
    else { await build(config); previewServer = await preview({ ...config, preview: { host: '127.0.0.1', port: 0 } }) }
    for (const browserName of ['chromium', 'firefox', 'webkit']) {
      const browser = await browsers[browserName].launch(), page = await browser.newPage(), errors = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
      clients.push({ browserName, browser, page, errors })
      await page.goto((server ?? previewServer).resolvedUrls.local[0])
    }
    for (const phase of command === 'build' ? ['initial'] : ['initial', 'partial-update', 'reference-update', 'resource-update']) {
      if (phase === 'partial-update') writeFileSync(join(root, `shared/_rules.${syntax}`), partial('next'))
      if (phase === 'reference-update') writeFileSync(join(root, 'shared/next.css'), tokens(7))
      if (phase === 'resource-update') writeFileSync(join(root, 'shared/pixel.svg'), svg('blue'))
      for (const client of clients) {
        let value, failure
        try {
          await client.page.waitForFunction(({ padding, changed, prior }) => {
            const style = getComputedStyle(document.querySelector('#target'))
            return window.ready && style.paddingTop === padding && (!changed || style.backgroundImage !== prior)
          }, { padding: phase === 'initial' ? '32px' : phase === 'partial-update' ? '64px' : '112px', changed: phase === 'resource-update', prior: client.resource }, { timeout: 10000 })
          value = await client.page.evaluate(async () => {
            const style = getComputedStyle(document.querySelector('#target'))
            const url = style.backgroundImage.match(/^url\(["']?(.*?)["']?\)$/)?.[1]
            const image = new Image(); image.src = url; await image.decode()
            const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1
            const context = canvas.getContext('2d'); context.drawImage(image, 0, 0)
            return { padding: style.paddingTop, resource: style.backgroundImage, url, pixel: [...context.getImageData(0, 0, 1, 1).data], bootID: window.bootID, leakedBorder: getComputedStyle(document.querySelector('#leak')).borderLeftWidth }
          })
          if (phase === 'initial') client.bootID = value.bootID
          assert.equal(value.bootID, client.bootID)
          assert.equal(value.leakedBorder, '0px')
          assert.deepEqual(value.pixel, phase === 'resource-update' ? [0, 0, 255, 255] : [255, 0, 0, 255])
          const response = await client.page.request.get(value.url)
          assert.equal(response.status(), 200); assert.ok(response.headers()['content-type'].includes('image/svg+xml'))
          assert.equal(await response.text(), svg(phase === 'resource-update' ? 'blue' : 'red'))
          assert.equal(new URL(value.url).search, '?v=1'); assert.equal(new URL(value.url).hash, '#icon')
          assert.deepEqual(client.errors, [])
          client.resource = value.resource
        } catch (error) { failure = String(error) }
        const row = { command, syntax, mode, browser: client.browserName, phase, value, failure, pass: !failure }
        rows.push(row); console.log(JSON.stringify(row))
      }
    }
  } finally {
    for (const { browser } of clients) await browser.close()
    await server?.environments.client.waitForRequestsIdle(); await server?.close(); await previewServer?.close()
    rmSync(root, { recursive: true, force: true })
  }
}
console.log(JSON.stringify({ summary: true, command, syntax, observations: rows.length, failures: rows.filter(row => !row.pass).length }))
if (rows.some(row => !row.pass)) process.exitCode = 1
