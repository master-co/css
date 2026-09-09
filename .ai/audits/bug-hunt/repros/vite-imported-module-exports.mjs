import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'

const workspace = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { createServer, build, preview } = await import(require.resolve('vite'))
const engines = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const parent = join(workspace, 'packages/vite/tmp');mkdirSync(parent, { recursive: true })
const rows = [], command = process.env.BH_COMMAND ?? 'serve'
const relations = process.env.BH_RELATIONS?.split(',') ?? ['import', 'composes']
for (const relation of relations) for (const childModule of [false, true]) {
  for (const mode of process.env.BH_MODES?.split(',') ?? ['pure', 'static', 'runtime', 'pre-render', 'progressive']) {
    const root = realpathSync(mkdtempSync(join(parent, 'imported-module-exports-browser-')))
    let server, previewServer
    const browsers = []
    try {
      const child = childModule ? 'child.module.css' : 'child.css'
      const css = mode === 'pure' ? 'padding:2rem' : '@compose p:2rem'
      writeFileSync(join(root, child), `.child{${css};}`)
      writeFileSync(join(root, 'style.module.css'), relation === 'import'
        ? `@import "./${child}" layer(guard) supports(display:grid) screen and (min-width:700px);.local{display:inline-flex}`
        : `.local{composes:child from "./${child}";display:inline-flex}`)
      writeFileSync(join(root, 'index.html'), '<!doctype html><div id="target">child</div><div id="local">local</div><div id="leak" class="child">global</div><script type="module" src="./client.js"></script>')
      writeFileSync(join(root, 'client.js'), `import names from './style.module.css';window.names=names;document.querySelector('#target').className=names.${relation === 'import' ? 'child' : 'local'}??'MISSING';document.querySelector('#local').className=names.local;window.ready=true`)
      const config = { root, base: '/base/', configFile: false, logLevel: 'silent', plugins: mode === 'pure' ? [] : createMasterCSSVitePlugin({ mode }), css: { modules: { generateScopedName: (name, file) => basename(file.split('?')[0]).replaceAll('.', '_') + '_' + name } }, server: { host: '127.0.0.1', port: 0 } }
      if (command === 'serve') { server = await createServer(config);await server.listen() }
      else { await build(config);previewServer = await preview({ ...config, preview: { host: '127.0.0.1', port: 0 } }) }
      for (const browserName of ['chromium', 'firefox', 'webkit']) {
        const browser = await engines[browserName].launch();browsers.push(browser)
        const page = await browser.newPage(), errors = []
        page.on('pageerror', error => errors.push(error.message))
        await page.goto((server ?? previewServer).resolvedUrls.local[0]);await page.waitForFunction(() => window.ready)
        for (const width of [900, 500]) {
          await page.setViewportSize({ width, height: 720 });await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
          const value = await page.evaluate(() => ({ names: window.names, className: document.querySelector('#target').className, padding: getComputedStyle(document.querySelector('#target')).paddingTop, display: getComputedStyle(document.querySelector('#local')).display, leakedPadding: getComputedStyle(document.querySelector('#leak')).paddingTop }))
          let error
          try {
            assert.deepEqual(errors, []);assert.equal(value.display, 'inline-flex');assert.equal(value.leakedPadding, '0px')
            assert.equal(value.padding, relation === 'import' && width < 700 ? '0px' : '32px')
            if (relation === 'import') assert.equal(value.names.child, 'style_module_css_child')
            else assert.equal(value.names.local, `style_module_css_local ${child.replaceAll('.', '_')}_child`)
          } catch (cause) { error = String(cause) }
          const row = { command, relation, childModule, mode, browser: browserName, width, value, errors, error, result: error ? 'FAIL' : 'PASS' }
          rows.push(row);console.log(JSON.stringify(row))
        }
        await browser.close();browsers.pop()
      }
    } finally {
      for (const browser of browsers) await browser.close()
      await server?.environments.client.waitForRequestsIdle();await server?.close()
      if (previewServer) await new Promise(resolve => previewServer.httpServer.close(resolve))
      rmSync(root, { recursive: true, force: true })
    }
  }
}
const result = { observations: rows.length, failures: rows.filter(row => row.result === 'FAIL').length }
console.log(JSON.stringify(result));assert.equal(result.failures, 0)
