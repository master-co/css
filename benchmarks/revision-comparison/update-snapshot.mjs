// Same-machine A/B between two source revisions. Each side's reports come from that revision's own
// benchmark runner, run on one machine with one Chromium build:
//   bun revision-comparison/update-snapshot.mjs <baseline .results> <current .results>
// Both directories hold css-output-size, build-performance, master-delivery-modes and interaction-cost reports.
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const snapshotFile = resolve(__dirname, 'snapshot.json')
const [baselineRoot, currentRoot] = process.argv.slice(2)
if (!baselineRoot || !currentRoot) throw new Error('Usage: update-snapshot.mjs <baseline .results> <current .results>')

const revisions = {
  baseline: {
    revision: process.env.REVISION_COMPARISON_BASELINE || 'cd5a3972a',
    label: 'Jul 2, 2026',
    description: 'The revision that produced the July 2026 snapshots, before the engine moved to Rust.'
  },
  current: {
    revision: process.env.REVISION_COMPARISON_CURRENT || 'unknown',
    label: process.env.REVISION_COMPARISON_CURRENT_LABEL || 'Current',
    description: 'Rust engine and compiled browser program; fixtures express the same rendered values in the current class syntax.'
  }
}

// The baseline runtime fetched a manifest JSON and the current runtime a compiled program: both are its default data.
const rows = [
  { group: 'Static CSS output', label: 'Master CSS CLI CSS (Brotli)', suite: 'css-output-size', variant: 'docs-master-static-cli', metric: 'css-brotli-bytes', unit: 'B' },
  { group: 'Static CSS output', label: 'Master CSS CLI CSS files', suite: 'css-output-size', variant: 'docs-master-static-cli', metric: 'css-file-count', unit: 'count' },
  { group: 'Static CSS output', label: 'Master CSS Vite CSS files', suite: 'css-output-size', variant: 'docs-master-static-vite', metric: 'css-file-count', unit: 'count' },
  { group: 'Static CSS output', label: 'Tailwind CSS CLI CSS (Brotli, control)', suite: 'css-output-size', variant: 'docs-tailwind-cli', metric: 'css-brotli-bytes', unit: 'B' },
  { group: 'Production build', label: 'Master CSS CLI cold build', suite: 'build-performance', variant: 'docs-master-static-cli', metric: 'cold-build-ms', unit: 'ms' },
  { group: 'Production build', label: 'Master CSS Vite cold build', suite: 'build-performance', variant: 'docs-master-static-vite', metric: 'cold-build-ms', unit: 'ms' },
  { group: 'Production build', label: 'Tailwind CSS CLI cold build (control)', suite: 'build-performance', variant: 'docs-tailwind-cli', metric: 'cold-build-ms', unit: 'ms' },
  { group: 'Production build', label: 'Tailwind CSS Vite cold build (control)', suite: 'build-performance', variant: 'docs-tailwind-vite', metric: 'cold-build-ms', unit: 'ms' },
  { group: 'Runtime delivery', label: 'Runtime JS (Brotli)', suite: 'master-delivery-modes', variant: 'docs-master-runtime', metric: 'runtime-js-brotli-bytes', unit: 'B' },
  { group: 'Runtime delivery', label: 'Runtime default data (Brotli)', suite: 'master-delivery-modes', variant: 'docs-master-runtime', metric: ['manifest-json-brotli-bytes', 'runtime-program-brotli-bytes'], unit: 'B' },
  { group: 'Runtime delivery', label: 'Runtime bootstrap', suite: 'master-delivery-modes', variant: 'docs-master-runtime', metric: 'runtime-bootstrap-ms', unit: 'ms' },
  { group: 'Runtime delivery', label: 'Runtime observe', suite: 'master-delivery-modes', variant: 'docs-master-runtime', metric: 'runtime-observe-ms', unit: 'ms' },
  { group: 'Runtime delivery', label: 'Runtime navigation ready', suite: 'master-delivery-modes', variant: 'docs-master-runtime', metric: 'navigation-ready-ms', unit: 'ms' },
  { group: 'Progressive delivery', label: 'Progressive requests on load', suite: 'master-delivery-modes', variant: 'docs-master-progressive', metric: 'request-count', unit: 'count' },
  { group: 'Progressive delivery', label: 'Progressive hydration data (Brotli)', suite: 'master-delivery-modes', variant: 'docs-master-progressive', metric: 'hydration-manifest-brotli-bytes', unit: 'B' },
  { group: 'Progressive delivery', label: 'Progressive bootstrap', suite: 'master-delivery-modes', variant: 'docs-master-progressive', metric: 'runtime-bootstrap-ms', unit: 'ms' },
  { group: 'Progressive delivery', label: 'Progressive observe and hydrate', suite: 'master-delivery-modes', variant: 'docs-master-progressive', metric: 'runtime-observe-ms', unit: 'ms' },
  { group: 'Progressive delivery', label: 'Progressive navigation ready', suite: 'master-delivery-modes', variant: 'docs-master-progressive', metric: 'navigation-ready-ms', unit: 'ms' },
  { group: 'Progressive delivery', label: 'Tailwind CSS static navigation ready (control)', suite: 'master-delivery-modes', variant: 'docs-tailwind-static', metric: 'navigation-ready-ms', unit: 'ms' },
  { group: 'Interaction', label: 'Runtime first-time class: mutation work', suite: 'interaction-cost', variant: 'dynamic-master-runtime-new-class-toggle', metric: 'runtime-mutation-ms', unit: 'ms' },
  { group: 'Interaction', label: 'Progressive first-time class: mutation work', suite: 'interaction-cost', variant: 'dynamic-master-progressive-new-class-toggle', metric: 'runtime-mutation-ms', unit: 'ms' },
  { group: 'Interaction', label: 'Tailwind CSS existing-class toggle ready (control)', suite: 'interaction-cost', variant: 'dynamic-tailwind-static-existing-class-toggle', metric: 'interaction-ready-ms', unit: 'ms' }
]

const suites = [...new Set(rows.map((row) => row.suite))]
const reports = {}
for (const side of ['baseline', 'current']) {
  const root = side === 'baseline' ? baselineRoot : currentRoot
  reports[side] = Object.fromEntries(await Promise.all(suites.map(async (suite) => [suite, JSON.parse(await readFile(resolve(root, suite, 'report.json'), 'utf8'))])))
}

const environment = reports.current['build-performance'].environment
for (const side of ['baseline', 'current']) {
  for (const suite of suites) {
    const report = reports[side][suite]
    if (report.environment.cpu.model !== environment.cpu.model || report.environment.os.release !== environment.os.release) {
      throw new Error(`${side} ${suite} was not measured on the same machine.`)
    }
  }
}
const browsers = new Set(['baseline', 'current'].flatMap((side) => ['master-delivery-modes', 'interaction-cost'].map((suite) => reports[side][suite].browser?.version)))
if (browsers.size !== 1) throw new Error(`Browser suites used different Chromium builds: ${[...browsers].join(', ')}`)

function read(side, row) {
  const metricIds = Array.isArray(row.metric) ? row.metric : [row.metric]
  const summary = reports[side][row.suite].summary.find((candidate) => candidate.variantId === row.variant && metricIds.includes(candidate.metricId))
  if (!summary) throw new Error(`${side} ${row.suite} is missing ${metricIds.join(' or ')} for ${row.variant}.`)
  return { median: round(summary.median), sampleCount: summary.sampleCount }
}

function round(value) {
  return Math.round(value * 10) / 10
}

const snapshot = {
  schemaVersion: 1,
  suite: 'revision-comparison',
  generatedAt: new Date().toISOString(),
  revisions,
  environment,
  runtimes: Object.fromEntries(['baseline', 'current'].map((side) => [side, reports[side]['build-performance'].environment.node])),
  browser: reports.current['master-delivery-modes'].browser,
  sourceReports: Object.fromEntries(['baseline', 'current'].map((side) => [side, suites.map((suite) => ({ suite, generatedAt: reports[side][suite].generatedAt }))])),
  rows: rows.map((row) => ({
    group: row.group,
    label: row.label,
    unit: row.unit,
    fixtureId: row.variant.split('-')[0],
    variantId: row.variant,
    metricId: row.metric,
    baseline: read('baseline', row),
    current: read('current', row)
  })),
  limits: [
    'Both revisions ran their own benchmark runner and fixtures on the same machine on the same day; browser suites used the same Chromium build.',
    'The baseline fixtures use the class syntax of that revision; the current fixtures express the same values in the current syntax, so class strings and HTML bytes differ.',
    'The benchmark harnesses also changed between the revisions: HTML payloads include harness scripts, and readiness timings include the harness frame waits.',
    'Production build timings run every command with the recorded Node.js version so that both revisions use the same JavaScript runtime.',
    'Medians of a few local runs show direction and magnitude; small timing differences are within run-to-run noise.'
  ]
}

await writeFile(snapshotFile, `${JSON.stringify(snapshot, null, 2)}\n`)
console.log(`Wrote ${snapshotFile}`)
