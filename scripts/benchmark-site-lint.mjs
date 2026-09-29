// node scripts/benchmark-site-lint.mjs --output /tmp/lint-after.json --baseline /tmp/lint-before.json
// A baseline can be a report from this script or ESLint's --stats --format json.
// Reports stay outside source control. A baseline fixes both inputs and diagnostics.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

const { values } = parseArgs({ options: { output: { type: 'string' }, baseline: { type: 'string' } } })
if (!values.output) throw new Error('Pass --output with a report path outside source control.')
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const cwd = resolve(root, 'site')
const require = createRequire(resolve(cwd, 'package.json'))
const { ESLint } = await import(pathToFileURL(require.resolve('eslint')).href)
const baseline = values.baseline ? JSON.parse(readFileSync(values.baseline, 'utf8')) : undefined
const previous = Array.isArray(baseline) ? baseline : baseline?.results
const files = previous?.map(result => result.filePath) ?? ['.']
const native = resolve(process.env.MASTER_CSS_NATIVE_BINDING_PATH ?? resolve(root, 'packages/binding/artifacts/mastercss.node'))
const nativeHash = createHash('sha256').update(readFileSync(native)).digest('hex')
const start = performance.now()
const cpuStart = process.cpuUsage()
const results = await new ESLint({ cwd, cache: false, stats: true }).lintFiles(files)
const elapsedMs = performance.now() - start
const diagnostic = result => Object.fromEntries([
  'filePath', 'messages', 'suppressedMessages', 'errorCount', 'warningCount', 'fatalErrorCount',
  'fixableErrorCount', 'fixableWarningCount', 'output'
].map(key => [key, result[key]]))
const rules = new Map()
let parseMs = 0
for (const result of results) for (const pass of result.stats?.times.passes ?? []) {
  parseMs += pass.parse?.total ?? 0
  for (const [name, time] of Object.entries(pass.rules ?? {})) rules.set(name, (rules.get(name) ?? 0) + time.total)
}
const report = {
  node: process.version, platform: process.platform, arch: process.arch, native, nativeHash,
  elapsedMs, cpu: process.cpuUsage(cpuStart), peakRSSKiB: process.resourceUsage().maxRSS,
  files: results.length, parseMs,
  errors: results.reduce((total, result) => total + result.errorCount, 0),
  warnings: results.reduce((total, result) => total + result.warningCount, 0),
  rules: Object.fromEntries([...rules].sort((a, b) => b[1] - a[1])),
  slowest: results.map(result => ({ file: relative(cwd, result.filePath), ms: result.stats?.times.passes.reduce((sum, pass) => sum + pass.total, 0) ?? 0 }))
    .sort((a, b) => b.ms - a.ms).slice(0, 10),
  results: results.map(result => ({ ...diagnostic(result), stats: result.stats }))
}
writeFileSync(values.output, `${JSON.stringify(report, null, 2)}\n`)
if (previous) {
  const order = (a, b) => a.filePath.localeCompare(b.filePath)
  assert.deepEqual(results.map(diagnostic).sort(order), previous.map(diagnostic).sort(order), 'Lint diagnostics/fixes changed')
}
console.log(JSON.stringify({ ...report, results: undefined, rules: Object.entries(report.rules).slice(0, 8), diagnosticsMatch: previous ? true : undefined }, null, 2))
if (report.errors) process.exitCode = 1
