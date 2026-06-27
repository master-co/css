import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { bench, describe } from 'vitest'
import { benchmarkFixtures } from '../fixtures/manifest'
import { staticFixtureIds } from '../fixtures/static'
import { collectEnvironment, collectPackageVersions } from '../shared/environment'
import {
    createExtractionDiagnosticVariants,
    extractionDiagnosticMetricIds,
    type ExtractionDiagnosticResult
} from '../shared/extraction-diagnostics'
import { validateFixtures } from '../shared/fixtures'
import { benchmarkRoot, runCommand } from '../shared/runner'
import { writeBenchmarkReport } from '../shared/report'
import { summarizeReportSamples } from '../shared/stats'
import { getStaticBenchmarkFixtures, staticBenchmarkAdapters } from '../shared/static-build'
import type { BenchmarkMetric, BenchmarkMetricUnit, BenchmarkReport, BenchmarkSample } from '../shared/types'

const benchOptions = {
    iterations: 1,
    retainSamples: true,
    throws: true,
    time: 1,
    warmup: false,
    warmupIterations: 0,
    warmupTime: 0
}

const metricMetadata: Record<typeof extractionDiagnosticMetricIds[number], Omit<BenchmarkMetric, 'id'>> = {
    'production-create-extracted-css-ms': {
        label: 'Production createExtractedCSS',
        unit: 'ms',
        description: 'Time spent in the production createExtractedCSS path after scanner setup.'
    },
    'diagnostic-extraction-total-ms': {
        label: 'Diagnostic extraction total',
        unit: 'ms',
        description: 'Total elapsed time for the benchmark-local diagnostic extraction decomposition.'
    },
    'master-import-graph-resolution-ms': {
        label: 'Master package import graph',
        unit: 'ms',
        description: 'Time spent resolving the @master/css package CSS import graph.'
    },
    'master-package-artifact-read-ms': {
        label: 'Master package artifact read',
        unit: 'ms',
        description: 'Time spent reading the generated default preset manifest and native CSS artifact.'
    },
    'master-package-css-compilation-ms': {
        label: 'Master package CSS compilation',
        unit: 'ms',
        description: 'Time spent compiling the @master/css package stylesheet source.'
    },
    'entry-css-compilation-ms': {
        label: 'Entry CSS compilation',
        unit: 'ms',
        description: 'Time spent compiling benchmark CSS entry sources.'
    },
    'manifest-finalization-ms': {
        label: 'Manifest finalization',
        unit: 'ms',
        description: 'Time spent finalizing compiled style manifests against the current base manifest.'
    },
    'native-css-collection-ms': {
        label: 'Native CSS collection',
        unit: 'ms',
        description: 'Time spent collecting preserved native CSS sources for rendering.'
    },
    'generated-class-collection-ms': {
        label: 'Generated class collection',
        unit: 'ms',
        description: 'Time spent building the class set passed to the engine render path.'
    },
    'engine-css-creation-ms': {
        label: 'Engine CSS creation',
        unit: 'ms',
        description: 'Time spent creating the Master CSS engine instance used for rendering.'
    },
    'engine-rule-generation-ms': {
        label: 'Engine rule generation',
        unit: 'ms',
        description: 'Time spent adding generated classes to the engine.'
    },
    'native-variable-reference-scan-ms': {
        label: 'Native variable scan',
        unit: 'ms',
        description: 'Time spent scanning native CSS for variable references.'
    },
    'native-animation-reference-scan-ms': {
        label: 'Native animation scan',
        unit: 'ms',
        description: 'Time spent scanning native CSS for animation references.'
    },
    'css-text-serialization-ms': {
        label: 'CSS text serialization',
        unit: 'ms',
        description: 'Time spent serializing generated engine layers into CSS text.'
    },
    'emitted-globals-creation-ms': {
        label: 'Emitted globals creation',
        unit: 'ms',
        description: 'Time spent collecting emitted variable and animation globals.'
    },
    'final-css-assembly-ms': {
        label: 'Final CSS assembly',
        unit: 'ms',
        description: 'Time spent joining native and generated CSS into the final output string.'
    },
    'css-entry-count': {
        label: 'CSS entries',
        unit: 'count',
        description: 'Number of managed CSS entries registered for the fixture.'
    },
    'source-file-count': {
        label: 'Source files scanned',
        unit: 'count',
        description: 'Number of source files scanned before extraction.'
    },
    'latent-class-count': {
        label: 'Latent classes',
        unit: 'count',
        description: 'Scanner latent class count before extraction.'
    },
    'valid-class-count': {
        label: 'Valid classes',
        unit: 'count',
        description: 'Scanner valid class count before extraction.'
    },
    'native-class-name-count': {
        label: 'Native class names',
        unit: 'count',
        description: 'Native class names registered from managed CSS sources.'
    },
    'used-native-class-count': {
        label: 'Used native classes',
        unit: 'count',
        description: 'Native class names used by scanned fixture sources.'
    },
    'generated-class-count': {
        label: 'Generated classes',
        unit: 'count',
        description: 'Final class count passed to the diagnostic engine render path.'
    },
    'master-package-shortcut-hit-count': {
        label: 'Master package shortcut hits',
        unit: 'count',
        description: 'Whether the default preset artifact shortcut was used for the @master/css package source.'
    },
    'master-package-shortcut-fallback-count': {
        label: 'Master package shortcut fallbacks',
        unit: 'count',
        description: 'Whether the diagnostic extraction path fell back to compiling the @master/css package source.'
    },
    'native-css-source-count': {
        label: 'Native CSS sources',
        unit: 'count',
        description: 'Number of non-empty native CSS sources included in the output.'
    },
    'native-css-raw-bytes': {
        label: 'Native CSS raw bytes',
        unit: 'B',
        description: 'Raw bytes of preserved native CSS before generated CSS is appended.'
    },
    'generated-css-raw-bytes': {
        label: 'Generated CSS raw bytes',
        unit: 'B',
        description: 'Raw bytes of generated Master CSS.'
    },
    'generated-css-gzip-bytes': {
        label: 'Generated CSS gzip bytes',
        unit: 'B',
        description: 'Gzip bytes of generated Master CSS.'
    },
    'generated-css-brotli-bytes': {
        label: 'Generated CSS brotli bytes',
        unit: 'B',
        description: 'Brotli bytes of generated Master CSS.'
    },
    'final-css-raw-bytes': {
        label: 'Final CSS raw bytes',
        unit: 'B',
        description: 'Raw bytes of byte-for-byte validated final CSS.'
    },
    'final-css-gzip-bytes': {
        label: 'Final CSS gzip bytes',
        unit: 'B',
        description: 'Gzip bytes of byte-for-byte validated final CSS.'
    },
    'final-css-brotli-bytes': {
        label: 'Final CSS brotli bytes',
        unit: 'B',
        description: 'Brotli bytes of byte-for-byte validated final CSS.'
    }
}

const metrics: BenchmarkMetric[] = extractionDiagnosticMetricIds.map((id) => ({
    id,
    ...metricMetadata[id]
}))

let reportPromise: Promise<number> | undefined

async function writeExtractionDiagnosticsReportOnce() {
    if (!reportPromise) {
        reportPromise = (async () => {
            const startedAt = performance.now()
            const report = await createExtractionDiagnosticsReport()
            const output = await writeBenchmarkReport(report)

            console.log(`Wrote extraction diagnostics report JSON to ${output.jsonFile}`)
            console.log(`Wrote extraction diagnostics report Markdown to ${output.markdownFile}`)

            return performance.now() - startedAt
        })()
    }

    return reportPromise
}

async function createExtractionDiagnosticsReport(): Promise<BenchmarkReport> {
    validateFixtures(benchmarkFixtures)
    const variants = createExtractionDiagnosticVariants(staticFixtureIds)
    const samples: BenchmarkSample[] = []
    const artifacts = []
    const rounds = getDiagnosticRounds()

    for (const variant of variants) {
        for (let round = 0; round < rounds; round++) {
            console.log(`Measuring extraction diagnostics for ${variant.label}, round ${round + 1}/${rounds}`)
            const workspace = resolve(
                benchmarkRoot,
                '.results',
                'extraction-diagnostics',
                'workspaces',
                variant.id,
                `round-${round}`
            )
            const result = await runExtractionDiagnosticInChild({
                workspace,
                fixtureId: variant.fixtureId,
                variantId: variant.id,
                round
            })

            samples.push(...result.samples)
            if (round === rounds - 1) artifacts.push(...result.artifacts)
        }
    }

    const metricUnits = new Map(metrics.map((metric) => [metric.id, metric.unit as BenchmarkMetricUnit]))

    return {
        schemaVersion: 1,
        suite: 'extraction-diagnostics',
        generatedAt: new Date().toISOString(),
        environment: collectEnvironment(),
        packages: await collectPackageVersions([
            '@master/css',
            '@master/css-compiler',
            '@master/css-engine',
            '@master/css-project',
            '@master/css-scanner',
            '@master/css-source',
            '@master/css-stylesheet',
            '@master/css-validator',
            'fast-glob'
        ]),
        fixtures: getStaticBenchmarkFixtures(benchmarkFixtures),
        adapters: staticBenchmarkAdapters,
        variants,
        metrics,
        samples,
        summary: summarizeReportSamples(samples, metricUnits),
        limits: [
            'This suite is diagnostic and does not replace end-user production command timing from build-performance.',
            'Scanner setup is shared with the CLI-equivalent path, while reported extraction timings focus on createExtractedCSS and render decomposition.',
            'The benchmark-local diagnostic renderer must produce the same final CSS SHA-256 as production createExtractedCSS before numbers are reported.',
            'Do not use diagnostic numbers as permission to change CSS output, cascade order, source detection, hydration, or public behavior.'
        ],
        artifacts
    }
}

async function runExtractionDiagnosticInChild(options: {
    workspace: string
    fixtureId: string
    variantId: string
    round: number
}): Promise<ExtractionDiagnosticResult> {
    const output = resolve(options.workspace, 'diagnostic-result.json')
    await runCommand(process.execPath, [
        '--import',
        'tsx',
        'extraction-diagnostics/run-diagnostic.ts',
        '--workspace',
        options.workspace,
        '--fixture-id',
        options.fixtureId,
        '--variant-id',
        options.variantId,
        '--round',
        String(options.round),
        '--output',
        output
    ], benchmarkRoot)

    return JSON.parse(await readFile(output, 'utf8')) as ExtractionDiagnosticResult
}

function getDiagnosticRounds() {
    const value = Number(process.env.BENCHMARK_ROUNDS || 3)
    if (!Number.isFinite(value) || value < 1) return 3
    return Math.floor(value)
}

describe('extraction diagnostics', () => {
    bench('write extraction diagnostics report', async () => {
        await writeExtractionDiagnosticsReportOnce()
    }, benchOptions)
})
