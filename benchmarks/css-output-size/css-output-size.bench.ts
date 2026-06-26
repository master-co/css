import { bench, describe } from 'vitest'
import { benchmarkFixtures } from '../fixtures/manifest'
import { collectEnvironment, collectPackageVersions } from '../shared/environment'
import { validateFixtures } from '../shared/fixtures'
import { writeBenchmarkReport } from '../shared/report'
import { summarizeReportSamples } from '../shared/stats'
import {
    createByteSamples,
    createStaticBuildVariantId,
    createStaticBuildVariants,
    getStaticBenchmarkFixtures,
    runStaticBuild,
    staticBenchmarkAdapters,
    staticBuildTools
} from '../shared/static-build'
import type { BenchmarkMetric, BenchmarkReport, BenchmarkSample } from '../shared/types'

const benchOptions = {
    iterations: 1,
    retainSamples: true,
    throws: true,
    time: 1,
    warmup: false,
    warmupIterations: 0,
    warmupTime: 0
}

const metrics: BenchmarkMetric[] = [
    {
        id: 'css-raw-bytes',
        label: 'CSS raw bytes',
        unit: 'B',
        description: 'Raw bytes of generated CSS files concatenated in output-file order.'
    },
    {
        id: 'css-gzip-bytes',
        label: 'CSS gzip bytes',
        unit: 'B',
        description: 'Gzip bytes for the generated CSS payload.'
    },
    {
        id: 'css-brotli-bytes',
        label: 'CSS brotli bytes',
        unit: 'B',
        description: 'Brotli bytes for the generated CSS payload.'
    },
    {
        id: 'css-file-count',
        label: 'Generated CSS files',
        unit: 'count',
        description: 'Number of CSS files emitted by the production output.'
    }
]

let reportPromise: Promise<number> | undefined

async function writeCSSOutputReportOnce() {
    if (!reportPromise) {
        reportPromise = (async () => {
            const startedAt = performance.now()
            const report = await createCSSOutputReport()
            const output = await writeBenchmarkReport(report)

            console.log(`Wrote CSS output report JSON to ${output.jsonFile}`)
            console.log(`Wrote CSS output report Markdown to ${output.markdownFile}`)

            return performance.now() - startedAt
        })()
    }

    return reportPromise
}

async function createCSSOutputReport(): Promise<BenchmarkReport> {
    validateFixtures(benchmarkFixtures)
    const variants = createStaticBuildVariants()
    const samples: BenchmarkSample[] = []
    const artifacts = []

    for (const variant of variants) {
        const tool = staticBuildTools.find((candidate) => createStaticBuildVariantId(variant.fixtureId, candidate.id) === variant.id)
        if (!tool) throw new Error(`Missing static build tool for variant: ${variant.id}`)
        console.log(`Collecting CSS output for ${variant.label}`)
        const result = await runStaticBuild({
            suite: 'css-output-size',
            fixtureId: variant.fixtureId,
            tool,
            round: 0
        })

        samples.push(...createByteSamples(variant.id, result))
        artifacts.push(...result.artifacts)
    }

    const metricUnits = new Map(metrics.map((metric) => [metric.id, metric.unit]))

    return {
        schemaVersion: 1,
        suite: 'css-output-size',
        generatedAt: new Date().toISOString(),
        environment: collectEnvironment(),
        packages: await collectPackageVersions([
            '@master/css',
            '@master/css-cli',
            '@master/css.vite',
            'tailwindcss',
            '@tailwindcss/cli',
            '@tailwindcss/vite',
            'vite'
        ]),
        fixtures: getStaticBenchmarkFixtures(benchmarkFixtures),
        adapters: staticBenchmarkAdapters,
        variants,
        metrics,
        samples,
        summary: summarizeReportSamples(samples, metricUnits),
        limits: [
            'This suite measures generated CSS artifacts only; it does not measure browser parse, style recalculation, layout, paint, or interaction cost.',
            'Master CSS and Tailwind CSS fixtures target equivalent rendered UI intent, not identical class strings.',
            'CLI and Vite variants use their own production command paths and should be compared with setup labels visible.'
        ],
        artifacts
    }
}

describe('css output size', () => {
    bench('write CSS output size report', async () => {
        await writeCSSOutputReportOnce()
    }, benchOptions)
})
