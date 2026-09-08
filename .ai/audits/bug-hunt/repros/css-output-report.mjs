import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { gzipSync, brotliCompressSync } from 'node:zlib'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

assert(process.cwd().includes('master-css-bh-isolated-'))
const run = spawnSync('pnpm', ['exec', 'vitest', 'bench', 'css-output-size', '--run'], {
  env: { ...process.env, BENCHMARK_ROUNDS: '1' }, stdio: 'inherit', timeout: 180000
})
const path = '.results/css-output-size/report.json'
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
  assert.equal(report.samples.length, 64)
  assert(report.samples.every(sample => Number.isFinite(sample.value)))
  assert(report.summary.every(summary => summary.sampleCount === 1))
  for (const variant of report.variants) {
    const rows = report.samples.filter(sample => sample.variantId === variant.id)
    assert.equal(new Set(rows.map(row => row.metricId)).size, 4)
    const own = artifacts.filter(a => a.path.includes(`/workspaces/${variant.id}/`))
    assert.equal(own.length, 1)
    const expected = { 'css-raw-bytes': own[0].rawBytes, 'css-gzip-bytes': own[0].gzipBytes,
      'css-brotli-bytes': own[0].brotliBytes, 'css-file-count': 1 }
    for (const row of rows) assert.equal(row.value, expected[row.metricId])
  }
  writeFileSync(fileURLToPath(new URL('../evidence/0068-css-output-report.json', import.meta.url)), JSON.stringify(report, null, 2))
  writeFileSync(fileURLToPath(new URL('../evidence/0068-validation.json', import.meta.url)), JSON.stringify({ variants: 16, metrics: 4, samples: 64, artifacts, finiteSamples: true, perArtifactAndSampleChecks: true }, null, 2))
  console.log(JSON.stringify({ variants: 16, artifacts: artifacts.length, samples: 64, validation: 'PASS' }))
}
process.exitCode = run.status ?? 1
