import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

assert(process.cwd().includes('master-css-bh-isolated-'))
const repo = fileURLToPath(new URL('../../../../', import.meta.url))
const evidence = resolve(repo, '.ai/audits/bug-hunt/evidence')
const run = spawnSync(process.execPath, ['--import', 'tsx', 'interaction-cost/run-report.ts'], {
  env: { ...process.env, INTERACTION_COST_ROUNDS: '1', INTERACTION_COST_WARMUP_ROUNDS: '0' },
  stdio: 'inherit', timeout: 480000
})
console.log(JSON.stringify({ originalReportStatus: run.status, signal: run.signal, error: run.error?.message }))
const artifacts = resolve('.results/interaction-cost/artifacts')
const originalDiagnostics = []
if (existsSync(artifacts)) {
  for (const entry of readdirSync(artifacts, { recursive: true })) {
    if (entry.endsWith('interaction.json')) originalDiagnostics.push({ path: entry, data: JSON.parse(readFileSync(resolve(artifacts, entry), 'utf8')) })
  }
}
writeFileSync(resolve(evidence, '0077-original-diagnostics.json'), JSON.stringify({ originalReportStatus: run.status, originalDiagnostics }, null, 2))
const { createInteractionPage } = await import(pathToFileURL(resolve('shared/interaction-cost.ts')))
let root
const server = createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname
  const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname))
  if (!file.startsWith(root + sep)) { response.writeHead(403); response.end(); return }
  try {
    const bytes = readFileSync(file)
    response.writeHead(200, { 'content-type': ({ '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm' })[extname(file)] || 'application/octet-stream' })
    response.end(bytes)
  } catch { response.writeHead(404); response.end('Not found') }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`
const { chromium } = createRequire(resolve(repo, 'package.json'))('@playwright/test')
const browser = await chromium.launch()
const rows = []
const observe = async page => page.evaluate(() => {
  const snapshot = globalThis.masterCSSRuntime?.snapshot()
  return { ready: globalThis.__benchmarkReady === true, reported: globalThis.__readInteractionState(),
    snapshot: snapshot ? { rules: Object.keys(snapshot.classRules).length, cssBytes: new TextEncoder().encode(snapshot.cssText).length, hydration: snapshot.hydration, usageCounts: snapshot.usageCounts } : null }
})
try {
  for (const modeId of ['master-static', 'master-runtime', 'master-progressive', 'tailwind-static']) {
    root = (await createInteractionPage({ fixtureId: 'dynamic', modeId, scenarioId: 'existing-class-toggle', variantId: `audit-dynamic-${modeId}-existing-class-toggle` })).root
    for (const sidecar of modeId.includes('runtime') || modeId.includes('progressive') ? [false, true] : [false]) {
      if (sidecar) {
        mkdirSync(resolve(root, 'artifacts'), { recursive: true })
        copyFileSync(resolve(repo, 'packages/runtime/artifacts/mastercss_binding_wasm_engine_bg.wasm'), resolve(root, 'artifacts/mastercss_binding_wasm_engine_bg.wasm'))
      }
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
      const failures = []
      page.on('response', response => { if (response.status() >= 400) failures.push({ url: response.url(), status: response.status() }) })
      page.on('pageerror', error => failures.push({ error: error.message }))
      await page.goto(origin)
      await page.waitForFunction(() => globalThis.__benchmarkReady === true, undefined, { timeout: 5000 }).catch(() => {})
      const before = await observe(page)
      const result = before.ready ? await page.evaluate(() => globalThis.__runInteractionScenario()) : null
      const after = await observe(page)
      rows.push({ modeId, sidecar, failures, before, result, after })
      console.log(JSON.stringify({ modeId, sidecar, ready: after.ready, computedStyleValid: result?.computedStyleValid, failures }))
      writeFileSync(resolve(evidence, '0077-browser-controls.json'), JSON.stringify({ browser: browser.version(), rows }, null, 2))
      await page.close()
    }
  }
  assert.equal(run.status, 1)
  assert.equal(rows.length, 6)
  for (const row of rows) {
    if (row.modeId.endsWith('static') || row.sidecar) {
      assert.equal(row.after.ready, true)
      assert.equal(row.result.computedStyleValid, 1)
      assert.equal(row.result.affectedElementCount, 64)
      assert.equal(row.result.cleanupValid, 1)
    } else {
      assert.equal(row.before.ready, false)
      assert(row.failures.some(f => f.status === 404 && f.url.endsWith('.wasm')))
    }
  }
  const progressive = rows.find(r => r.modeId === 'master-progressive' && r.sidecar)
  assert.equal(progressive.after.snapshot.hydration.state, 'progressive')
  assert.equal(progressive.after.reported.progressiveAdopted, 0)
  console.log(JSON.stringify({ validation: 'PASS', originalDiagnostics: originalDiagnostics.length, controls: rows.length }))
} finally {
  await browser.close()
  server.closeAllConnections()
  await new Promise(resolve => server.close(resolve))
}
