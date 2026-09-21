// Run with MASTER_CSS_NATIVE_BINDING_PATH=<release dylib> node --expose-gc --import tsx
// benchmarks/performance-audit.mjs --output benchmarks/.results/performance-audit/before.json
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { cpus, platform, arch } from 'node:os'
import { gzipSync, brotliCompressSync } from 'node:zlib'
import { createServer } from 'vite'
import { chromium } from '@playwright/test'
import { createEngineSync } from '../packages/css/src/node.ts'
import { createScanner } from '../packages/tooling/src/scanner/core.ts'
import { createLanguageSession } from '../packages/tooling/src/language/binding-session.ts'
import { loadNativeBinding } from '../packages/binding/src/native-loader.ts'
import manifest from '@master/css-preset/default-manifest.json' with { type: 'json' }

const samples = 5
const report = {
  environment: { cpu: cpus()[0].model, platform: platform(), arch: arch(), node: process.version,
    nativeBinding: loadNativeBinding({ required: true }).source, samples, warmup: 1 },
  limits: ['Advisory, same-machine comparison only.', 'Heap deltas exclude native/Wasm allocations.',
    'Browser probes include source adaptation; package benchmark covers the bundled artifact.'],
  measurements: [], assets: []
}
const summarize = (values) => {
  const sorted = values.toSorted((a, b) => a - b)
  return { medianMs: sorted[Math.floor(sorted.length / 2)], p90Ms: sorted[Math.ceil(sorted.length * .9) - 1], samples: values }
}
async function measure(name, count, operation) {
  await operation()
  globalThis.gc?.()
  const before = process.memoryUsage()
  const values = []
  for (let i = 0; i < samples; i++) {
    const start = performance.now()
    await operation()
    values.push(performance.now() - start)
  }
  globalThis.gc?.()
  const after = process.memoryUsage()
  const result = { name, count, ...summarize(values), heapDelta: after.heapUsed - before.heapUsed, rssDelta: after.rss - before.rss }
  report.measurements.push(result)
  console.log(JSON.stringify(result))
}

const language = await createLanguageSession(manifest, { binding: 'native' })
for (const count of [250, 500, 1000, 2000]) {
  const source = '<div class="block"></div>\n'.repeat(count)
  await measure('language-analysis', count, () => {
    const result = language.analyzeDocument({ source, languageId: 'html' })
    assert.equal(result.classPositions.length, count)
    assert.equal(result.semanticTokens.length, count)
  })
}
language.dispose()

const scanner = await createScanner({ manifest, binding: 'native', verbose: 0 })
const source = '<div class="' + Array.from({ length: 100 }, (_, i) => `w:${i + 1}px`).join(' ') + '"></div>'
await scanner.scan('repeat.html', source)
const calls = {}
for (const key of Object.keys(scanner.bindingSession)) {
  const original = scanner.bindingSession[key]
  if (typeof original === 'function') scanner.bindingSession[key] = (...args) => {
    calls[key] = (calls[key] || 0) + 1
    return original(...args)
  }
}
await measure('scanner-cache-hit', 100, async () => assert.equal(await scanner.scan('repeat.html', source), false))
report.scannerCalls = { ...calls }
await scanner.dispose()

for (const count of [50, 100, 200]) {
  const custom = { version: 1,
    variables: { tone: Array.from({ length: count }, (_, i) => ({ name: `tone-${i}`, key: `${i}`, value: 'red' })) },
    utilities: Array.from({ length: count }, (_, i) => ({ id: `t${i}`, name: `t${i}`, type: 0,
      emit: { type: 'static', rules: [{ declarations: { color: `var(--tone-${i})` } }] },
      matchers: [{ type: 'static', name: `t${i}` }] })) }
  const engine = createEngineSync({ manifest: custom })
  const classes = Array.from({ length: count }, (_, i) => `t${i}`)
  const transition = engine.ensureClassRules(classes)
  const inserts = transition.mutations.filter(m => m.target === 'theme' && m.op === 'insert')
  assert.equal(engine.snapshot().resources.variables.length, count)
  report.measurements.push({ name: 'theme-batch', count, themeInserts: inserts.length,
    intermediateBytes: inserts.reduce((sum, m) => sum + Buffer.byteLength(m.text), 0),
    finalBytes: Buffer.byteLength(engine.snapshot().resources.themeText) })
  engine.dispose()
}

const server = await createServer({ appType: 'custom', configFile: false,
  define: { 'process.env.NODE_ENV': JSON.stringify('production') }, logLevel: 'error',
  root: resolve('packages/runtime'), server: { cors: true, host: '127.0.0.1', port: 0 } })
let browser
try {
  await server.listen()
  browser = await chromium.launch()
  report.environment.browser = browser.version()
  for (const count of [1000, 5000]) {
    const page = await browser.newPage()
    const url = server.resolvedUrls.local[0] + 'e2e/runtime-loader.ts'
    await page.evaluate(async url => { await (await import(url)).startCSSRuntime() }, url)
    const result = await page.evaluate(({ count, samples }) => {
      const runtime = globalThis.__MASTER_CSS_RUNTIME_TEST__
      const classes = Array.from({ length: count }, (_, i) => `w:${i + 1}px`)
      runtime.ensureClassRules(classes)
      const calls = {}
      const engine = runtime.bindingEngine
      for (const key of ['snapshot', 'inspect', 'executionState']) {
        if (!engine[key]) continue
        const original = engine[key].bind(engine)
        engine[key] = (...args) => { calls[key] = (calls[key] || 0) + 1; return original(...args) }
      }
      const values = []
      for (let i = 0; i <= samples; i++) {
        const start = performance.now()
        if (runtime.ensureClassRules([classes.at(-1)]).mutations.length) throw new Error('Warm ensure mutated CSS')
        if (i) values.push(performance.now() - start)
      }
      return { values, calls }
    }, { count, samples })
    report.measurements.push({ name: 'runtime-warm-ensure', count, ...summarize(result.values), calls: result.calls })
    await page.close()
  }
} finally { await browser?.close(); await server.close() }

for (const path of ['packages/runtime/dist/global.min.js', 'packages/runtime/dist/default-manifest.json', 'packages/runtime/artifacts/mastercss_binding_wasm_engine_bg.wasm']) {
  const bytes = await readFile(path)
  report.assets.push({ path, raw: bytes.length, gzip: gzipSync(bytes).length, brotli: brotliCompressSync(bytes).length })
}
const output = process.argv[process.argv.indexOf('--output') + 1]
if (!process.argv.includes('--output') || !output) throw new Error('Pass --output under benchmarks/.results/')
if (!resolve(output).startsWith(resolve('benchmarks/.results') + '/')) throw new Error('Reports belong under benchmarks/.results/')
await mkdir(dirname(output), { recursive: true })
await writeFile(output, JSON.stringify(report, null, 2) + '\n')
console.log(`Report: ${output}`)
