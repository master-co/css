import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { gzipSync, brotliCompressSync } from 'node:zlib'

assert(process.cwd().includes('master-css-bh-isolated-'))
const suite = process.argv[2]
assert(['browser-lifecycle', 'master-delivery-modes', 'interaction-cost', 'progressive-hydration-diagnostics', 'runtime-mutation-diagnostics', 'runtime-style-invalidation-diagnostics', 'report-smoke'].includes(suite))
const child = spawn('pnpm', [`bench:${suite}`, '--run'], { stdio: 'inherit', env: {
  ...process.env, BENCHMARK_ROUNDS: '1', MASTER_DELIVERY_MODE_ROUNDS: '1',
  BROWSER_LIFECYCLE_SCENARIOS: 'initial-load', BROWSER_LIFECYCLE_ROUNDS: '1',
  BROWSER_LIFECYCLE_WARMUP_ROUNDS: '0', BROWSER_LIFECYCLE_TRACE_ARTIFACT_MODE: 'off'
} })
const code = await new Promise((done, reject) => { child.on('error', reject); child.on('exit', done) })
console.log(JSON.stringify({ suite, commandExit: code }))
if (code !== 0) process.exit(code || 1)
const report = JSON.parse(await readFile(`.results/${suite}/report.json`, 'utf8'))
assert.equal(report.suite, suite)
const wasm = await readFile('node_modules/@master/css-runtime/artifacts/mastercss_binding_wasm_engine_bg.wasm')
const hash = createHash('sha256').update(wasm).digest('hex')
const sizes = { raw: wasm.length, gzip: gzipSync(wasm).length, brotli: brotliCompressSync(wasm).length }
const rows = []
for (const variant of report.variants) {
  const samples = report.samples.filter((sample) => sample.variantId === variant.id)
  const usesRuntime = /master-(runtime|progressive)/.test(variant.id)
  if (['browser-lifecycle', 'master-delivery-modes'].includes(suite)) {
    for (const [encoding, bytes] of Object.entries(sizes)) {
      const id = `runtime-wasm-${encoding}-bytes`
      assert(report.metrics.some((metric) => metric.id === id))
      assert.deepEqual(samples.filter((sample) => sample.metricId === id).map((sample) => sample.value), [usesRuntime ? bytes : 0])
      const summary = report.summary.find((entry) => entry.variantId === variant.id && entry.metricId === id)
      assert.equal(summary.median, usesRuntime ? bytes : 0)
    }
    const artifacts = report.artifacts.filter((artifact) => artifact.path.includes(`/pages/${variant.id}/`) && artifact.path.endsWith('.wasm'))
    assert.equal(artifacts.length, usesRuntime ? 1 : 0)
    for (const artifact of artifacts) {
      assert.equal(artifact.sha256, hash)
      for (const [encoding, bytes] of Object.entries(sizes)) assert.equal(artifact[`${encoding}Bytes`], bytes)
    }
  }
  rows.push({ id: variant.id, samples: samples.length, legacyRuntimeCounts: samples.filter((sample) => ['runtime-generated-rule-count', 'runtime-style-raw-bytes', 'cssom-rule-count', 'computed-style-valid'].includes(sample.metricId)).map(({ metricId, value }) => ({ metricId, value })) })
}
const declared = new Set(report.metrics.map((metric) => metric.id))
assert(report.samples.every((sample) => declared.has(sample.metricId)))
console.log(JSON.stringify({ suite, variants: rows, artifactCount: report.artifacts.length, wasmArtifacts: report.artifacts.filter((artifact) => artifact.path.endsWith('.wasm')).length, wasm: { ...sizes, hash }, pass: true }))
if (suite === 'browser-lifecycle') {
  const { startBrowserLifecycleServer } = await import(pathToFileURL(resolve('shared/browser-lifecycle-server.ts')))
  const { createRequire } = await import('node:module')
  const { chromium, firefox, webkit } = createRequire(resolve('package.json'))('@playwright/test')
  for (const [engine, launcher] of Object.entries({ chromium, firefox, webkit })) {
    const browser = await launcher.launch()
    try {
      for (const id of await readdir('.results/browser-lifecycle/pages')) {
        const server = await startBrowserLifecycleServer(resolve('.results/browser-lifecycle/pages', id))
        const page = await browser.newPage()
        const responses = []
        page.on('response', (response) => { if (response.url().endsWith('.wasm')) responses.push({ status: response.status(), mime: response.headers()['content-type'] }) })
        try {
          await page.goto(server.origin)
          await page.waitForFunction('globalThis.__benchmarkReady === true')
          const usesRuntime = /master-(runtime|progressive)/.test(id)
          assert.equal(responses.length, usesRuntime ? 1 : 0)
          assert(responses.every((response) => response.status === 200 && response.mime === 'application/wasm'))
          if (usesRuntime) {
            const state = await page.evaluate('({rules: Object.keys(masterCSSRuntime.snapshot().classRules).length, css: masterCSSRuntime.snapshot().cssText})')
            assert(state.rules > 0 && state.css.length > 0)
          }
          console.log(JSON.stringify({ lifecyclePage: id, engine, responses, pass: true }))
        } finally { await page.close(); await server.close() }
      }
    } finally { await browser.close() }
  }
}
