import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const fixtureIds = ['dynamic', 'dashboard', 'stress-dom']
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
const scenarios = [
  {
    id: 'existing-class-toggle',
    label: 'Existing class toggle'
  },
  {
    id: 'new-class-toggle',
    label: 'New class toggle'
  },
  {
    id: 'dom-append-remove',
    label: 'DOM append/remove'
  },
  {
    id: 'theme-switch',
    label: 'Theme switch'
  },
  {
    id: 'viewport-resize',
    label: 'Viewport resize'
  },
  {
    id: 'mutation-cleanup-cycle',
    label: 'Mutation cleanup cycle'
  }
]
const metricIds = [
  'interaction-ready-ms',
  'runtime-mutation-ms',
  'runtime-generated-rule-count-delta',
  'runtime-style-raw-bytes-delta',
  'style-recalculation-ms',
  'layout-ms',
  'paint-ms',
  'long-task-count',
  'dom-node-count',
  'affected-element-count',
  'computed-style-valid',
  'cleanup-valid',
  'progressive-adopted'
]

const __dirname = dirname(fileURLToPath(import.meta.url))
const benchmarkRoot = resolve(__dirname, '..')
const reportFile = resolve(benchmarkRoot, '.results/interaction-cost/report.json')
const snapshotFile = resolve(__dirname, 'snapshot.json')
const report = JSON.parse(await readFile(reportFile, 'utf8'))

if (report.suite !== 'interaction-cost') {
  throw new Error(`Expected interaction-cost report at ${reportFile}, received ${report.suite}.`)
}

validateReport()

const variantSet = new Set(report.variants.map((variant) => variant.id))
const snapshot = {
  schemaVersion: 1,
  suite: 'interaction-cost',
  generatedAt: new Date().toISOString(),
  sourceReport: {
    suite: report.suite,
    generatedAt: report.generatedAt,
    command: 'pnpm --filter ./benchmarks bench:interaction-cost'
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
  scenarios,
  variants: report.variants.map((variant) => {
    const parsed = parseVariantId(variant.id)
    return {
      id: variant.id,
      fixtureId: variant.fixtureId,
      modeId: parsed.modeId,
      scenarioId: parsed.scenarioId,
      adapterId: variant.adapterId,
      label: variant.label,
      limits: variant.limits || []
    }
  }),
  metrics: getMetrics(metricIds),
  results: fixtureIds.map((fixtureId) => ({
    fixtureId,
    scenarios: Object.fromEntries(scenarios.map((scenario) => [
      scenario.id,
      createScenarioResult(fixtureId, scenario.id)
    ]))
  })),
  limits: report.limits
}

await writeFile(snapshotFile, `${JSON.stringify(snapshot, null, 2)}\n`)
console.log(`Wrote ${snapshotFile}`)

function validateReport() {
  for (const metricId of metricIds) {
    if (!report.metrics.some((metric) => metric.id === metricId)) {
      throw new Error(`interaction-cost report is missing metric ${metricId}.`)
    }
  }

  for (const fixtureId of fixtureIds) {
    if (!report.fixtures.some((fixture) => fixture.id === fixtureId)) {
      throw new Error(`interaction-cost report is missing fixture ${fixtureId}.`)
    }
  }

  for (const variant of report.variants) {
    parseVariantId(variant.id)

    for (const metricId of metricIds) {
      findSummary(variant.id, metricId)
    }
  }
}

function createScenarioResult(fixtureId, scenarioId) {
  return Object.fromEntries(modes.flatMap((mode) => {
    const variantId = createVariantId(fixtureId, mode.id, scenarioId)
    if (!variantSet.has(variantId)) return []
    return [[mode.id, createVariantResult(variantId)]]
  }))
}

function createVariantResult(variantId) {
  return {
    variantId,
    interaction: {
      readyMs: createMetricSummary(variantId, 'interaction-ready-ms'),
      runtimeMutationMs: createMetricSummary(variantId, 'runtime-mutation-ms'),
      runtimeGeneratedRuleCountDelta: createMetricSummary(variantId, 'runtime-generated-rule-count-delta'),
      runtimeStyleRawBytesDelta: createMetricSummary(variantId, 'runtime-style-raw-bytes-delta')
    },
    browser: {
      styleRecalculationMs: createMetricSummary(variantId, 'style-recalculation-ms'),
      layoutMs: createMetricSummary(variantId, 'layout-ms'),
      paintMs: createMetricSummary(variantId, 'paint-ms'),
      longTaskCount: createMetricSummary(variantId, 'long-task-count')
    },
    dom: {
      nodeCount: createMetricSummary(variantId, 'dom-node-count'),
      affectedElementCount: createMetricSummary(variantId, 'affected-element-count')
    },
    correctness: {
      computedStyleValid: createMetricSummary(variantId, 'computed-style-valid'),
      cleanupValid: createMetricSummary(variantId, 'cleanup-valid'),
      progressiveAdopted: createMetricSummary(variantId, 'progressive-adopted')
    }
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
    throw new Error(`interaction-cost report is missing ${metricId} for ${variantId}.`)
  }
  return summary
}

function getMetrics(ids) {
  return ids.map(getMetric)
}

function getMetric(metricId) {
  const metric = report.metrics.find((candidate) => candidate.id === metricId)
  if (!metric) throw new Error(`interaction-cost report is missing metric ${metricId}.`)
  return metric
}

function createVariantId(fixtureId, modeId, scenarioId) {
  return `${fixtureId}-${modeId}-${scenarioId}`
}

function parseVariantId(variantId) {
  const fixture = fixtureIds.find((candidate) => variantId.startsWith(`${candidate}-`))
  if (!fixture) throw new Error(`Unable to infer fixture from variant ${variantId}.`)
  const rest = variantId.slice(fixture.length + 1)
  const mode = modes.find((candidate) => rest.startsWith(`${candidate.id}-`))
  if (!mode) throw new Error(`Unable to infer mode from variant ${variantId}.`)
  const scenarioId = rest.slice(mode.id.length + 1)
  if (!scenarios.some((scenario) => scenario.id === scenarioId)) {
    throw new Error(`Unable to infer scenario from variant ${variantId}.`)
  }

  return {
    fixtureId: fixture,
    modeId: mode.id,
    scenarioId
  }
}

function roundOne(value) {
  return Number(value.toFixed(1))
}

function roundInteger(value) {
  return Number(value.toFixed(0))
}
