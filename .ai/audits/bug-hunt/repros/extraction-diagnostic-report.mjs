import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

assert(process.cwd().includes('master-css-bh-isolated-'))
const result = spawnSync('pnpm', ['exec', 'vitest', 'bench', 'extraction-diagnostics', '--run'], {
  env: { ...process.env, BENCHMARK_ROUNDS: '1' }, stdio: 'inherit', timeout: 180000
})
const path = '.results/extraction-diagnostics/report.json'
if (existsSync(path)) {
  const report = JSON.parse(readFileSync(path, 'utf8'))
  writeFileSync(fileURLToPath(new URL('../evidence/0065-extraction-report.json', import.meta.url)), JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ variants: report.variants.length, metrics: report.metrics.length,
    samples: report.samples.length, summary: report.summary.length,
    missingMetricIds: report.metrics.filter(metric => !report.samples.some(sample => sample.metricId === metric.id)).map(metric => metric.id) }))
}
process.exitCode = result.status ?? 1
