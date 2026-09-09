import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const workspace = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { createServer } = await import(require.resolve('vite'))
const engines = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const parent = join(workspace, 'packages/vite/tmp');mkdirSync(parent, { recursive: true })
let observations = 0
for (const accept of [false, true]) for (const browserName of ['chromium', 'firefox', 'webkit']) {
  const root = realpathSync(mkdtempSync(join(parent, 'pure-module-hmr-consumer-')))
  let server, browser
  try {
    writeFileSync(join(root, 'style.module.css'), '@import "./child.css";.local{display:block}')
    writeFileSync(join(root, 'child.css'), '.child{color:rgb(12,34,56)}')
    writeFileSync(join(root, 'index.html'), '<!doctype html><div id="target"></div><script type="module" src="./client.js"></script>')
    writeFileSync(join(root, 'client.js'), `import names from './style.module.css';const apply=names=>{document.querySelector('#target').className=names.child};apply(names);${accept ? "if(import.meta.hot)import.meta.hot.accept('./style.module.css',module=>apply(module.default));" : ''}window.bootID=Math.random()`)
    server = await createServer({ root, cacheDir: join(root, '.vite'), configFile: false, logLevel: 'silent', server: { host: '127.0.0.1', port: 0 } });await server.listen()
    browser = await engines[browserName].launch();const page = await browser.newPage()
    await page.goto(server.resolvedUrls.local[0]);await page.waitForFunction(() => getComputedStyle(document.querySelector('#target')).color === 'rgb(12, 34, 56)')
    const before = await page.evaluate(() => window.bootID)
    writeFileSync(join(root, 'child.css'), '.child{color:rgb(56,34,12)}')
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#target')).color === 'rgb(56, 34, 12)')
    const after = await page.evaluate(() => window.bootID)
    assert.equal(before === after, accept)
    console.log(JSON.stringify({ browser: browserName, accept, before, after, result: 'PASS' }));observations++
  } finally {
    await browser?.close();await server?.environments.client.waitForRequestsIdle();await server?.close();rmSync(root, { recursive: true, force: true })
  }
}
console.log(JSON.stringify({ observations, failures: 0 }))
