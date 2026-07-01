import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const fixtureIds = ['minimal', 'docs', 'dashboard', 'stress-css']
const reportSources = [
    {
        suite: 'startup-diagnostics',
        file: '.results/startup-diagnostics/report.json',
        command: 'BENCHMARK_ROUNDS=3 pnpm --filter ./benchmarks bench:startup-diagnostics'
    },
    {
        suite: 'build-diagnostics',
        file: '.results/build-diagnostics/report.json',
        command: 'BENCHMARK_ROUNDS=3 pnpm --filter ./benchmarks bench:build-diagnostics'
    },
    {
        suite: 'compiler-diagnostics',
        file: '.results/compiler-diagnostics/report.json',
        command: 'BENCHMARK_ROUNDS=3 pnpm --filter ./benchmarks bench:compiler-diagnostics'
    },
    {
        suite: 'extraction-diagnostics',
        file: '.results/extraction-diagnostics/report.json',
        command: 'BENCHMARK_ROUNDS=3 pnpm --filter ./benchmarks bench:extraction-diagnostics'
    }
]

const selectedMetrics = {
    startupCli: [
        'cli-command-elapsed-ms',
        'cli-probe-command-elapsed-ms',
        'cli-scanner-import-ms'
    ],
    startupVite: [
        'vite-master-command-overhead-ms',
        'master-vite-import-ms',
        'master-vite-core-module-import-ms',
        'vite-master-scanner-init-ms',
        'vite-build-with-master-ms'
    ],
    buildCli: [
        'cli-source-scan-ms',
        'cli-css-extraction-ms'
    ],
    buildVite: [
        'vite-baseline-build-ms',
        'vite-total-build-ms',
        'vite-master-scanner-init-ms',
        'vite-master-generate-bundle-ms'
    ],
    'compiler-diagnostics': [
        'production-create-extracted-css-ms',
        'diagnostic-compiler-total-ms',
        'render-compiled-css-ms',
        'generated-css-raw-bytes',
        'final-css-raw-bytes'
    ],
    'extraction-diagnostics': [
        'production-create-extracted-css-ms',
        'diagnostic-extraction-total-ms',
        'engine-rule-generation-ms',
        'css-text-serialization-ms',
        'final-css-assembly-ms',
        'generated-css-brotli-bytes',
        'final-css-brotli-bytes'
    ]
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const benchmarkRoot = resolve(__dirname, '..')
const snapshotFile = resolve(__dirname, 'snapshot.json')
const reports = Object.fromEntries(await Promise.all(reportSources.map(async (source) => {
    const report = await readReport(source)
    return [source.suite, report]
})))

validateReports()

const snapshot = {
    schemaVersion: 1,
    suite: 'build-path-diagnostics',
    generatedAt: new Date().toISOString(),
    sourceReports: reportSources.map((source) => ({
        suite: source.suite,
        generatedAt: reports[source.suite].generatedAt,
        command: source.command
    })),
    environment: reports['startup-diagnostics'].environment,
    packages: mergePackages(reportSources.map((source) => reports[source.suite].packages)),
    fixtures: fixtureIds.map((id) => {
        const fixture = reports['startup-diagnostics'].fixtures.find((candidate) => candidate.id === id)
        return {
            id: fixture.id,
            name: fixture.name,
            purpose: fixture.purpose
        }
    }),
    metrics: Object.fromEntries(reportSources.map((source) => [
        source.suite,
        getMetrics(reports[source.suite], getSuiteMetricIds(source.suite))
    ])),
    results: fixtureIds.map(createFixtureResult),
    limits: [
        'This snapshot summarizes Master CSS build-path diagnostics only; it is not a cross-framework build benchmark.',
        'Startup diagnostics run child-process probes, so import timings are directional and are not additive flamegraphs.',
        'Build diagnostics instrument CLI and Vite paths but do not replace full production command timing.',
        'Compiler and extraction diagnostics require unchanged output hashes before their timings are useful.',
        'Results are advisory and should be read with the package versions, commands, machine details, and fixture source.'
    ]
}

await writeFile(snapshotFile, `${JSON.stringify(snapshot, null, 4)}\n`)
console.log(`Wrote ${snapshotFile}`)

async function readReport(source) {
    const file = resolve(benchmarkRoot, source.file)
    const report = JSON.parse(await readFile(file, 'utf8'))
    if (report.suite !== source.suite) {
        throw new Error(`Expected ${source.suite} report at ${file}, received ${report.suite}.`)
    }
    return report
}

function validateReports() {
    const referenceEnvironment = JSON.stringify(reports['startup-diagnostics'].environment)

    for (const source of reportSources) {
        const report = reports[source.suite]
        if (JSON.stringify(report.environment) !== referenceEnvironment) {
            throw new Error(`${source.suite} was generated in a different environment.`)
        }

        for (const fixtureId of fixtureIds) {
            if (!report.fixtures.some((fixture) => fixture.id === fixtureId)) {
                throw new Error(`${source.suite} is missing fixture ${fixtureId}.`)
            }
        }

        for (const metricId of getSuiteMetricIds(source.suite)) {
            if (!report.metrics.some((metric) => metric.id === metricId)) {
                throw new Error(`${source.suite} is missing metric ${metricId}.`)
            }
        }
    }

    for (const fixtureId of fixtureIds) {
        validateVariant('startup-diagnostics', `${fixtureId}-master-cli-startup-diagnostic`, selectedMetrics.startupCli)
        validateVariant('startup-diagnostics', `${fixtureId}-master-vite-startup-diagnostic`, selectedMetrics.startupVite)
        validateVariant('build-diagnostics', `${fixtureId}-master-cli-diagnostic`, selectedMetrics.buildCli)
        validateVariant('build-diagnostics', `${fixtureId}-master-vite-diagnostic`, selectedMetrics.buildVite)
        validateVariant('compiler-diagnostics', `${fixtureId}-master-static-compiler`)
        validateVariant('extraction-diagnostics', `${fixtureId}-master-static-extraction`)
    }
}

function validateVariant(suite, variantId, metricIds = selectedMetrics[suite]) {
    const report = reports[suite]
    if (!report.variants.some((variant) => variant.id === variantId)) {
        throw new Error(`${suite} is missing variant ${variantId}.`)
    }

    for (const metricId of metricIds) {
        findSummary(suite, variantId, metricId)
    }
}

function createFixtureResult(fixtureId) {
    return {
        fixtureId,
        cli: {
            startup: createMetricGroup('startup-diagnostics', `${fixtureId}-master-cli-startup-diagnostic`, selectedMetrics.startupCli),
            build: createMetricGroup('build-diagnostics', `${fixtureId}-master-cli-diagnostic`, selectedMetrics.buildCli)
        },
        vite: {
            startup: createMetricGroup('startup-diagnostics', `${fixtureId}-master-vite-startup-diagnostic`, selectedMetrics.startupVite),
            build: createMetricGroup('build-diagnostics', `${fixtureId}-master-vite-diagnostic`, selectedMetrics.buildVite)
        },
        compiler: createMetricGroup('compiler-diagnostics', `${fixtureId}-master-static-compiler`),
        extraction: createMetricGroup('extraction-diagnostics', `${fixtureId}-master-static-extraction`)
    }
}

function createMetricGroup(suite, variantId, metricIds = selectedMetrics[suite]) {
    return {
        variantId,
        metrics: Object.fromEntries(metricIds.map((metricId) => [
            metricId,
            createMetricSummary(suite, variantId, metricId)
        ]))
    }
}

function createMetricSummary(suite, variantId, metricId) {
    const summary = findSummary(suite, variantId, metricId)
    const unit = getMetric(suite, metricId).unit
    const round = unit === 'ms' ? roundTwo : roundInteger

    return {
        min: round(summary.min),
        median: round(summary.median),
        mean: round(summary.mean),
        max: round(summary.max),
        sampleCount: summary.sampleCount,
        unit: summary.unit
    }
}

function findSummary(suite, variantId, metricId) {
    const summary = reports[suite].summary.find((candidate) => (
        candidate.variantId === variantId
        && candidate.metricId === metricId
    ))
    if (!summary) throw new Error(`${suite} is missing ${metricId} for ${variantId}.`)
    return summary
}

function getMetric(suite, metricId) {
    const metric = reports[suite].metrics.find((candidate) => candidate.id === metricId)
    if (!metric) throw new Error(`${suite} is missing metric ${metricId}.`)
    return metric
}

function getMetrics(report, metricIds) {
    return metricIds.map((metricId) => {
        const metric = report.metrics.find((candidate) => candidate.id === metricId)
        if (!metric) throw new Error(`${report.suite} is missing metric ${metricId}.`)
        return {
            id: metric.id,
            label: metric.label,
            unit: metric.unit,
            description: metric.description
        }
    })
}

function getSuiteMetricIds(suite) {
    if (suite === 'startup-diagnostics') return unique([...selectedMetrics.startupCli, ...selectedMetrics.startupVite])
    if (suite === 'build-diagnostics') return unique([...selectedMetrics.buildCli, ...selectedMetrics.buildVite])
    return selectedMetrics[suite]
}

function unique(values) {
    return [...new Set(values)]
}

function mergePackages(packageSets) {
    const packages = new Map()
    for (const packageSet of packageSets) {
        for (const packageInfo of packageSet) {
            packages.set(packageInfo.name, packageInfo)
        }
    }
    return [...packages.values()].sort((a, b) => a.name.localeCompare(b.name))
}

function roundTwo(value) {
    return Math.round(value * 100) / 100
}

function roundInteger(value) {
    return Math.round(value)
}
