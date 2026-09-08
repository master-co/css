import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

assert(process.cwd().includes('master-css-bh-isolated-'))
const repo = fileURLToPath(new URL('../../../../', import.meta.url))
const run = spawnSync(process.execPath, ['--import', 'tsx', 'master-delivery-modes/run-report.ts'], {
  env: { ...process.env, MASTER_DELIVERY_MODE_ROUNDS: '1' }, stdio: 'inherit', timeout: 120000
})
console.log(JSON.stringify({ originalReportStatus: run.status, error: run.error?.message }))
const root = resolve('.results/master-delivery-modes/pages/minimal-master-runtime')
assert(existsSync(resolve(root, 'index.html')))
const server = createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname
  const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname))
  if (!file.startsWith(root + sep)) { response.writeHead(403); response.end(); return }
  try {
    const bytes = readFileSync(file)
    response.writeHead(200, { 'content-type': ({ '.html': 'text/html', '.js': 'text/javascript',
      '.json': 'application/json', '.wasm': 'application/wasm' })[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' })
    response.end(bytes)
  } catch { response.writeHead(404); response.end('Not found') }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`
const require = createRequire(resolve(repo, 'package.json'))
const { chromium } = require('@playwright/test')
const browser = await chromium.launch()
const rows = []
try {
  for (const sidecar of [false, true]) {
    if (sidecar) {
      mkdirSync(resolve(root, 'artifacts'), { recursive: true })
      copyFileSync(resolve(repo, 'packages/runtime/artifacts/mastercss_binding_wasm_engine_bg.wasm'),
        resolve(root, 'artifacts/mastercss_binding_wasm_engine_bg.wasm'))
    }
    const page = await browser.newPage()
    const failures = []
    page.on('response', response => { if (response.status() >= 400) failures.push({ url: response.url(), status: response.status() }) })
    page.on('pageerror', error => failures.push({ pageError: error.message }))
    await page.goto(origin)
    await page.waitForFunction(() => globalThis.__benchmarkReady === true, undefined, { timeout: 5000 }).catch(() => {})
    const state = await page.evaluate(() => {
      const snapshot = globalThis.masterCSSRuntime?.snapshot()
      return { ready: globalThis.__benchmarkReady === true, hidden: document.documentElement.hidden,
        colorProbeAlign: getComputedStyle(document.getElementById('benchmark-style-probe')).textAlign,
        reported: globalThis.__deliveryMetrics,
        snapshot: snapshot ? { rules: Object.keys(snapshot.classRules).length, cssBytes: new TextEncoder().encode(snapshot.cssText).length } : null }
    })
    rows.push({ sidecar, failures, ...state })
    await page.close()
  }
  writeFileSync(resolve(repo, '.ai/audits/bug-hunt/evidence/0075-runtime-controls.json'), JSON.stringify({ originalReportStatus: run.status, browser: browser.version(), rows }, null, 2))
  console.log(JSON.stringify(rows))
  assert.equal(run.status, 1)
  assert.equal(rows[0].ready, false)
  assert(rows[0].failures.some(r => r.url?.endsWith('.wasm') && r.status === 404))
  assert.equal(rows[1].ready, true)
  assert.equal(rows[1].hidden, false)
  assert.equal(rows[1].colorProbeAlign, 'center')
  assert(rows[1].snapshot.rules > 0 && rows[1].snapshot.cssBytes > 0)
} finally {
  await browser.close()
  server.closeAllConnections()
  await new Promise(resolve => server.close(resolve))
}
