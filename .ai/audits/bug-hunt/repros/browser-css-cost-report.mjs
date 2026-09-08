import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

assert(process.cwd().includes('master-css-bh-isolated-'))
const run = spawnSync('pnpm', ['exec', 'vitest', 'bench', 'browser-css-cost', '--run'], {
  env: { ...process.env, BROWSER_COST_ROUNDS: '1', BROWSER_COST_WARMUP_ROUNDS: '0' },
  stdio: 'inherit', timeout: 900000
})
console.log(JSON.stringify({ status: run.status, signal: run.signal, error: run.error?.message }))
const path = '.results/browser-css-cost/report.json'
if (existsSync(path)) {
  const report = JSON.parse(readFileSync(path, 'utf8'))
  const evidence = fileURLToPath(new URL('../evidence', import.meta.url))
  writeFileSync(resolve(evidence, '0074-browser-css-cost-report.json'), JSON.stringify(report, null, 2))
  mkdirSync(resolve(evidence, '0074-traces'), { recursive: true })
  const rows = []
  const timingEvents = {
    'stylesheet-parse-ms': ['ParseAuthorStyleSheet', 'ParseStyleSheet', 'CSSParserImpl::parseStyleSheet'],
    'style-recalculation-ms': ['UpdateLayoutTree', 'RecalculateStyles', 'Document::updateStyle'],
    'layout-ms': ['Layout'], 'paint-ms': ['PrePaint', 'Paint']
  }
  assert.equal(report.variants.length, 14)
  assert.equal(report.samples.length, 448)
  assert(report.samples.every(sample => Number.isFinite(sample.value)))
  assert(report.summary.every(summary => summary.sampleCount === 1))
  for (const variant of report.variants) {
    const values = Object.fromEntries(report.samples.filter(s => s.variantId === variant.id).map(s => [s.metricId, s.value]))
    assert.equal(Object.keys(values).length, 32)
    const artifact = report.artifacts.find(a => a.path.includes(`/${variant.id}/round-0/trace.json`))
    assert(artifact)
    const trace = readFileSync(resolve('..', artifact.path))
    const { traceEvents } = JSON.parse(trace)
    const counts = {}
    for (const [metric, names] of Object.entries(timingEvents)) {
      const selected = traceEvents.filter(e => e.ph === 'X' && names.includes(e.name) && e.dur)
      const total = selected.reduce((n, e) => n + e.dur / 1000, 0)
      assert.equal(values[metric], total)
      counts[metric] = selected.length
    }
    const traceName = `0074-traces/${variant.id}.json.gz`
    writeFileSync(resolve(evidence, traceName), gzipSync(trace))
    rows.push({ variant: variant.id, navigationReady: values['navigation-ready-ms'] > 0,
      domNodes: values['dom-node-count'], domItems: values['dom-item-count'], cssBytes: values['css-raw-bytes'],
      traceEventCount: traceEvents.length, matchedTimingEvents: counts, trace: traceName })
  }
  const volume = rows.filter(r => r.variant.startsWith('stress-css-'))
  const stress = rows.filter(r => r.variant.startsWith('stress-dom-'))
  assert.equal(volume.length, 8)
  assert.equal(stress.length, 6)
  assert.equal(new Set(volume.map(r => r.domNodes)).size, 1)
  assert.equal(new Set(stress.map(r => r.cssBytes)).size, 1)
  writeFileSync(resolve(evidence, '0074-browser-css-cost-report.json'), JSON.stringify(report, null, 2))
  writeFileSync(resolve(evidence, '0074-validation.json'), JSON.stringify({ rows, finiteSamples: true, recomputedTraceTimings: true }, null, 2))
  console.log(JSON.stringify({ variants: 14, samples: 448, retainedTraces: rows.length, validation: 'PASS' }))
}
process.exitCode = run.status ?? 1
