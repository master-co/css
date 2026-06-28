import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const cacheModes = ['cold-cache', 'warm-cache']
const cssVolumeLevels = [
    {
        id: 'small-css',
        label: 'Small CSS'
    },
    {
        id: 'medium-css',
        label: 'Medium CSS'
    },
    {
        id: 'large-css',
        label: 'Large CSS'
    },
    {
        id: 'xlarge-css',
        label: 'XLarge CSS'
    }
]
const domScales = [
    {
        id: 'small-dom',
        label: 'Small DOM'
    },
    {
        id: 'medium-dom',
        label: 'Medium DOM'
    },
    {
        id: 'large-dom',
        label: 'Large DOM'
    }
]
const metricIds = [
    'navigation-ready-ms',
    'stylesheet-parse-ms',
    'style-recalculation-ms',
    'layout-ms',
    'paint-ms',
    'long-task-count',
    'dom-item-count',
    'dom-node-count',
    'css-raw-bytes',
    'css-gzip-bytes',
    'css-brotli-bytes',
    'style-rule-count',
    'selector-count',
    'declaration-count'
]

const __dirname = dirname(fileURLToPath(import.meta.url))
const benchmarkRoot = resolve(__dirname, '..')
const reportFile = resolve(benchmarkRoot, '.results/browser-css-cost/report.json')
const snapshotFile = resolve(__dirname, 'snapshot.json')
const report = JSON.parse(await readFile(reportFile, 'utf8'))

if (report.suite !== 'browser-css-cost') {
    throw new Error(`Expected browser-css-cost report at ${reportFile}, received ${report.suite}.`)
}

validateReport()

const snapshot = {
    schemaVersion: 1,
    suite: 'browser-css-cost',
    generatedAt: new Date().toISOString(),
    sourceReport: {
        suite: report.suite,
        generatedAt: report.generatedAt,
        command: 'pnpm --filter ./benchmarks bench:browser-css-cost'
    },
    environment: report.environment,
    browser: report.browser,
    packages: report.packages,
    fixtures: report.fixtures.map((fixture) => ({
        id: fixture.id,
        name: fixture.name,
        purpose: fixture.purpose
    })),
    variants: report.variants.map((variant) => ({
        id: variant.id,
        fixtureId: variant.fixtureId,
        adapterId: variant.adapterId,
        label: variant.label
    })),
    metrics: getMetrics(metricIds),
    cssVolume: cssVolumeLevels.map((level) => ({
        ...level,
        results: Object.fromEntries(cacheModes.map((cacheMode) => [
            cacheMode,
            createResult(createCSSVolumeVariantId(level.id, cacheMode))
        ]))
    })),
    domScaling: domScales.map((scale) => ({
        ...scale,
        results: Object.fromEntries(cacheModes.map((cacheMode) => [
            cacheMode,
            createResult(createDOMScaleVariantId(scale.id, cacheMode))
        ]))
    })),
    limits: report.limits
}

await writeFile(snapshotFile, `${JSON.stringify(snapshot, null, 4)}\n`)
console.log(`Wrote ${snapshotFile}`)

function validateReport() {
    for (const metricId of metricIds) {
        if (!report.metrics.some((metric) => metric.id === metricId)) {
            throw new Error(`browser-css-cost report is missing metric ${metricId}.`)
        }
    }

    for (const level of cssVolumeLevels) {
        for (const cacheMode of cacheModes) {
            validateVariant(createCSSVolumeVariantId(level.id, cacheMode))
        }
    }

    for (const scale of domScales) {
        for (const cacheMode of cacheModes) {
            validateVariant(createDOMScaleVariantId(scale.id, cacheMode))
        }
    }
}

function validateVariant(variantId) {
    if (!report.variants.some((variant) => variant.id === variantId)) {
        throw new Error(`browser-css-cost report is missing variant ${variantId}.`)
    }

    for (const metricId of metricIds) {
        findSummary(variantId, metricId)
    }
}

function createResult(variantId) {
    return {
        variantId,
        timing: {
            navigationReadyMs: createMetricSummary(variantId, 'navigation-ready-ms'),
            stylesheetParseMs: createMetricSummary(variantId, 'stylesheet-parse-ms'),
            styleRecalculationMs: createMetricSummary(variantId, 'style-recalculation-ms'),
            layoutMs: createMetricSummary(variantId, 'layout-ms'),
            paintMs: createMetricSummary(variantId, 'paint-ms'),
            longTaskCount: createMetricSummary(variantId, 'long-task-count')
        },
        dom: {
            itemCount: findSummary(variantId, 'dom-item-count').median,
            nodeCount: createMetricSummary(variantId, 'dom-node-count')
        },
        css: {
            rawBytes: findSummary(variantId, 'css-raw-bytes').median,
            gzipBytes: findSummary(variantId, 'css-gzip-bytes').median,
            brotliBytes: findSummary(variantId, 'css-brotli-bytes').median
        },
        structure: {
            styleRules: findSummary(variantId, 'style-rule-count').median,
            selectors: findSummary(variantId, 'selector-count').median,
            declarations: findSummary(variantId, 'declaration-count').median
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
        throw new Error(`browser-css-cost report is missing ${metricId} for ${variantId}.`)
    }
    return summary
}

function getMetrics(ids) {
    return ids.map(getMetric)
}

function getMetric(metricId) {
    const metric = report.metrics.find((candidate) => candidate.id === metricId)
    if (!metric) throw new Error(`browser-css-cost report is missing metric ${metricId}.`)
    return metric
}

function createCSSVolumeVariantId(levelId, cacheMode) {
    return `stress-css-${levelId}-${cacheMode}`
}

function createDOMScaleVariantId(scaleId, cacheMode) {
    return `stress-dom-${scaleId}-${cacheMode}`
}

function roundOne(value) {
    return Number(value.toFixed(1))
}

function roundInteger(value) {
    return Number(value.toFixed(0))
}
