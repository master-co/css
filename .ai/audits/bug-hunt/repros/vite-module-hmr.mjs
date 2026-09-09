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
  for (const mode of process.env.BH_MODE ? [process.env.BH_MODE] : ['pure', 'entry', 'local']) {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-module-hmr-'))), clients = []
    let server
    try {
      mkdirSync(join(root, 'node_modules'))
      symlinkSync(dirname(createRequire(require.resolve('vite')).resolve('sass')), join(root, 'node_modules/sass'), 'dir')
      const child = join(root, process.env.BH_NESTED ? 'leaf.module.css' : 'shared.module.css'), file = `style.module.${extension}`
      const childSource = color => `.${process.env.BH_NESTED ? 'leaf' : 'shared'} { color: ${color}; }`
      writeFileSync(child, childSource('red'))
      if (process.env.BH_NESTED) writeFileSync(join(root, 'shared.module.css'), '.shared { composes: leaf from "./leaf.module.css"; }')
      const style = (mode === 'entry' ? '@master entry;\n' : '') + (extension === 'scss' ? '$tone: blue;\n' : '') + `.example { composes: shared from "./shared.module.css"; ${mode === 'local' ? '@compose bg:#0000ff;' : `background-color: ${extension === 'scss' ? '$tone' : 'blue'};`} }`
      writeFileSync(join(root, file), style)
      writeFileSync(join(root, 'entry.js'), `import names, { example } from './${file}';
        function apply(value) { window.names=value;document.querySelector('#target').className=value.example; }
        window.updates=0;window.named=example;apply(names);
        if(import.meta.hot) import.meta.hot.accept('./${file}',mod=>{window.updates++;window.named=mod.example;apply(mod.default)});`)
      writeFileSync(join(root, 'index.html'), '<div id="target">test</div><script type="module" src="./entry.js"></script>')
      server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: mode === 'pure' ? [] : createMasterCSSVitePlugin({ mode: 'static', runtime: false }).filter(plugin => !process.env.BH_NO_PREPROCESS || plugin.name !== 'master-css:sass-source'), server: { host: '127.0.0.1', port: 0 } })
      await server.listen()
      const url = server.resolvedUrls.local[0]
      for (const name of ['chromium', 'firefox', 'webkit']) {
        const browser = await engines[name].launch(), page = await browser.newPage(), errors = [], requests = []
        page.on('pageerror', error => errors.push(error.message))
        page.on('response', response => { if (response.status() >= 400) requests.push({ url: response.url(), status: response.status() }) })
        await page.addInitScript(() => { window.bootID = Math.random() })
        await page.goto(url)
        const bootID = await page.evaluate(() => window.bootID)
        clients.push({ name, browser, page, errors, requests, bootID })
      }
      for (const phase of ['initial', 'child-edit', 'root-edit']) {
        const minimumUpdates = new Map(await Promise.all(clients.map(async client => [client.name, phase === 'initial' ? 0 : (await client.page.evaluate(() => window.updates ?? 0)) + 1])))
        if (phase === 'child-edit') writeFileSync(child, childSource('green'))
        if (phase === 'root-edit') writeFileSync(join(root, file), style + '\n/* root change */')
        await Promise.all(clients.map(async ({ name, page, errors, requests, bootID }) => {
          const expected = phase === 'initial' ? 'rgb(255, 0, 0)' : 'rgb(0, 128, 0)'
          let waitError
          try {
            await page.waitForFunction(({ expected, updates, bootID }) => {
              const el = document.querySelector('#target'), css = getComputedStyle(el)
              return css.color === expected && css.backgroundColor === 'rgb(0, 0, 255)' && window.names?.example === window.named && window.updates >= updates && window.bootID === bootID
            }, { expected, updates: minimumUpdates.get(name), bootID }, { timeout: 7000 })
          } catch (error) { waitError = error.message }
          const value = await page.locator('#target').evaluate(el => ({ color: getComputedStyle(el).color, background: getComputedStyle(el).backgroundColor, names: window.names, named: window.named, updates: window.updates, bootID: window.bootID }))
          const row = { extension, mode, nested: Boolean(process.env.BH_NESTED), preprocessorBridge: !process.env.BH_NO_PREPROCESS && mode !== 'pure', phase, browser: name, value, expected, errors: [...errors], requests: [...requests], waitError, result: !waitError && !errors.length && !requests.length ? 'PASS' : 'FAIL' }
          rows.push(row); console.log(JSON.stringify(row))
        }))
      }
    } catch (error) {
      rows.push({ extension, mode, phase: 'host-error', error: String(error), result: 'FAIL' }); console.log(JSON.stringify(rows.at(-1)))
    } finally {
      for (const client of clients) await client.browser.close()
      await server?.close(); rmSync(root, { recursive: true, force: true })
    }
  }
}
const summary = { comparisons: rows.length, failures: rows.filter(row => row.result === 'FAIL').length }
console.log(JSON.stringify(summary)); assert.equal(summary.failures, 0)
