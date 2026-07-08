import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const fixtureIds = ['minimal', 'docs', 'dashboard', 'stress-css']
const modes = [
  {
    id: 'master-static',
    label: 'Master CSS static',
    family: 'master-css'
  },
  {
    id: 'master-runtime',
    label: 'Master CSS runtime',
    family: 'master-css'
  },
  {
    id: 'master-progressive',
    label: 'Master CSS progressive',
    family: 'master-css'
  },
  {
    id: 'tailwind-static',
    label: 'Tailwind CSS static',
    family: 'tailwind-css'
  }
]
const byteGroups = ['html', 'external-css', 'inline-css', 'runtime-js', 'manifest-json', 'hydration-manifest']
const byteMetricIds = byteGroups.flatMap((group) => [
  `${group}-raw-bytes`,
  `${group}-gzip-bytes`,
  `${group}-brotli-bytes`
])
const structureMetricIds = [
  'delivered-style-rule-count',
  'delivered-selector-count',
  'delivered-declaration-count'
]
const timingMetricIds = [
  'navigation-ready-ms',
  'stylesheet-parse-ms',
  'style-recalculation-ms',
  'layout-ms',
  'paint-ms',
  'long-task-count',
  'request-count',
  'runtime-ready-ms',
  'runtime-bootstrap-ms',
  'manifest-load-ms',
  'runtime-observe-ms',
  'progressive-adopted',
  'runtime-generated-rule-count',
  'runtime-style-raw-bytes'
]
const metricIds = [
  ...byteMetricIds,
  ...structureMetricIds,
  ...timingMetricIds
]

const __dirname = dirname(fileURLToPath(import.meta.url))
const benchmarkRoot = resolve(__dirname, '..')
const reportFile = resolve(benchmarkRoot, '.results/master-delivery-modes/report.json')
const snapshotFile = resolve(__dirname, 'snapshot.json')
const report = JSON.parse(await readFile(reportFile, 'utf8'))

if (report.suite !== 'master-delivery-modes') {
  throw new Error(`Expected master-delivery-modes report at ${reportFile}, received ${report.suite}.`)
}

validateReport()

const snapshot = {
  schemaVersion: 1,
  suite: 'master-delivery-modes',
  generatedAt: new Date().toISOString(),
  sourceReport: {
    suite: report.suite,
    generatedAt: report.generatedAt,
    command: 'pnpm --filter ./benchmarks bench:master-delivery-modes'
  },
  environment: report.environment,
  browser: report.browser,
  packages: report.packages,
  fixtures: fixtureIds.map((id) => {
    const fixture = report.fixtures.find((candidate) => candidate.id === id)
    return {
      id: fixture.id,
      name: fixture.name,
      purpose: fixture.purpose
    }
  }),
  modes,
  variants: report.variants.map((variant) => ({
    id: variant.id,
    fixtureId: variant.fixtureId,
    modeId: getModeId(variant.id),
    adapterId: variant.adapterId,
    label: variant.label
  })),
  metrics: getMetrics(metricIds),
  results: fixtureIds.map((fixtureId) => ({
    fixtureId,
    modes: Object.fromEntries(modes.map((mode) => [
      mode.id,
      createModeResult(fixtureId, mode.id)
    ]))
  })),
  limits: report.limits
}

await writeFile(snapshotFile, `${JSON.stringify(snapshot, null, 2)}\n`)
console.log(`Wrote ${snapshotFile}`)

function validateReport() {
  for (const metricId of metricIds) {
    if (!report.metrics.some((metric) => metric.id === metricId)) {
      throw new Error(`master-delivery-modes report is missing metric ${metricId}.`)
    }
  }

  for (const fixtureId of fixtureIds) {
    if (!report.fixtures.some((fixture) => fixture.id === fixtureId)) {
      throw new Error(`master-delivery-modes report is missing fixture ${fixtureId}.`)
    }

    for (const mode of modes) {
      const variantId = createVariantId(fixtureId, mode.id)
      if (!report.variants.some((variant) => variant.id === variantId)) {
        throw new Error(`master-delivery-modes report is missing variant ${variantId}.`)
      }

      for (const metricId of metricIds) {
        findSummary(variantId, metricId)
      }
    }
  }
}

function createModeResult(fixtureId, modeId) {
  const variantId = createVariantId(fixtureId, modeId)

  return {
    variantId,
    payload: {
      html: createByteSummary(variantId, 'html'),
      externalCSS: createByteSummary(variantId, 'external-css'),
      inlineCSS: createByteSummary(variantId, 'inline-css'),
      runtimeJS: createByteSummary(variantId, 'runtime-js'),
      manifestJSON: createByteSummary(variantId, 'manifest-json'),
      hydrationManifest: createByteSummary(variantId, 'hydration-manifest')
    },
    structure: {
      styleRules: findSummary(variantId, 'delivered-style-rule-count').median,
      selectors: findSummary(variantId, 'delivered-selector-count').median,
      declarations: findSummary(variantId, 'delivered-declaration-count').median
    },
    timing: {
      navigationReadyMs: createMetricSummary(variantId, 'navigation-ready-ms'),
      stylesheetParseMs: createMetricSummary(variantId, 'stylesheet-parse-ms'),
      styleRecalculationMs: createMetricSummary(variantId, 'style-recalculation-ms'),
      layoutMs: createMetricSummary(variantId, 'layout-ms'),
      paintMs: createMetricSummary(variantId, 'paint-ms'),
      longTaskCount: createMetricSummary(variantId, 'long-task-count'),
      requestCount: createMetricSummary(variantId, 'request-count'),
      runtimeReadyMs: createMetricSummary(variantId, 'runtime-ready-ms'),
      runtimeBootstrapMs: createMetricSummary(variantId, 'runtime-bootstrap-ms'),
      manifestLoadMs: createMetricSummary(variantId, 'manifest-load-ms'),
      runtimeObserveMs: createMetricSummary(variantId, 'runtime-observe-ms'),
      progressiveAdopted: createMetricSummary(variantId, 'progressive-adopted'),
      runtimeGeneratedRuleCount: createMetricSummary(variantId, 'runtime-generated-rule-count'),
      runtimeStyleRawBytes: createMetricSummary(variantId, 'runtime-style-raw-bytes')
    }
  }
}

function createByteSummary(variantId, prefix) {
  return {
    rawBytes: findSummary(variantId, `${prefix}-raw-bytes`).median,
    gzipBytes: findSummary(variantId, `${prefix}-gzip-bytes`).median,
    brotliBytes: findSummary(variantId, `${prefix}-brotli-bytes`).median
  }
}

function createMetricSummary(variantId, metricId) {
  const summary = findSummary(variantId, metricId)
  const unit = getMetric(metricId).unit
  const round = unit === 'ms' ? roundOne : roundInteger

  return {
    min: round(summary.min),
    median: round(summary.median),
    mean: round(summary.mean),
    max: round(summary.max),
    sampleCount: summary.sampleCount,
    unit: summary.unit
  }
}

function findSummary(variantId, metricId) {
  const summary = report.summary.find((candidate) => candidate.variantId === variantId && candidate.metricId === metricId)
  if (!summary) {
    throw new Error(`master-delivery-modes report is missing ${metricId} for ${variantId}.`)
  }
  return summary
}

function getMetrics(ids) {
  return ids.map(getMetric)
}

function getMetric(metricId) {
  const metric = report.metrics.find((candidate) => candidate.id === metricId)
  if (!metric) throw new Error(`master-delivery-modes report is missing metric ${metricId}.`)
  return metric
}

function createVariantId(fixtureId, modeId) {
  return `${fixtureId}-${modeId}`
}

function getModeId(variantId) {
  const mode = modes.find((candidate) => variantId.endsWith(`-${candidate.id}`))
  if (!mode) throw new Error(`Unable to infer delivery mode from variant ${variantId}.`)
  return mode.id
}

function roundOne(value) {
  return Number(value.toFixed(1))
}

function roundInteger(value) {
  return Number(value.toFixed(0))
}
