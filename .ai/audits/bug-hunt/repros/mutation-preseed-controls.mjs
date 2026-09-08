import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

assert(process.cwd().includes('master-css-bh-isolated-'))
const repo = fileURLToPath(new URL('../../../../', import.meta.url))
const evidence = resolve(repo, '.ai/audits/bug-hunt/evidence')
const run = spawnSync(process.execPath, ['--import', 'tsx', 'runtime-mutation-diagnostics/run-report.ts'], {
  env: { ...process.env, RUNTIME_MUTATION_DIAGNOSTIC_ROUNDS: '1' }, stdio: 'inherit', timeout: 120000
})
console.log(JSON.stringify({ originalReportStatus: run.status, signal: run.signal, error: run.error?.message }))
const root = resolve('.results/runtime-mutation-diagnostics/pages/dynamic-master-runtime-mutation-cleanup-cycle-before-flush-cold-temp-rules')
const source = readFileSync(resolve('shared/runtime-mutation-diagnostics.ts'), 'utf8')
const preseedSource = source.slice(source.indexOf('async function preseedRuntimeTempRules('), source.indexOf('async function traceRuntimeMutationDiagnostic('))
assert(preseedSource.startsWith('async function preseedRuntimeTempRules('))
const require = createRequire(resolve(repo, 'package.json'))
const ts = require('typescript6')
const compiled = ts.transpileModule(preseedSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText
const originalPreseed = new Function(compiled + ';return preseedRuntimeTempRules')()
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
  for (const mode of ['missing-sidecar', 'original-preseed', 'array-control']) {
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
        if (mode === 'original-preseed') reportedCount = await originalPreseed(page, { preseedTempRules: true })
        else await page.evaluate(() => globalThis.masterCSSRuntime.ensureClassRules(globalThis.__interactionConfig.classes.temp))
      } catch (caught) { error = caught.message }
    }
    const state = await page.evaluate(() => ({ ready: globalThis.__benchmarkReady === true, names: globalThis.__interactionConfig.classes.temp,
      snapshot: globalThis.masterCSSRuntime?.snapshot() || null, reported: globalThis.__readInteractionState() }))
    rows.push({ mode, failures, reportedCount, error, before, ...state })
    writeFileSync(resolve(evidence, '0079-preseed-controls.json'), JSON.stringify({ originalReportStatus: run.status, browser: browser.version(), rows }, null, 2))
    console.log(JSON.stringify({ mode, ready: state.ready, reportedCount, error, classes: state.names.map(n => Boolean(state.snapshot?.classRules[n])), failures }))
    await page.close()
  }
  assert.equal(run.status, 1)
  assert(rows[0].failures.some(f => f.status === 404 && f.url.endsWith('.wasm')))
  assert.equal(rows[0].ready, false)
  assert.equal(rows[1].ready, true)
  assert(rows[1].names.some(n => !rows[1].snapshot.classRules[n]))
  assert(rows[2].names.every(n => rows[2].snapshot.classRules[n]))
  console.log(JSON.stringify({ validation: 'PASS', controls: 3 }))
} finally {
  await browser.close()
  server.closeAllConnections()
  await new Promise(resolve => server.close(resolve))
}
