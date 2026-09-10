import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const sassDirectory = dirname(createRequire(require.resolve('vite')).resolve('sass'))
const { createServer } = await import(require.resolve('vite'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const rows = []
for (const mode of (process.env.BH_MODE ? [process.env.BH_MODE] : ['static', 'runtime', 'pre-render', 'progressive'])) for (const syntax of (process.env.BH_SYNTAX ? [process.env.BH_SYNTAX] : ['scss', 'sass'])) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-proxy-link-browser-'))), clients = []
  let server
  try {
    mkdirSync(join(root, 'node_modules'));symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
    mkdirSync(join(root, 'nested'))
    const tokens = padding => `@utilities{paint{padding:${padding}rem;background:url("./pixel.svg?v=1#icon")}}`
    writeFileSync(join(root, 'nested/tokens.css'), tokens(2))
    writeFileSync(join(root, 'nested/pixel.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="red"/></svg>')
    writeFileSync(join(root, `nested/child.${syntax}`), syntax === 'scss' ? '@reference "./tokens.css";.target{@compose paint;}' : '@reference "./tokens.css"\n.target\n  @compose paint\n')
    writeFileSync(join(root, 'style.module.css'), `@import "./nested/child.${syntax}" layer(owner);`)
    writeFileSync(join(root, 'entry.js'), 'export {default} from "./style.module.css";')
    server = await createServer({ root, base: '/base/', cacheDir: join(root, '.vite'), configFile: false, logLevel: 'silent', plugins: createMasterCSSVitePlugin({ mode, runtime: false }), server: { host: '127.0.0.1', port: 0 } })
    await server.listen()
    await server.environments.client.transformRequest('/entry.js')
    const module = await server.environments.client.transformRequest('/style.module.css'), proxy = module.code.match(/import\s+"([^"]+\.css)"/)?.[1]
    assert(proxy)
    const names = (await server.ssrLoadModule('/entry.js')).default
    assert.deepEqual(Object.keys(names), ['target'])
    // Vite adds base when transforming authored HTML asset paths.
    const authoredProxy = proxy.startsWith(server.config.base) ? '/' + proxy.slice(server.config.base.length) : proxy
    writeFileSync(join(root, 'proxy.html'), `<!doctype html><link rel="stylesheet" href="${authoredProxy}?direct"><div id="target" class="${names.target}">Target</div><script>window.bootID=Math.random()</script>`)
    for (const browserName of ['chromium', 'firefox', 'webkit']) {
      const browser = await browsers[browserName].launch(), page = await browser.newPage(), errors = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()}:${response.url()}`) })
      clients.push({ browserName, browser, page, errors })
      await page.goto(new URL('proxy.html', server.resolvedUrls.local[0]).href)
    }
    for (const padding of [2, 7]) {
      if (padding === 7) writeFileSync(join(root, 'nested/tokens.css'), tokens(7))
      for (const client of clients) {
        await client.page.waitForFunction(expected => getComputedStyle(document.querySelector('#target')).paddingTop === expected, `${padding * 16}px`, { timeout: 10000 }).catch(async error => { console.log(JSON.stringify({ mode, syntax, browser: client.browserName, padding, errors: client.errors, html: await client.page.content(), styles: await client.page.evaluate(() => [...document.styleSheets].map(sheet => ({ href: sheet.href, rules: [...sheet.cssRules].map(rule => rule.cssText) }))) }));throw error })
        const actual = await client.page.evaluate(async () => {
          const style = getComputedStyle(document.querySelector('#target')), url = style.backgroundImage.match(/^url\(["']?(.*?)["']?\)$/)?.[1]
          const image = new Image();image.src = url;await image.decode()
          const canvas = document.createElement('canvas');canvas.width = canvas.height = 1
          const context = canvas.getContext('2d');context.drawImage(image, 0, 0)
          return { padding: style.paddingTop, pixel: [...context.getImageData(0, 0, 1, 1).data], resource: url, bootID: window.bootID, links: [...document.querySelectorAll('link[rel=stylesheet]')].map(link => link.href) }
        })
        if (padding === 2) client.bootID = actual.bootID
        assert.equal(actual.bootID, client.bootID);assert.deepEqual(actual.pixel, [255, 0, 0, 255]);assert.deepEqual(client.errors, [])
        assert.equal(actual.links.length, 1);assert(actual.links[0].includes('.master-css-sass.css'))
        assert.equal(new URL(actual.resource).search, '?v=1');assert.equal(new URL(actual.resource).hash, '#icon')
        const row = { mode, syntax, browser: client.browserName, phase: padding === 2 ? 'initial' : 'reference-hmr', actual, pass: true };rows.push(row);console.log(JSON.stringify(row))
      }
    }
  } finally { for (const { browser } of clients) await browser.close();await server?.environments.client.waitForRequestsIdle();await server?.close();rmSync(root, { recursive: true, force: true }) }
}
console.log(JSON.stringify({ observations: rows.length, failures: 0, scope: 'Built plugin; sole native CSS proxy link, reference HMR without page reload, nested resource pixels and base path' }))
