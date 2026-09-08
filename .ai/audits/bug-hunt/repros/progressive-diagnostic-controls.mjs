import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

assert(process.cwd().includes('master-css-bh-isolated-'))
const repo = fileURLToPath(new URL('../../../../', import.meta.url))
const run = spawnSync(process.execPath, ['--import', 'tsx', 'progressive-hydration-diagnostics/run-report.ts'], {
  env: { ...process.env, PROGRESSIVE_HYDRATION_DIAGNOSTIC_ROUNDS: '1' }, stdio: 'inherit', timeout: 120000
})
console.log(JSON.stringify({ originalReportStatus: run.status, error: run.error?.message }))
const root = resolve('.results/progressive-hydration-diagnostics/pages/minimal-master-progressive')
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
      const style = document.querySelector('style#master-css')
      const pending = Array.from(style?.sheet?.cssRules || [])
      let nativeStyleRules = 0
      for (let i = 0; i < pending.length; i++) {
        const rule = pending[i]
        if (rule.type === CSSRule.STYLE_RULE) nativeStyleRules++
        if ('cssRules' in rule) pending.push(...rule.cssRules)
      }
      return { ready: globalThis.__benchmarkReady === true, hidden: document.documentElement.hidden,
        colorProbeAlign: getComputedStyle(document.getElementById('benchmark-style-probe')).textAlign,
        reported: globalThis.__deliveryMetrics, nativeStyleRules, styleTextBytes: new TextEncoder().encode(style?.textContent || '').length,
        snapshot: snapshot ? { rules: Object.keys(snapshot.classRules).length, cssBytes: new TextEncoder().encode(snapshot.cssText).length, hydration: snapshot.hydration } : null }
    })
    rows.push({ sidecar, failures, ...state })
    await page.close()
  }
  writeFileSync(resolve(repo, '.ai/audits/bug-hunt/evidence/0076-runtime-controls.json'), JSON.stringify({ originalReportStatus: run.status, browser: browser.version(), rows }, null, 2))
  console.log(JSON.stringify(rows))
  assert.equal(run.status, 1)
  assert.equal(rows[0].ready, false)
  assert(rows[0].failures.some(r => r.url?.endsWith('.wasm') && r.status === 404))
  assert.equal(rows[1].ready, true)
  assert.equal(rows[1].hidden, false)
  assert.equal(rows[1].colorProbeAlign, 'center')
  assert(rows[1].snapshot.rules > 0 && rows[1].snapshot.cssBytes > 0)
  const { measureProgressiveHydrationDiagnostics } = await import(pathToFileURL(resolve('shared/delivery-modes.ts')))
  const result = await measureProgressiveHydrationDiagnostics({ browser, pageRoot: root,
    variantId: 'minimal-master-progressive', round: 0 })
  writeFileSync(resolve(repo, '.ai/audits/bug-hunt/evidence/0076-original-helper-control.json'), JSON.stringify(result, null, 2))
  assert.equal(rows[1].snapshot.hydration.state, 'progressive')
  assert.equal(rows[1].reported.progressiveAdopted, 1)
  assert.equal(result.diagnostics.progressive, false)
  assert.equal(result.diagnostics.runtimeStyleRawBytes, 0)
  assert(rows[1].nativeStyleRules > 0)
  assert.equal(result.diagnostics.runtimeGeneratedRuleCount, 0)
  console.log(JSON.stringify({ control: 'PASS', snapshot: rows[1].snapshot, reportedDiagnostics: result.diagnostics }))
} finally {
  await browser.close()
  server.closeAllConnections()
  await new Promise(resolve => server.close(resolve))
}
