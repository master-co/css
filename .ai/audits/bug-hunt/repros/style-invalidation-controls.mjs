import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

assert(process.cwd().includes('master-css-bh-isolated-'))
const repo = fileURLToPath(new URL('../../../../', import.meta.url))
const evidence = resolve(repo, '.ai/audits/bug-hunt/evidence')
const run = spawnSync(process.execPath, ['--import', 'tsx', 'runtime-style-invalidation-diagnostics/run-report.ts'], {
  env: { ...process.env, RUNTIME_STYLE_INVALIDATION_DIAGNOSTIC_ROUNDS: '1', RUNTIME_STYLE_INVALIDATION_DIAGNOSTIC_WARMUP_ROUNDS: '0' }, stdio: 'inherit', timeout: 480000
})
console.log(JSON.stringify({ originalReportStatus: run.status, signal: run.signal, error: run.error?.message }))
const root = resolve('.results/runtime-style-invalidation-diagnostics/pages/dynamic-master-runtime-style-invalidation-runtime-baseline')
const source = readFileSync(resolve('shared/runtime-style-invalidation-diagnostics.ts'), 'utf8')
const require = createRequire(resolve(repo, 'package.json'))
const ts = require('typescript6')
function extract(name, next) {
  const text = source.slice(source.indexOf(`async function ${name}(`), source.indexOf(`async function ${next}(`))
  assert(text.startsWith(`async function ${name}(`))
  const compiled = ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText
  return new Function(compiled + `;return ${name}`)()
}
const originalPause = extract('pauseRuntimeObserver', 'traceRuntimeStyleInvalidationDiagnostic')
const originalSeed = extract('seedRetainedRuntimeRules', 'pauseRuntimeObserver')
const artifactRoot = resolve('.results/runtime-style-invalidation-diagnostics/artifacts')
const originalDiagnostics = []
if (existsSync(artifactRoot)) for (const path of readdirSync(artifactRoot, { recursive: true })) {
  if (path.endsWith('diagnostics.json')) originalDiagnostics.push({ path, data: JSON.parse(readFileSync(resolve(artifactRoot, path), 'utf8')) })
}
writeFileSync(resolve(evidence, '0080-original-diagnostics.json'), JSON.stringify({ originalReportStatus: run.status, originalDiagnostics }, null, 2))
const server = createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname
  const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname))
  if (!file.startsWith(root + sep)) { response.writeHead(403); response.end(); return }
  try {
    const bytes = readFileSync(file)
    response.writeHead(200, { 'content-type': ({ '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm' })[extname(file)] || 'application/octet-stream' })
    response.end(bytes)
  } catch { response.writeHead(404); response.end('Not found') }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`
const { chromium } = require('@playwright/test')
const browser = await chromium.launch()
const rows = []
try {
  for (const mode of ['missing-sidecar', 'original-pause', 'public-disconnect', 'original-retained-seed']) {
    if (mode !== 'missing-sidecar') {
      mkdirSync(resolve(root, 'artifacts'), { recursive: true })
      copyFileSync(resolve(repo, 'packages/runtime/artifacts/mastercss_binding_wasm_engine_bg.wasm'), resolve(root, 'artifacts/mastercss_binding_wasm_engine_bg.wasm'))
    }
    const page = await browser.newPage()
    const failures = []
    page.on('response', response => { if (response.status() >= 400) failures.push({ url: response.url(), status: response.status() }) })
    page.on('pageerror', error => failures.push({ error: error.message }))
    await page.goto(origin)
    await page.waitForFunction(() => globalThis.__benchmarkReady === true, undefined, { timeout: 5000 }).catch(() => {})
    const before = await page.evaluate(() => globalThis.masterCSSRuntime?.snapshot() || null)
    let reportedCount, error
    if (before) {
      try {
        if (mode === 'original-pause') reportedCount = await originalPause(page)
        else if (mode === 'original-retained-seed') reportedCount = await originalSeed(page, 2)
        else await page.evaluate(() => globalThis.masterCSSRuntime.disconnect())
      } catch (caught) { error = caught.message }
    }
    const state = await page.evaluate(() => ({ ready: globalThis.__benchmarkReady === true, names: globalThis.__interactionConfig.classes.temp,
      snapshot: globalThis.masterCSSRuntime?.snapshot() || null, reported: globalThis.__readInteractionState() }))
    rows.push({ mode, failures, reportedCount, error, before, ...state })
    writeFileSync(resolve(evidence, '0080-observer-controls.json'), JSON.stringify({ originalReportStatus: run.status, browser: browser.version(), rows }, null, 2))
    console.log(JSON.stringify({ mode, ready: state.ready, reportedCount, error, classes: state.names.map(n => Boolean(state.snapshot?.classRules[n])), failures }))
    await page.close()
  }
  assert.equal(run.status, 1)
  assert(rows[0].failures.some(f => f.status === 404 && f.url.endsWith('.wasm')))
  assert.equal(rows[0].ready, false)
  assert.equal(rows[1].ready, true)
  assert.equal(rows[1].reportedCount, 0)
  assert.equal(rows[1].snapshot.observing, true)
  assert.equal(rows[2].snapshot.observing, false)
  assert.deepEqual(rows[3].reportedCount, { classCount: 0, ruleCount: 0, rawBytes: 0 })
  console.log(JSON.stringify({ validation: 'PASS', controls: 4 }))
} finally {
  await browser.close()
  server.closeAllConnections()
  await new Promise(resolve => server.close(resolve))
}
