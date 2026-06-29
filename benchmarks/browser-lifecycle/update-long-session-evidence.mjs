import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const expectedModeIds = [
    'master-static',
    'master-runtime',
    'master-progressive',
    'tailwind-static'
]

const __dirname = dirname(fileURLToPath(import.meta.url))
const benchmarkRoot = resolve(__dirname, '..')
const evidenceFile = resolve(__dirname, 'long-session-evidence.json')

const reportEntries = await Promise.all(expectedModeIds.map(readModeReport))
validateReports(reportEntries)

const firstReport = reportEntries[0].report
const metrics = firstReport.metrics.map((metric) => ({
    id: metric.id,
    label: metric.label,
    unit: metric.unit,
    description: metric.description
}))
const variants = reportEntries.map(({ report }) => {
    const variant = report.variants[0]
    return {
        id: variant.id,
        fixtureId: variant.fixtureId,
        modeId: variant.modeId,
        scenarioId: variant.scenarioId,
        detailId: variant.detailId,
        adapterId: variant.adapterId,
        label: variant.label,
        limits: variant.limits || []
    }
})

const evidence = {
    schemaVersion: 1,
    suite: 'browser-lifecycle-long-session-evidence',
    generatedAt: new Date().toISOString(),
    sourceReports: reportEntries.map(({ modeId, report, source }) => ({
        modeId,
        suite: report.suite,
        generatedAt: report.generatedAt,
        source,
        command: createSourceCommand(modeId)
    })),
    environment: firstReport.environment,
    browser: firstReport.browser,
    packages: firstReport.packages,
    modes: expectedModeIds.map((modeId) => ({
        id: modeId,
        label: formatModeLabel(modeId),
        family: modeId === 'tailwind-static' ? 'tailwind-css' : 'master-css'
    })),
    scenarios: [
        {
            id: 'long-session',
            label: 'Long session'
        }
    ],
    details: [
        {
            id: 'mixed-operations',
            scenarioId: 'long-session',
            label: 'Long session mixed operations'
        }
    ],
    variants,
    variantSummaries: reportEntries.map(({ report }) => createVariantSummary(report)),
    metrics,
    results: [
        {
            scenarioId: 'long-session',
            detailId: 'mixed-operations',
            modes: Object.fromEntries(reportEntries.map(({ modeId, report }) => [
                modeId,
                createVariantResult(report)
            ]))
        }
    ],
    limits: unique([
        ...firstReport.limits,
        'This evidence is curated from segmented five-minute long-session reports; raw reports, traces, diagnostics, and screenshots remain ignored artifacts.'
    ])
}

await writeFile(evidenceFile, `${JSON.stringify(evidence, null, 4)}\n`)
console.log(`Wrote ${evidenceFile}`)

async function readModeReport(modeId) {
    const source = `.results/browser-lifecycle/report.long-session-5m-${modeId}.json`
    const sourceFile = resolve(benchmarkRoot, source)
    const report = JSON.parse(await readFile(sourceFile, 'utf8'))
    return {
        modeId,
        source,
        report
    }
}

function validateReports(entries) {
    for (const entry of entries) validateModeReport(entry)

    const first = entries[0].report
    for (const { modeId, report } of entries.slice(1)) {
        assertEqual(`${modeId} environment`, report.environment, first.environment)
        assertEqual(`${modeId} browser`, report.browser, first.browser)
        assertEqual(`${modeId} packages`, report.packages, first.packages)
        assertEqual(`${modeId} metrics`, report.metrics, first.metrics)
    }
}

function validateModeReport({ modeId, report, source }) {
    if (report.schemaVersion !== 1) {
        throw new Error(`${source} schemaVersion must be 1.`)
    }
    if (report.suite !== 'browser-lifecycle') {
        throw new Error(`${source} suite must be browser-lifecycle.`)
    }
    if (!Array.isArray(report.variants) || report.variants.length !== 1) {
        throw new Error(`${source} must contain exactly one focused variant.`)
    }
    if (!Array.isArray(report.metrics) || !report.metrics.length) {
        throw new Error(`${source} must contain metric definitions.`)
    }
    if (!Array.isArray(report.summary) || !report.summary.length) {
        throw new Error(`${source} must contain summary metrics.`)
    }

    const variant = report.variants[0]
    if (variant.modeId !== modeId) {
        throw new Error(`${source} variant modeId must be ${modeId}, received ${variant.modeId}.`)
    }
    if (variant.scenarioId !== 'long-session') {
        throw new Error(`${source} variant scenarioId must be long-session, received ${variant.scenarioId}.`)
    }

    for (const metric of report.metrics) findSummary(report, variant.id, metric.id)
}

function createVariantSummary(report) {
    const variant = report.variants[0]
    return {
        variantId: variant.id,
        fixtureId: variant.fixtureId,
        adapterId: variant.adapterId,
        modeId: variant.modeId,
        scenarioId: variant.scenarioId,
        detailId: variant.detailId,
        correctness: {
            computedStyleValid: createMetricSummary(report, variant.id, 'computed-style-valid'),
            progressiveAdopted: createMetricSummary(report, variant.id, 'progressive-adopted')
        },
        metrics: Object.fromEntries(report.metrics.map((metric) => [
            metric.id,
            createMetricSummary(report, variant.id, metric.id)
        ]))
    }
}

function createVariantResult(report) {
    const variant = report.variants[0]
    return {
        variantId: variant.id,
        timing: {
            inpStyleInteractionMs: createMetricSummary(report, variant.id, 'inp-style-interaction-ms'),
            styleRecalculationMs: createMetricSummary(report, variant.id, 'style-recalculation-ms'),
            styleRecalculationCount: createMetricSummary(report, variant.id, 'style-recalculation-count'),
            layoutMs: createMetricSummary(report, variant.id, 'layout-ms'),
            paintMs: createMetricSummary(report, variant.id, 'paint-ms'),
            longTaskCount: createMetricSummary(report, variant.id, 'long-task-count')
        },
        browser: {
            jsHeapUsedBytes: createMetricSummary(report, variant.id, 'js-heap-used-bytes'),
            cssomRuleCount: createMetricSummary(report, variant.id, 'cssom-rule-count')
        },
        runtime: {
            mutationMs: createMetricSummary(report, variant.id, 'runtime-mutation-ms'),
            generatedRuleCount: createMetricSummary(report, variant.id, 'runtime-generated-rule-count'),
            generatedRuleCountDelta: createMetricSummary(report, variant.id, 'runtime-generated-rule-count-delta'),
            styleRawBytes: createMetricSummary(report, variant.id, 'runtime-style-raw-bytes'),
            styleRawBytesDelta: createMetricSummary(report, variant.id, 'runtime-style-raw-bytes-delta'),
            retainedClassCount: createMetricSummary(report, variant.id, 'retained-class-count'),
            retainedRuleCount: createMetricSummary(report, variant.id, 'retained-rule-count'),
            mutationObserverCallbackCount: createMetricSummary(report, variant.id, 'mutation-observer-callback-count'),
            mutationObserverCallbackDurationMs: createMetricSummary(report, variant.id, 'mutation-observer-callback-duration-ms')
        },
        correctness: {
            computedStyleValid: createMetricSummary(report, variant.id, 'computed-style-valid'),
            progressiveAdopted: createMetricSummary(report, variant.id, 'progressive-adopted')
        }
    }
}

function createMetricSummary(report, variantId, metricId) {
    const summary = findSummary(report, variantId, metricId)
    const unit = getMetric(report, metricId).unit
    const round = unit === 'ms' ? roundOne : unit === 'B' ? roundInteger : roundTwo

    return {
        min: round(summary.min),
        median: round(summary.median),
        mean: round(summary.mean),
        max: round(summary.max),
        sampleCount: summary.sampleCount,
        unit: summary.unit
    }
}

function findSummary(report, variantId, metricId) {
    const summary = report.summary.find((candidate) => candidate.variantId === variantId && candidate.metricId === metricId)
    if (!summary) {
        throw new Error(`browser-lifecycle report is missing ${metricId} for ${variantId}.`)
    }
    return summary
}

function getMetric(report, metricId) {
    const metric = report.metrics.find((candidate) => candidate.id === metricId)
    if (!metric) throw new Error(`browser-lifecycle report is missing metric ${metricId}.`)
    return metric
}

function createSourceCommand(modeId) {
    return [
        'BROWSER_LIFECYCLE_SCENARIOS=long-session',
        `BROWSER_LIFECYCLE_MODES=${modeId}`,
        'BROWSER_LIFECYCLE_ROUNDS=1',
        'BROWSER_LIFECYCLE_WARMUP_ROUNDS=1',
        'BROWSER_LIFECYCLE_LONG_SESSION_MS=300000',
        'BROWSER_LIFECYCLE_MEASURE_TIMEOUT_MS=420000',
        `BROWSER_LIFECYCLE_REPORT_LABEL=long-session-5m-${modeId}`,
        'BENCHMARK_COMMAND_TIMEOUT_MS=900000',
        'pnpm --filter ./benchmarks bench:browser-lifecycle'
    ].join(' ')
}

function formatModeLabel(modeId) {
    if (modeId === 'master-static') return 'Master CSS static'
    if (modeId === 'master-runtime') return 'Master CSS runtime'
    if (modeId === 'master-progressive') return 'Master CSS progressive'
    if (modeId === 'tailwind-static') return 'Tailwind CSS static'
    return modeId
}

function assertEqual(label, actual, expected) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${label} differs from the first long-session report.`)
    }
}

function unique(values) {
    return [...new Set(values)]
}

function roundOne(value) {
    return Number(value.toFixed(1))
}

function roundTwo(value) {
    return Number(value.toFixed(2))
}

function roundInteger(value) {
    return Number(value.toFixed(0))
}
