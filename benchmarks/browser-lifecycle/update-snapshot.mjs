import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const metricIds = [
    'html-raw-bytes',
    'html-gzip-bytes',
    'html-brotli-bytes',
    'external-css-raw-bytes',
    'external-css-gzip-bytes',
    'external-css-brotli-bytes',
    'inline-css-raw-bytes',
    'inline-css-gzip-bytes',
    'inline-css-brotli-bytes',
    'runtime-js-raw-bytes',
    'runtime-js-gzip-bytes',
    'runtime-js-brotli-bytes',
    'manifest-json-raw-bytes',
    'manifest-json-gzip-bytes',
    'manifest-json-brotli-bytes',
    'hydration-manifest-raw-bytes',
    'hydration-manifest-gzip-bytes',
    'hydration-manifest-brotli-bytes',
    'delivered-style-rule-count',
    'delivered-selector-count',
    'delivered-declaration-count',
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

const byteGroups = [
    'html',
    'external-css',
    'inline-css',
    'runtime-js',
    'manifest-json',
    'hydration-manifest'
]

const __dirname = dirname(fileURLToPath(import.meta.url))
const benchmarkRoot = resolve(__dirname, '..')
const reportFile = resolve(benchmarkRoot, '.results/browser-lifecycle/report.json')
const snapshotFile = resolve(__dirname, 'snapshot.json')
const report = JSON.parse(await readFile(reportFile, 'utf8'))

if (report.suite !== 'browser-lifecycle') {
    throw new Error(`Expected browser-lifecycle report at ${reportFile}, received ${report.suite}.`)
}

validateReport()

const scenarios = uniqueBy(report.variants.map((variant) => ({
    id: variant.scenarioId,
    label: formatLabel(variant.scenarioId)
})), (scenario) => scenario.id)
const modes = uniqueBy(report.variants.map((variant) => ({
    id: variant.modeId,
    label: formatModeLabel(variant.modeId),
    family: variant.modeId === 'tailwind-static' ? 'tailwind-css' : 'master-css'
})), (mode) => mode.id)
const details = uniqueBy(report.variants.map((variant) => ({
    id: variant.detailId,
    scenarioId: variant.scenarioId,
    label: variant.detailLabel
})), (detail) => `${detail.scenarioId}:${detail.id}`)

const snapshot = {
    schemaVersion: 1,
    suite: 'browser-lifecycle',
    generatedAt: new Date().toISOString(),
    sourceReport: {
        suite: report.suite,
        generatedAt: report.generatedAt,
        command: 'pnpm --filter ./benchmarks bench:browser-lifecycle'
    },
    environment: report.environment,
    browser: report.browser,
    packages: report.packages,
    fixtures: report.fixtures.map((fixture) => ({
        id: fixture.id,
        name: fixture.name,
        purpose: fixture.purpose
    })),
    modes,
    scenarios,
    details,
    variants: report.variants.map((variant) => ({
        id: variant.id,
        fixtureId: variant.fixtureId,
        modeId: variant.modeId,
        scenarioId: variant.scenarioId,
        detailId: variant.detailId,
        adapterId: variant.adapterId,
        label: variant.label,
        limits: variant.limits || []
    })),
    metrics: getMetrics(metricIds),
    results: scenarios.map((scenario) => ({
        scenarioId: scenario.id,
        details: details
            .filter((detail) => detail.scenarioId === scenario.id)
            .map((detail) => ({
                detailId: detail.id,
                modes: Object.fromEntries(modes.flatMap((mode) => {
                    const variant = report.variants.find((candidate) => (
                        candidate.scenarioId === scenario.id
                        && candidate.detailId === detail.id
                        && candidate.modeId === mode.id
                    ))
                    if (!variant) return []
                    return [[mode.id, createVariantResult(variant.id)]]
                }))
            }))
    })),
    limits: report.limits
}

await writeFile(snapshotFile, `${JSON.stringify(snapshot, null, 4)}\n`)
console.log(`Wrote ${snapshotFile}`)

function validateReport() {
    for (const metricId of metricIds) {
        if (!report.metrics.some((metric) => metric.id === metricId)) {
            throw new Error(`browser-lifecycle report is missing metric ${metricId}.`)
        }
    }

    for (const variant of report.variants) {
        if (!variant.scenarioId || !variant.modeId || !variant.detailId) {
            throw new Error(`browser-lifecycle variant is missing lifecycle metadata: ${variant.id}.`)
        }

        for (const metricId of metricIds) {
            findSummary(variant.id, metricId)
        }
    }
}

function createVariantResult(variantId) {
    return {
        variantId,
        payload: Object.fromEntries(byteGroups.map((group) => [
            toCamelCase(group),
            createByteSummary(variantId, group)
        ])),
        structure: {
            styleRules: findSummary(variantId, 'delivered-style-rule-count').median,
            selectors: findSummary(variantId, 'delivered-selector-count').median,
            declarations: findSummary(variantId, 'delivered-declaration-count').median
        },
        timing: {
            navigationReadyMs: createMetricSummary(variantId, 'navigation-ready-ms'),
            stylesheetParseMs: createMetricSummary(variantId, 'stylesheet-parse-ms'),
            styleRecalculationMs: createMetricSummary(variantId, 'style-recalculation-ms'),
            styleRecalculationCount: createMetricSummary(variantId, 'style-recalculation-count'),
            layoutMs: createMetricSummary(variantId, 'layout-ms'),
            paintMs: createMetricSummary(variantId, 'paint-ms'),
            longTaskCount: createMetricSummary(variantId, 'long-task-count'),
            fcpMs: createMetricSummary(variantId, 'fcp-ms'),
            lcpMs: createMetricSummary(variantId, 'lcp-ms'),
            inpStyleInteractionMs: createMetricSummary(variantId, 'inp-style-interaction-ms')
        },
        browser: {
            jsHeapUsedBytes: createMetricSummary(variantId, 'js-heap-used-bytes'),
            cssomRuleCount: createMetricSummary(variantId, 'cssom-rule-count')
        },
        dom: {
            nodeCount: createMetricSummary(variantId, 'dom-node-count'),
            affectedElementCount: createMetricSummary(variantId, 'affected-element-count'),
            averageClassCount: createMetricSummary(variantId, 'average-class-count')
        },
        runtime: {
            readyMs: createMetricSummary(variantId, 'runtime-ready-ms'),
            bootstrapMs: createMetricSummary(variantId, 'runtime-bootstrap-ms'),
            observeMs: createMetricSummary(variantId, 'runtime-observe-ms'),
            mutationMs: createMetricSummary(variantId, 'runtime-mutation-ms'),
            generatedRuleCount: createMetricSummary(variantId, 'runtime-generated-rule-count'),
            generatedRuleCountDelta: createMetricSummary(variantId, 'runtime-generated-rule-count-delta'),
            styleRawBytes: createMetricSummary(variantId, 'runtime-style-raw-bytes'),
            styleRawBytesDelta: createMetricSummary(variantId, 'runtime-style-raw-bytes-delta'),
            retainedClassCount: createMetricSummary(variantId, 'retained-class-count'),
            retainedRuleCount: createMetricSummary(variantId, 'retained-rule-count'),
            mutationObserverCallbackCount: createMetricSummary(variantId, 'mutation-observer-callback-count'),
            mutationObserverCallbackDurationMs: createMetricSummary(variantId, 'mutation-observer-callback-duration-ms')
        },
        correctness: {
            routeCount: createMetricSummary(variantId, 'route-count'),
            progressiveAdopted: createMetricSummary(variantId, 'progressive-adopted'),
            computedStyleValid: createMetricSummary(variantId, 'computed-style-valid')
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

function findSummary(variantId, metricId) {
    const summary = report.summary.find((candidate) => candidate.variantId === variantId && candidate.metricId === metricId)
    if (!summary) {
        throw new Error(`browser-lifecycle report is missing ${metricId} for ${variantId}.`)
    }
    return summary
}

function getMetrics(ids) {
    return ids.map(getMetric)
}

function getMetric(metricId) {
    const metric = report.metrics.find((candidate) => candidate.id === metricId)
    if (!metric) throw new Error(`browser-lifecycle report is missing metric ${metricId}.`)
    return metric
}

function uniqueBy(values, getKey) {
    const seen = new Set()
    const result = []
    for (const value of values) {
        const key = getKey(value)
        if (seen.has(key)) continue
        seen.add(key)
        result.push(value)
    }
    return result
}

function formatLabel(id) {
    return id.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ')
}

function formatModeLabel(modeId) {
    if (modeId === 'master-static') return 'Master CSS static'
    if (modeId === 'master-runtime') return 'Master CSS runtime'
    if (modeId === 'master-progressive') return 'Master CSS progressive'
    if (modeId === 'tailwind-static') return 'Tailwind CSS static'
    return modeId
}

function toCamelCase(value) {
    return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
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
