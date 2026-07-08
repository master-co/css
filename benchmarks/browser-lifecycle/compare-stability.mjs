import { readFile } from 'node:fs/promises'
import { dirname, isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const benchmarkRoot = resolve(__dirname, '..')
const defaultDate = formatLocalDate(new Date())

const expectedScenarioIds = [
  'initial-load',
  'large-dom',
  'large-append',
  'repeated-toggle',
  'theme-switch',
  'route-navigation',
  'long-session'
]

const expectedModeIds = [
  'master-static',
  'master-runtime',
  'master-progressive',
  'tailwind-static'
]

const measuredMetricIds = [
  'navigation-ready-ms',
  'stylesheet-parse-ms',
  'style-recalculation-ms',
  'style-recalculation-count',
  'layout-ms',
  'paint-ms',
  'long-task-count',
  'fcp-ms',
  'lcp-ms',
  'inp-style-interaction-ms',
  'js-heap-used-bytes',
  'dom-node-count',
  'affected-element-count',
  'average-class-count',
  'cssom-rule-count',
  'runtime-ready-ms',
  'runtime-bootstrap-ms',
  'runtime-observe-ms',
  'runtime-mutation-ms',
  'runtime-generated-rule-count',
  'runtime-generated-rule-count-delta',
  'runtime-style-raw-bytes',
  'runtime-style-raw-bytes-delta',
  'retained-class-count',
  'retained-rule-count',
  'mutation-observer-callback-count',
  'mutation-observer-callback-duration-ms',
  'route-count',
  'progressive-adopted',
  'computed-style-valid'
]

const deltaMetricIds = [
  'style-recalculation-ms',
  'style-recalculation-count',
  'layout-ms',
  'paint-ms',
  'long-task-count',
  'inp-style-interaction-ms',
  'js-heap-used-bytes',
  'cssom-rule-count',
  'runtime-mutation-ms',
  'runtime-generated-rule-count'
]

const defaults = {
  snapshot: 'browser-lifecycle/snapshot.json',
  evidence: 'browser-lifecycle/long-session-evidence.json',
  baselineReport: `.results/browser-lifecycle/report.baseline-review-repeat-${defaultDate}.json`,
  longSessionReports: expectedModeIds.map((modeId) => `.results/browser-lifecycle/report.long-session-5m-repeat-${modeId}.json`),
  minLongSessionMs: 300000
}

try {
  const cli = parseArgs(process.argv.slice(2))
  const minLongSessionMs = parsePositiveNumber(cli.options['min-long-session-ms'] || defaults.minLongSessionMs, '--min-long-session-ms')
  const snapshotSource = cli.options.snapshot || defaults.snapshot
  const evidenceSource = cli.options['long-session-evidence'] || defaults.evidence
  const baselineReportSource = cli.options['baseline-report'] || defaults.baselineReport
  const longSessionReportSources = cli.options['long-session-report'].length
    ? cli.options['long-session-report']
    : defaults.longSessionReports

  const snapshot = await readJson(snapshotSource)
  const evidence = await readJson(evidenceSource)
  const baselineReport = await readJson(baselineReportSource)
  const longSessionReports = await Promise.all(longSessionReportSources.map(readJson))
  const errors = []

  const snapshotVariants = validateCommittedSnapshot(snapshot, errors)
  const evidenceVariants = validateCommittedLongSessionEvidence(evidence, minLongSessionMs, errors)
  const baselineVariants = validateBaselineRepeat(snapshotVariants, baselineReport, errors)
  const longSessionVariants = validateLongSessionRepeat(evidenceVariants, longSessionReports, minLongSessionMs, errors)

  if (errors.length) {
    console.error('Browser lifecycle stability review failed.')
    for (const error of errors) console.error(`- ${error}`)
    process.exit(1)
  }

  printSuccess({
    snapshotSource,
    evidenceSource,
    baselineReportSource,
    longSessionReportSources,
    snapshot,
    evidence,
    baselineReport,
    longSessionReports,
    snapshotVariants,
    evidenceVariants,
    baselineVariants,
    longSessionVariants,
    minLongSessionMs
  })
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}

function validateCommittedSnapshot(snapshot, errors) {
  validateSnapshotShape(snapshot, errors)
  validateIdSet('committed snapshot scenarios', collectIds(snapshot.scenarios), expectedScenarioIds, errors)
  validateIdSet('committed snapshot modes', collectIds(snapshot.modes), expectedModeIds, errors)

  const variants = normalizeSnapshotVariants(snapshot, 'committed snapshot', errors)
  validateVariantIds('committed snapshot variant ids', variants, errors)
  validateVariantMetricShape(snapshot.metrics, variants, 'committed snapshot', errors)
  validateMeasuredSampleCounts(variants, 'committed snapshot', errors)
  validateCorrectness(variants, 'committed snapshot', errors)
  return variants
}

function validateCommittedLongSessionEvidence(evidence, minLongSessionMs, errors) {
  validateLongSessionEvidenceShape(evidence, errors)
  validateIdSet('committed long-session evidence scenarios', collectIds(evidence.scenarios), ['long-session'], errors)
  validateIdSet('committed long-session evidence modes', collectIds(evidence.modes), expectedModeIds, errors)
  validateIdSet('committed long-session evidence source report modes', collectVariantIds(evidence.sourceReports, 'modeId'), expectedModeIds, errors)

  const variants = normalizeSnapshotVariants(evidence, 'committed long-session evidence', errors)
  validateIdSet('committed long-session evidence variant scenarios', variants.map((variant) => variant.scenarioId), ['long-session'], errors)
  validateIdSet('committed long-session evidence variant modes', variants.map((variant) => variant.modeId), expectedModeIds, errors)
  validateVariantIds('committed long-session evidence variant ids', variants, errors)
  validateVariantMetricShape(evidence.metrics, variants, 'committed long-session evidence', errors)
  validateMeasuredSampleCounts(variants, 'committed long-session evidence', errors)
  validateCorrectness(variants, 'committed long-session evidence', errors)
  validateLongSessionDuration(variants, minLongSessionMs, 'committed long-session evidence', errors)
  return variants
}

function validateBaselineRepeat(snapshotVariants, report, errors) {
  validateRawReportShape(report, 'repeat baseline report', errors)
  validateIdSet('repeat baseline scenarios', collectVariantIds(report.variants, 'scenarioId'), expectedScenarioIds, errors)
  validateIdSet('repeat baseline modes', collectVariantIds(report.variants, 'modeId'), expectedModeIds, errors)

  const variants = normalizeReportVariants(report, 'repeat baseline report', errors)
  validateIdSet('repeat baseline variant ids', variants.map((variant) => variant.variantId), snapshotVariants.map((variant) => variant.variantId), errors)
  validateVariantIds('repeat baseline variant ids', variants, errors)
  validateVariantMetricShape(report.metrics, variants, 'repeat baseline report', errors)
  validateMeasuredSampleCounts(variants, 'repeat baseline report', errors)
  validateSampleCountsMatchReference(snapshotVariants, variants, 'repeat baseline report', errors)
  validateCorrectness(variants, 'repeat baseline report', errors)
  return variants
}

function validateLongSessionRepeat(evidenceVariants, reports, minLongSessionMs, errors) {
  if (!reports.length) errors.push('Repeat long-session reports must include one report per mode.')

  const variants = []
  for (const [index, report] of reports.entries()) {
    const label = `repeat long-session report ${index + 1}`
    validateRawReportShape(report, label, errors)
    validateIdSet(`${label} scenarios`, collectVariantIds(report.variants, 'scenarioId'), ['long-session'], errors)
    validateKnownSubset(`${label} modes`, collectVariantIds(report.variants, 'modeId'), expectedModeIds, errors)

    const reportVariants = normalizeReportVariants(report, label, errors)
    if (reportVariants.length !== 1) {
      errors.push(`${label} must contain exactly one focused long-session variant, received ${reportVariants.length}.`)
    }

    validateVariantMetricShape(report.metrics, reportVariants, label, errors)
    variants.push(...reportVariants)
  }

  validateIdSet('repeat long-session modes', variants.map((variant) => variant.modeId), expectedModeIds, errors)
  validateIdSet('repeat long-session variant ids', variants.map((variant) => variant.variantId), evidenceVariants.map((variant) => variant.variantId), errors)
  validateVariantIds('repeat long-session variant ids', variants, errors)
  validateMeasuredSampleCounts(variants, 'repeat long-session reports', errors)
  validateSampleCountsMatchReference(evidenceVariants, variants, 'repeat long-session reports', errors)
  validateCorrectness(variants, 'repeat long-session reports', errors)
  validateLongSessionDuration(variants, minLongSessionMs, 'repeat long-session reports', errors)
  return variants
}

function validateSnapshotShape(snapshot, errors) {
  if (snapshot?.schemaVersion !== 1) errors.push('Committed snapshot schemaVersion must be 1.')
  if (snapshot?.suite !== 'browser-lifecycle') errors.push('Committed snapshot suite must be browser-lifecycle.')

  for (const key of ['environment', 'browser', 'sourceReport']) {
    if (!snapshot?.[key]) errors.push(`Committed snapshot is missing ${key}.`)
  }

  for (const key of ['packages', 'fixtures', 'modes', 'scenarios', 'metrics', 'limits', 'variants', 'variantSummaries']) {
    if (!Array.isArray(snapshot?.[key]) || !snapshot[key].length) {
      errors.push(`Committed snapshot ${key} must be a non-empty array.`)
    }
  }

  if (Array.isArray(snapshot?.variants) && snapshot.variants.length !== 64) {
    errors.push(`Committed snapshot variants count (${snapshot.variants.length}) must be 64.`)
  }

  if (Array.isArray(snapshot?.variants) && Array.isArray(snapshot?.variantSummaries) && snapshot.variants.length !== snapshot.variantSummaries.length) {
    errors.push(`Committed snapshot variantSummaries count (${snapshot.variantSummaries.length}) must match variants count (${snapshot.variants.length}).`)
  }
}

function validateLongSessionEvidenceShape(evidence, errors) {
  if (evidence?.schemaVersion !== 1) errors.push('Committed long-session evidence schemaVersion must be 1.')
  if (evidence?.suite !== 'browser-lifecycle-long-session-evidence') {
    errors.push('Committed long-session evidence suite must be browser-lifecycle-long-session-evidence.')
  }

  for (const key of ['environment', 'browser']) {
    if (!evidence?.[key]) errors.push(`Committed long-session evidence is missing ${key}.`)
  }

  for (const key of ['sourceReports', 'packages', 'modes', 'scenarios', 'metrics', 'limits', 'variants', 'variantSummaries']) {
    if (!Array.isArray(evidence?.[key]) || !evidence[key].length) {
      errors.push(`Committed long-session evidence ${key} must be a non-empty array.`)
    }
  }

  if (Array.isArray(evidence?.variants) && evidence.variants.length !== expectedModeIds.length) {
    errors.push(`Committed long-session evidence variants count (${evidence.variants.length}) must be ${expectedModeIds.length}.`)
  }

  if (Array.isArray(evidence?.variantSummaries) && evidence.variantSummaries.length !== expectedModeIds.length) {
    errors.push(`Committed long-session evidence variantSummaries count (${evidence.variantSummaries.length}) must be ${expectedModeIds.length}.`)
  }
}

function validateRawReportShape(report, label, errors) {
  if (report?.schemaVersion !== 1) errors.push(`${label} schemaVersion must be 1.`)
  if (report?.suite !== 'browser-lifecycle') errors.push(`${label} suite must be browser-lifecycle.`)

  for (const key of ['environment', 'browser']) {
    if (!report?.[key]) errors.push(`${label} is missing ${key}.`)
  }

  for (const key of ['packages', 'fixtures', 'adapters', 'variants', 'metrics', 'samples', 'summary', 'limits', 'artifacts']) {
    if (!Array.isArray(report?.[key])) errors.push(`${label} ${key} must be an array.`)
  }
}

function normalizeSnapshotVariants(snapshot, label, errors) {
  if (!Array.isArray(snapshot?.variantSummaries)) return []

  return snapshot.variantSummaries.map((variant) => ({
    variantId: variant.variantId,
    fixtureId: variant.fixtureId,
    adapterId: variant.adapterId,
    modeId: variant.modeId,
    scenarioId: variant.scenarioId,
    detailId: variant.detailId,
    metrics: variant.metrics || {}
  })).filter((variant) => {
    if (!variant.variantId) {
      errors.push(`${label} variant summary is missing variantId.`)
      return false
    }
    return true
  })
}

function normalizeReportVariants(report, label, errors) {
  if (!Array.isArray(report?.variants) || !Array.isArray(report?.metrics) || !Array.isArray(report?.summary)) return []

  const summaryByKey = new Map(report.summary.map((summary) => [`${summary.variantId}:${summary.metricId}`, summary]))
  return report.variants.map((variant) => {
    const metrics = {}
    for (const metric of report.metrics) {
      const summary = summaryByKey.get(`${variant.id}:${metric.id}`)
      if (!summary) errors.push(`${label} is missing summary metric ${metric.id} for ${variant.id}.`)
      else metrics[metric.id] = summary
    }

    return {
      variantId: variant.id,
      fixtureId: variant.fixtureId,
      adapterId: variant.adapterId,
      modeId: variant.modeId,
      scenarioId: variant.scenarioId,
      detailId: variant.detailId,
      metrics
    }
  })
}

function validateVariantIds(label, variants, errors) {
  const ids = variants.map((variant) => variant.variantId)
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
  if (duplicates.length) errors.push(`${label} has duplicate ids: ${[...new Set(duplicates)].join(', ')}.`)
}

function validateVariantMetricShape(metrics, variants, label, errors) {
  if (!Array.isArray(metrics)) return

  const metricIds = metrics.map((metric) => metric.id).filter(Boolean)
  for (const variant of variants) {
    for (const metricId of metricIds) {
      const summary = variant.metrics?.[metricId]
      if (!summary) {
        errors.push(`${label} variant ${variant.variantId} is missing metric ${metricId}.`)
        continue
      }
      validateMetricSummary(variant.variantId, metricId, summary, label, errors)
    }
  }
}

function validateMetricSummary(variantId, metricId, summary, label, errors) {
  for (const key of ['min', 'median', 'mean', 'max', 'sampleCount']) {
    if (!Number.isFinite(summary[key])) {
      errors.push(`${label} metric ${metricId} for ${variantId} has invalid ${key}.`)
    }
  }
  if (!summary.unit) errors.push(`${label} metric ${metricId} for ${variantId} is missing unit.`)
}

function validateMeasuredSampleCounts(variants, label, errors) {
  const sampleCounts = []
  for (const variant of variants) {
    for (const metricId of measuredMetricIds) {
      const summary = variant.metrics?.[metricId]
      if (!summary) continue
      if (summary.sampleCount < 1) errors.push(`${label} metric ${metricId} for ${variant.variantId} must have at least one measured sample.`)
      sampleCounts.push(summary.sampleCount)
    }
  }

  const uniqueSampleCounts = [...new Set(sampleCounts)]
  if (uniqueSampleCounts.length > 1) {
    errors.push(`${label} measured lifecycle metric sample counts must be consistent, received: ${uniqueSampleCounts.sort((a, b) => a - b).join(', ')}.`)
  }
}

function validateSampleCountsMatchReference(referenceVariants, candidateVariants, label, errors) {
  const referenceById = new Map(referenceVariants.map((variant) => [variant.variantId, variant]))

  for (const candidate of candidateVariants) {
    const reference = referenceById.get(candidate.variantId)
    if (!reference) continue

    for (const metricId of measuredMetricIds) {
      const referenceSummary = reference.metrics?.[metricId]
      const candidateSummary = candidate.metrics?.[metricId]
      if (!referenceSummary || !candidateSummary) continue
      if (candidateSummary.sampleCount !== referenceSummary.sampleCount) {
        errors.push(`${label} metric ${metricId} for ${candidate.variantId} has sampleCount ${candidateSummary.sampleCount}; expected ${referenceSummary.sampleCount}.`)
      }
    }
  }
}

function validateCorrectness(variants, label, errors) {
  for (const variant of variants) {
    const computedStyle = variant.metrics?.['computed-style-valid']
    if (computedStyle && computedStyle.median !== 1) {
      errors.push(`${label} variant ${variant.variantId} has computed-style-valid median ${computedStyle.median}; expected 1.`)
    }

    const progressiveAdopted = variant.metrics?.['progressive-adopted']
    if (variant.modeId === 'master-progressive' && progressiveAdopted && progressiveAdopted.median !== 1) {
      errors.push(`${label} progressive variant ${variant.variantId} has progressive-adopted median ${progressiveAdopted.median}; expected 1.`)
    }
  }
}

function validateLongSessionDuration(variants, minLongSessionMs, label, errors) {
  for (const variant of variants) {
    const summary = variant.metrics?.['inp-style-interaction-ms']
    if (!summary) continue
    if (summary.median < minLongSessionMs) {
      errors.push(`${label} variant ${variant.variantId} has INP-style median ${summary.median} ms; expected at least ${minLongSessionMs} ms.`)
    }
  }
}

function validateIdSet(label, actualIds, expectedIds, errors) {
  const actual = new Set(actualIds)
  const expected = new Set(expectedIds)
  const missing = expectedIds.filter((id) => !actual.has(id))
  const extra = actualIds.filter((id) => !expected.has(id))
  if (missing.length) errors.push(`${label} missing ids: ${missing.join(', ')}.`)
  if (extra.length) errors.push(`${label} has unexpected ids: ${extra.join(', ')}.`)
}

function validateKnownSubset(label, actualIds, allowedIds, errors) {
  const allowed = new Set(allowedIds)
  const uniqueActual = [...new Set(actualIds)]
  const extra = uniqueActual.filter((id) => !allowed.has(id))
  if (!uniqueActual.length) errors.push(`${label} must include at least one id.`)
  if (extra.length) errors.push(`${label} has unexpected ids: ${extra.join(', ')}.`)
}

function collectIds(entries) {
  if (!Array.isArray(entries)) return []
  return [...new Set(entries.map((entry) => entry.id).filter(Boolean))]
}

function collectVariantIds(variants, key) {
  if (!Array.isArray(variants)) return []
  return [...new Set(variants.map((variant) => variant[key]).filter(Boolean))]
}

function collectDeltas(referenceVariants, candidateVariants, metricIds) {
  const referenceById = new Map(referenceVariants.map((variant) => [variant.variantId, variant]))
  const deltas = []

  for (const candidate of candidateVariants) {
    const reference = referenceById.get(candidate.variantId)
    if (!reference) continue

    for (const metricId of metricIds) {
      const referenceMetric = reference.metrics?.[metricId]
      const candidateMetric = candidate.metrics?.[metricId]
      if (!referenceMetric || !candidateMetric) continue

      const referenceValue = referenceMetric.median
      const candidateValue = candidateMetric.median
      const delta = candidateValue - referenceValue
      const percent = referenceValue === 0 ? undefined : (delta / referenceValue) * 100

      deltas.push({
        variantId: candidate.variantId,
        scenarioId: candidate.scenarioId,
        modeId: candidate.modeId,
        detailId: candidate.detailId,
        metricId,
        unit: candidateMetric.unit || referenceMetric.unit,
        referenceValue,
        candidateValue,
        delta,
        percent
      })
    }
  }

  return deltas
}

function printSuccess(context) {
  const baselineSampleCount = getUniformSampleCount(context.baselineVariants)
  const longSessionSampleCount = getUniformSampleCount(context.longSessionVariants)

  console.log('Browser lifecycle stability review passed.')
  console.log(`Committed snapshot: ${context.snapshotSource}`)
  console.log(`Repeat baseline report: ${context.baselineReportSource}`)
  console.log(`Committed long-session evidence: ${context.evidenceSource}`)
  console.log(`Repeat long-session reports: ${context.longSessionReportSources.join(', ')}`)
  console.log(`Baseline variants: ${context.baselineVariants.length}; long-session variants: ${context.longSessionVariants.length}`)
  console.log(`Baseline measured sample count: ${baselineSampleCount}; long-session measured sample count: ${longSessionSampleCount}`)
  console.log(`Minimum long-session INP-style median: ${context.minLongSessionMs} ms`)
  console.log('Metric deltas below are review-only and do not decide publication readiness or performance claims.')

  printDeltaSection(
    'Largest all-scenario repeat median deltas vs committed snapshot',
    collectDeltas(context.snapshotVariants, context.baselineVariants, deltaMetricIds),
    20
  )
  printDeltaSection(
    'Five-minute long-session repeat median deltas vs committed evidence',
    collectDeltas(context.evidenceVariants, context.longSessionVariants, deltaMetricIds),
    40
  )
}

function printDeltaSection(title, deltas, limit) {
  console.log('')
  console.log(title)

  if (!deltas.length) {
    console.log('- No comparable metric deltas.')
    return
  }

  const sorted = [...deltas].sort((a, b) => {
    const aScore = Number.isFinite(a.percent) ? Math.abs(a.percent) : Math.abs(a.delta)
    const bScore = Number.isFinite(b.percent) ? Math.abs(b.percent) : Math.abs(b.delta)
    return bScore - aScore
  })

  for (const delta of sorted.slice(0, limit)) {
    const prefix = `${delta.scenarioId}/${delta.modeId}/${delta.detailId}`
    const percent = delta.percent === undefined ? 'n/a' : `${formatSigned(delta.percent)}%`
    console.log(`- ${prefix} ${delta.metricId}: ${formatNumber(delta.candidateValue)} ${delta.unit} vs ${formatNumber(delta.referenceValue)} ${delta.unit}; delta ${formatSigned(delta.delta)} ${delta.unit} (${percent})`)
  }
}

function getUniformSampleCount(variants) {
  const sampleCounts = []
  for (const variant of variants) {
    for (const metricId of measuredMetricIds) {
      const summary = variant.metrics?.[metricId]
      if (summary) sampleCounts.push(summary.sampleCount)
    }
  }

  const unique = [...new Set(sampleCounts)]
  return unique.length === 1 ? unique[0] : unique.join(',')
}

async function readJson(source) {
  const file = resolveSource(source)
  return JSON.parse(await readFile(file, 'utf8'))
}

function resolveSource(source) {
  return isAbsolute(source) ? source : resolve(benchmarkRoot, source)
}

function parseArgs(argv) {
  const options = {
    'long-session-report': []
  }
  const allowedOptions = new Set([
    'snapshot',
    'long-session-evidence',
    'baseline-report',
    'long-session-report',
    'min-long-session-ms'
  ])

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === '--') continue
    if (!arg.startsWith('--')) throw new Error(`Unexpected positional argument "${arg}". Use named options.`)

    const [name, inlineValue] = arg.slice(2).split('=', 2)
    if (name === 'help') {
      printHelp()
      process.exit(0)
    }
    if (!allowedOptions.has(name)) throw new Error(`Unknown option --${name}.`)

    const value = inlineValue ?? argv[++index]
    if (!value || value.startsWith('--')) throw new Error(`--${name} requires a value.`)

    if (name === 'long-session-report') options[name].push(value)
    else options[name] = value
  }

  return { options }
}

function parsePositiveNumber(value, label) {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) throw new Error(`${label} must be a positive number.`)
  return number
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return String(value)
  if (Math.abs(value) >= 1000) return value.toFixed(1)
  if (Math.abs(value) >= 10) return value.toFixed(2)
  return value.toFixed(3)
}

function formatSigned(value) {
  const formatted = formatNumber(value)
  return value > 0 ? `+${formatted}` : formatted
}

function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function printHelp() {
  console.log([
    'Usage: node browser-lifecycle/compare-stability.mjs [options]',
    '',
    'Options:',
    `  --snapshot <path>                 Committed snapshot source. Default: ${defaults.snapshot}`,
    `  --long-session-evidence <path>   Committed five-minute evidence source. Default: ${defaults.evidence}`,
    `  --baseline-report <path>         Repeat all-scenario raw report. Default: ${defaults.baselineReport}`,
    '  --long-session-report <path>     Repeat focused long-session raw report. Repeat once per mode.',
    `  --min-long-session-ms <number>   Minimum INP-style long-session median. Default: ${defaults.minLongSessionMs}`,
    '',
    'The script fails on coverage, correctness, and sample-count issues only.',
    'Metric deltas are printed for human review and do not make performance claims.'
  ].join('\n'))
}
