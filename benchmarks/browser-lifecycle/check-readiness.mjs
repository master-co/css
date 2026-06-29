import { readFile } from 'node:fs/promises'
import { dirname, isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const benchmarkRoot = resolve(__dirname, '..')
const defaultSource = 'browser-lifecycle/snapshot.json'

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

const profileIds = new Set(['snapshot', 'baseline', 'long-session'])

try {
    const cli = parseArgs(process.argv.slice(2))
    const profile = cli.options.profile || 'snapshot'
    if (!profileIds.has(profile)) {
        throw new Error(`Unknown browser lifecycle readiness profile "${profile}". Expected one of: ${[...profileIds].join(', ')}.`)
    }

    const minLongSessionMs = parsePositiveNumber(cli.options['min-long-session-ms'] || '300000', '--min-long-session-ms')
    const source = cli.positionals[0] || defaultSource
    const sourceFile = resolveSource(source)
    const data = JSON.parse(await readFile(sourceFile, 'utf8'))
    const errors = []

    if (profile === 'snapshot') validateSnapshot(data, errors)
    if (profile === 'baseline') validateBaselineReport(data, errors)
    if (profile === 'long-session') validateLongSessionReport(data, minLongSessionMs, errors)

    if (errors.length) {
        console.error(`Browser lifecycle ${profile} readiness check failed for ${source}`)
        for (const error of errors) console.error(`- ${error}`)
        process.exit(1)
    }

    printSuccess(profile, source, data, minLongSessionMs)
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
}

function validateSnapshot(snapshot, errors) {
    validateTopLevelSnapshotShape(snapshot, errors)
    validateIdSet('snapshot scenarios', collectIds(snapshot.scenarios), expectedScenarioIds, errors)
    validateIdSet('snapshot modes', collectIds(snapshot.modes), expectedModeIds, errors)

    const variants = normalizeSnapshotVariants(snapshot, errors)
    validateVariantMetricShape(snapshot.metrics, variants, errors)
    validateMeasuredSampleCounts(variants, errors)
    validateCorrectness(variants, errors)
}

function validateBaselineReport(report, errors) {
    validateRawReportShape(report, errors)
    validateIdSet('baseline scenarios', collectVariantIds(report.variants, 'scenarioId'), expectedScenarioIds, errors)
    validateIdSet('baseline modes', collectVariantIds(report.variants, 'modeId'), expectedModeIds, errors)

    const variants = normalizeReportVariants(report, errors)
    validateVariantMetricShape(report.metrics, variants, errors)
    validateMeasuredSampleCounts(variants, errors)
    validateCorrectness(variants, errors)
}

function validateLongSessionReport(report, minLongSessionMs, errors) {
    validateRawReportShape(report, errors)

    const scenarioIds = collectVariantIds(report.variants, 'scenarioId')
    validateIdSet('long-session scenarios', scenarioIds, ['long-session'], errors)
    validateKnownSubset('long-session modes', collectVariantIds(report.variants, 'modeId'), expectedModeIds, errors)

    const variants = normalizeReportVariants(report, errors)
    validateVariantMetricShape(report.metrics, variants, errors)
    validateMeasuredSampleCounts(variants, errors)
    validateCorrectness(variants, errors)
    validateLongSessionDuration(variants, minLongSessionMs, errors)
}

function validateTopLevelSnapshotShape(snapshot, errors) {
    if (snapshot?.schemaVersion !== 1) errors.push('Snapshot schemaVersion must be 1.')
    if (snapshot?.suite !== 'browser-lifecycle') errors.push('Snapshot suite must be browser-lifecycle.')

    for (const key of ['environment', 'browser', 'sourceReport']) {
        if (!snapshot?.[key]) errors.push(`Snapshot is missing ${key}.`)
    }

    for (const key of ['packages', 'fixtures', 'modes', 'scenarios', 'metrics', 'limits', 'variants', 'variantSummaries']) {
        if (!Array.isArray(snapshot?.[key]) || !snapshot[key].length) {
            errors.push(`Snapshot ${key} must be a non-empty array.`)
        }
    }

    if (Array.isArray(snapshot?.variants) && Array.isArray(snapshot?.variantSummaries) && snapshot.variants.length !== snapshot.variantSummaries.length) {
        errors.push(`Snapshot variantSummaries count (${snapshot.variantSummaries.length}) must match variants count (${snapshot.variants.length}).`)
    }
}

function validateRawReportShape(report, errors) {
    if (report?.schemaVersion !== 1) errors.push('Report schemaVersion must be 1.')
    if (report?.suite !== 'browser-lifecycle') errors.push('Report suite must be browser-lifecycle.')

    for (const key of ['environment', 'browser']) {
        if (!report?.[key]) errors.push(`Report is missing ${key}.`)
    }

    for (const key of ['packages', 'fixtures', 'adapters', 'variants', 'metrics', 'samples', 'summary', 'limits', 'artifacts']) {
        if (!Array.isArray(report?.[key])) errors.push(`Report ${key} must be an array.`)
    }
}

function normalizeSnapshotVariants(snapshot, errors) {
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
            errors.push('Snapshot variant summary is missing variantId.')
            return false
        }
        return true
    })
}

function normalizeReportVariants(report, errors) {
    if (!Array.isArray(report?.variants) || !Array.isArray(report?.metrics) || !Array.isArray(report?.summary)) return []

    const summaryByKey = new Map(report.summary.map((summary) => [`${summary.variantId}:${summary.metricId}`, summary]))
    return report.variants.map((variant) => {
        const metrics = {}
        for (const metric of report.metrics) {
            const summary = summaryByKey.get(`${variant.id}:${metric.id}`)
            if (!summary) errors.push(`Report is missing summary metric ${metric.id} for ${variant.id}.`)
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

function validateVariantMetricShape(metrics, variants, errors) {
    if (!Array.isArray(metrics)) return

    const metricIds = metrics.map((metric) => metric.id).filter(Boolean)
    for (const variant of variants) {
        for (const metricId of metricIds) {
            const summary = variant.metrics?.[metricId]
            if (!summary) {
                errors.push(`Variant ${variant.variantId} is missing metric ${metricId}.`)
                continue
            }
            validateMetricSummary(variant.variantId, metricId, summary, errors)
        }
    }
}

function validateMetricSummary(variantId, metricId, summary, errors) {
    for (const key of ['min', 'median', 'mean', 'max', 'sampleCount']) {
        if (!Number.isFinite(summary[key])) {
            errors.push(`Metric ${metricId} for ${variantId} has invalid ${key}.`)
        }
    }
    if (!summary.unit) errors.push(`Metric ${metricId} for ${variantId} is missing unit.`)
}

function validateMeasuredSampleCounts(variants, errors) {
    const sampleCounts = []
    for (const variant of variants) {
        for (const metricId of measuredMetricIds) {
            const summary = variant.metrics?.[metricId]
            if (!summary) continue
            if (summary.sampleCount < 1) errors.push(`Metric ${metricId} for ${variant.variantId} must have at least one measured sample.`)
            sampleCounts.push(summary.sampleCount)
        }
    }

    const uniqueSampleCounts = [...new Set(sampleCounts)]
    if (uniqueSampleCounts.length > 1) {
        errors.push(`Measured lifecycle metric sample counts must be consistent, received: ${uniqueSampleCounts.sort((a, b) => a - b).join(', ')}.`)
    }
}

function validateCorrectness(variants, errors) {
    for (const variant of variants) {
        const computedStyle = variant.metrics?.['computed-style-valid']
        if (computedStyle && computedStyle.median !== 1) {
            errors.push(`Variant ${variant.variantId} has computed-style-valid median ${computedStyle.median}; expected 1.`)
        }

        const progressiveAdopted = variant.metrics?.['progressive-adopted']
        if (variant.modeId === 'master-progressive' && progressiveAdopted && progressiveAdopted.median !== 1) {
            errors.push(`Progressive variant ${variant.variantId} has progressive-adopted median ${progressiveAdopted.median}; expected 1.`)
        }
    }
}

function validateLongSessionDuration(variants, minLongSessionMs, errors) {
    for (const variant of variants) {
        const summary = variant.metrics?.['inp-style-interaction-ms']
        if (!summary) continue
        if (summary.median < minLongSessionMs) {
            errors.push(`Long-session variant ${variant.variantId} has INP-style median ${summary.median} ms; expected at least ${minLongSessionMs} ms.`)
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

function printSuccess(profile, source, data, minLongSessionMs) {
    const variantCount = Array.isArray(data.variantSummaries) ? data.variantSummaries.length : data.variants?.length || 0
    const metricCount = data.metrics?.length || 0
    const scenarioIds = Array.isArray(data.scenarios)
        ? collectIds(data.scenarios)
        : collectVariantIds(data.variants, 'scenarioId')
    const modeIds = Array.isArray(data.modes)
        ? collectIds(data.modes)
        : collectVariantIds(data.variants, 'modeId')

    console.log(`Browser lifecycle ${profile} readiness check passed for ${source}`)
    console.log(`Variants: ${variantCount}; metrics: ${metricCount}; scenarios: ${scenarioIds.join(',')}; modes: ${modeIds.join(',')}`)
    if (profile === 'long-session') console.log(`Minimum long-session INP-style median: ${minLongSessionMs} ms`)
}

function parseArgs(argv) {
    const options = {}
    const positionals = []

    for (let index = 0; index < argv.length; index++) {
        const arg = argv[index]
        if (arg === '--') continue
        if (!arg.startsWith('--')) {
            positionals.push(arg)
            continue
        }

        const [name, inlineValue] = arg.slice(2).split('=', 2)
        if (name === 'help') {
            printHelp()
            process.exit(0)
        }
        if (name !== 'profile' && name !== 'min-long-session-ms') {
            throw new Error(`Unknown option --${name}.`)
        }

        const value = inlineValue ?? argv[++index]
        if (!value || value.startsWith('--')) throw new Error(`--${name} requires a value.`)
        options[name] = value
    }

    if (positionals.length > 1) throw new Error(`Expected at most one source path, received: ${positionals.join(', ')}.`)
    return { options, positionals }
}

function parsePositiveNumber(value, label) {
    const number = Number(value)
    if (!Number.isFinite(number) || number <= 0) throw new Error(`${label} must be a positive number.`)
    return number
}

function resolveSource(source) {
    return isAbsolute(source) ? source : resolve(benchmarkRoot, source)
}

function printHelp() {
    console.log([
        'Usage: node browser-lifecycle/check-readiness.mjs [source] [--profile snapshot|baseline|long-session] [--min-long-session-ms 300000]',
        '',
        `Default source: ${defaultSource}`,
        'Profiles:',
        '  snapshot      Validate committed curated browser lifecycle snapshot shape and correctness.',
        '  baseline      Validate all-scenario raw browser lifecycle report shape and correctness.',
        '  long-session  Validate focused long-session raw report and minimum INP-style duration.'
    ].join('\n'))
}
