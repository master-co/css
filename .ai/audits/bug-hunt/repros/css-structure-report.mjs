import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { gzipSync, brotliCompressSync } from 'node:zlib'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

assert(process.cwd().includes('master-css-bh-isolated-'))
const run = spawnSync('pnpm', ['exec', 'vitest', 'bench', 'css-structure', '--run'], {
  env: { ...process.env, BENCHMARK_ROUNDS: '1' }, stdio: 'inherit', timeout: 240000
})
const path = '.results/css-structure/report.json'
if (existsSync(path)) {
  const report = JSON.parse(readFileSync(path, 'utf8'))
  const artifacts = report.artifacts.map(artifact => {
    const path = resolve('..', artifact.path)
    assert(path.startsWith(resolve('.results') + '/'))
    const buffer = readFileSync(path)
    const observed = { rawBytes: buffer.length, gzipBytes: gzipSync(buffer).length,
      brotliBytes: brotliCompressSync(buffer).length, sha256: createHash('sha256').update(buffer).digest('hex') }
    for (const [key, value] of Object.entries(observed)) assert.equal(artifact[key], value)
    return { path: artifact.path, ...observed }
  })
  assert.equal(report.variants.length, 16)
  assert.equal(report.samples.length, 336)
  assert(report.samples.every(sample => Number.isFinite(sample.value)))
  assert(report.summary.every(summary => summary.sampleCount === 1))
  for (const variant of report.variants) {
    const rows = report.samples.filter(sample => sample.variantId === variant.id)
    assert.equal(new Set(rows.map(row => row.metricId)).size, 21)
    const own = artifacts.filter(a => a.path.includes(`/workspaces/${variant.id}/`))
    assert.equal(own.length, 1)
    const values = Object.fromEntries(rows.map(row => [row.metricId, row.value]))
    const grouped = ['theme', 'base', 'defaults', 'components', 'utilities', 'other']
      .reduce((sum, layer) => sum + values[`layer-${layer}-style-rule-count`], values['unlayered-style-rule-count'])
    assert.equal(values['style-rule-count'], grouped)
    assert(values['selector-count'] >= values['style-rule-count'])
  }
  writeFileSync(fileURLToPath(new URL('../evidence/0069-css-structure-report.json', import.meta.url)), JSON.stringify(report, null, 2))
  writeFileSync(fileURLToPath(new URL('../evidence/0069-report-validation.json', import.meta.url)), JSON.stringify({ variants: 16, metrics: 21, samples: 336, artifacts, finiteSamples: true, artifactChecksAndLayerPartition: true }, null, 2))
  console.log(JSON.stringify({ variants: 16, artifacts: artifacts.length, samples: 336, validation: 'PASS' }))
}
process.exitCode = run.status ?? 1
