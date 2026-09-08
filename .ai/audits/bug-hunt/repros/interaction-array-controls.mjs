import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

assert(process.cwd().includes('master-css-bh-isolated-'))
const repo = fileURLToPath(new URL('../../../../', import.meta.url))
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
try {
  for (const strategy of ['baseline', 'defer-remove', 'suppress-remove-during-trace']) {
    root = (await createInteractionPage({ fixtureId: 'dynamic', modeId: 'master-runtime', scenarioId: 'mutation-cleanup-cycle',
      variantId: `audit-array-${strategy}`, runtimeDiagnostics: true, runtimeMutationStrategy: strategy })).root
    mkdirSync(resolve(root, 'artifacts'), { recursive: true })
    copyFileSync(resolve(repo, 'packages/runtime/artifacts/mastercss_binding_wasm_engine_bg.wasm'), resolve(root, 'artifacts/mastercss_binding_wasm_engine_bg.wasm'))
    const page = await browser.newPage()
    await page.goto(origin)
    await page.waitForFunction(() => globalThis.__benchmarkReady === true)
    const result = await page.evaluate(() => {
      const runtime = globalThis.masterCSSRuntime
      const names = ['w:123px', 'h:456px', 'p:7px']
      const metrics = globalThis.__interactionMetrics
      metrics.collectInteractionMutations = true
      const before = runtime.snapshot()
      runtime.ensureClassRules(names)
      const ensured = runtime.snapshot()
      runtime.deleteClassRules(names)
      const afterDelete = runtime.snapshot()
      metrics.collectInteractionMutations = false
      let flushResult, flushError
      try { flushResult = globalThis.__flushRuntimeMutationStrategy('audit-explicit-control') }
      catch (error) { flushError = { name: error.name, message: error.message } }
      const afterFlush = runtime.snapshot()
      return { names, before: names.map(n => Boolean(before.classRules[n])), ensured: names.map(n => Boolean(ensured.classRules[n])),
        afterDelete: names.map(n => Boolean(afterDelete.classRules[n])), afterFlush: names.map(n => Boolean(afterFlush.classRules[n])),
        flushResult, flushError, diagnostics: globalThis.__readRuntimeMutationDiagnostics() }
    })
    rows.push({ strategy, ...result })
    writeFileSync(resolve(repo, '.ai/audits/bug-hunt/evidence/0078-array-controls.json'), JSON.stringify({ browser: browser.version(), rows }, null, 2))
    console.log(JSON.stringify(rows.at(-1)))
    await page.close()
  }
  const baseline = rows[0]
  assert(baseline.before.every(v => !v) && baseline.ensured.every(Boolean))
  assert(baseline.afterDelete.every(v => !v))
  assert.equal(baseline.diagnostics.runtimeAddCallCount, 1)
  assert.equal(baseline.diagnostics.runtimeAddClassCount, 1)
  assert.equal(baseline.diagnostics.runtimeRemoveClassCount, 1)
  for (const row of rows.slice(1)) {
    assert(row.ensured.every(Boolean) && row.afterDelete.every(Boolean))
    assert(row.flushError || row.afterFlush.some(Boolean))
  }
  console.log(JSON.stringify({ validation: 'PASS', controls: rows.length }))
} finally {
  await browser.close()
  server.closeAllConnections()
  await new Promise(resolve => server.close(resolve))
}
