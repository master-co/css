import { bench, describe } from 'vitest'
import { benchmarkFixtures } from '../fixtures/manifest'
import { analyzeCSSStructure, createCSSStructureSamples, cssStructureMetrics } from '../shared/css-structure'
import { collectEnvironment, collectPackageVersions } from '../shared/environment'
import { validateFixtures } from '../shared/fixtures'
import { readFiles } from '../shared/runner'
import { writeBenchmarkReport } from '../shared/report'
import { summarizeReportSamples } from '../shared/stats'
import {
    createStaticBuildVariantId,
    createStaticBuildVariants,
    getStaticBenchmarkFixtures,
    runStaticBuild,
    staticBenchmarkAdapters,
    staticBuildTools
} from '../shared/static-build'
import type { BenchmarkMetricUnit, BenchmarkReport, BenchmarkSample } from '../shared/types'

const benchOptions = {
    iterations: 1,
    retainSamples: true,
    throws: true,
    time: 1,
    warmup: false,
    warmupIterations: 0,
    warmupTime: 0
}

let reportPromise: Promise<number> | undefined

async function writeCSSStructureReportOnce() {
    if (!reportPromise) {
        reportPromise = (async () => {
            const startedAt = performance.now()
            const report = await createCSSStructureReport()
            const output = await writeBenchmarkReport(report)

            console.log(`Wrote CSS structure report JSON to ${output.jsonFile}`)
            console.log(`Wrote CSS structure report Markdown to ${output.markdownFile}`)

            return performance.now() - startedAt
        })()
    }

    return reportPromise
}

async function createCSSStructureReport(): Promise<BenchmarkReport> {
    validateFixtures(benchmarkFixtures)
    const variants = createStaticBuildVariants()
    const samples: BenchmarkSample[] = []
    const artifacts = []

    for (const variant of variants) {
        const tool = staticBuildTools.find((candidate) => createStaticBuildVariantId(variant.fixtureId, candidate.id) === variant.id)
        if (!tool) throw new Error(`Missing static build tool for variant: ${variant.id}`)
        console.log(`Collecting CSS structure for ${variant.label}`)
        const result = await runStaticBuild({
            suite: 'css-structure',
            fixtureId: variant.fixtureId,
            tool,
            round: 0
        })
        const css = await readFiles(result.cssFiles)
        const structure = analyzeCSSStructure(css)

        samples.push(...createCSSStructureSamples(variant.id, structure))
        artifacts.push(...result.artifacts)
    }

    const metricUnits = new Map(cssStructureMetrics.map((metric) => [metric.id, metric.unit as BenchmarkMetricUnit]))

    return {
        schemaVersion: 1,
        suite: 'css-structure',
        generatedAt: new Date().toISOString(),
        environment: collectEnvironment(),
        packages: await collectPackageVersions([
            '@master/css',
            '@master/css-cli',
            '@master/css.vite',
            'tailwindcss',
            '@tailwindcss/cli',
            '@tailwindcss/vite',
            'vite',
            'css-tree'
        ]),
        fixtures: getStaticBenchmarkFixtures(benchmarkFixtures),
        adapters: staticBenchmarkAdapters,
        variants,
        metrics: cssStructureMetrics,
        samples,
        summary: summarizeReportSamples(samples, metricUnits),
        limits: [
            'This suite measures generated CSS artifact structure only; it does not measure browser parse, style recalculation, layout, paint, or interaction cost.',
            'Metrics are derived from a CSS AST, not string matching.',
            'Selector specificity and complexity scores are explanatory structure metrics and are not browser timing measurements.',
            'Master CSS and Tailwind CSS fixtures target equivalent rendered UI intent, not identical class strings.'
        ],
        artifacts
    }
}

describe('css structure', () => {
    bench('write CSS structure report', async () => {
        await writeCSSStructureReportOnce()
    }, benchOptions)
})
