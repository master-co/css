import { resolve } from 'node:path'
import { bench, describe } from 'vitest'
import { benchmarkFixtures } from '../fixtures/manifest'
import { collectEnvironment, collectPackageVersions } from '../shared/environment'
import { validateFixtures } from '../shared/fixtures'
import { benchmarkRoot } from '../shared/runner'
import { writeBenchmarkReport } from '../shared/report'
import { summarizeReportSamples } from '../shared/stats'
import {
  createStaticBuildVariantId,
  createStaticBuildVariants,
  getStaticBenchmarkFixtures,
  prepareStaticWorkspace,
  runPreparedStaticBuild,
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
    id: 'cold-build-ms',
    label: 'Cold production build',
    unit: 'ms',
    description: 'Elapsed wall time for the first production build in a clean temp workspace.'
  },
  {
    id: 'repeat-build-ms',
    label: 'Repeat production build',
    unit: 'ms',
    description: 'Elapsed wall time for a second production build in the same temp workspace.'
  }
]

let reportPromise: Promise<number> | undefined

async function writeBuildPerformanceReportOnce() {
  if (!reportPromise) {
    reportPromise = (async () => {
      const startedAt = performance.now()
      const report = await createBuildPerformanceReport()
      const output = await writeBenchmarkReport(report)

      console.log(`Wrote build performance report JSON to ${output.jsonFile}`)
      console.log(`Wrote build performance report Markdown to ${output.markdownFile}`)

      return performance.now() - startedAt
    })()
  }

  return reportPromise
}

async function createBuildPerformanceReport(): Promise<BenchmarkReport> {
  validateFixtures(benchmarkFixtures)
  const variants = createStaticBuildVariants()
  const samples: BenchmarkSample[] = []
  const artifacts = []
  const rounds = getBuildRounds()

  for (const variant of variants) {
    const tool = staticBuildTools.find((candidate) => createStaticBuildVariantId(variant.fixtureId, candidate.id) === variant.id)
    if (!tool) throw new Error(`Missing static build tool for variant: ${variant.id}`)

    for (let round = 0; round < rounds; round++) {
      console.log(`Measuring build performance for ${variant.label}, round ${round + 1}/${rounds}`)
      const workspace = resolve(
        benchmarkRoot,
        '.results',
        'build-performance',
        'workspaces',
        variant.id,
        `round-${round}`
      )

      await prepareStaticWorkspace(workspace, variant.fixtureId, tool)
      const cold = await runPreparedStaticBuild(workspace, variant.fixtureId, tool)
      const repeat = await runPreparedStaticBuild(workspace, variant.fixtureId, tool)

      samples.push(
        {
          metricId: 'cold-build-ms',
          variantId: variant.id,
          round,
          value: cold.elapsedMs
        },
        {
          metricId: 'repeat-build-ms',
          variantId: variant.id,
          round,
          value: repeat.elapsedMs
        }
      )

      if (round === rounds - 1) {
        artifacts.push(...repeat.artifacts)
      }
    }
  }

  const metricUnits = new Map(metrics.map((metric) => [metric.id, metric.unit]))

  return {
    schemaVersion: 1,
    suite: 'build-performance',
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
      'This suite measures production command elapsed time, not watch mode, HMR, browser parse, style recalculation, or interaction cost.',
      'Repeat production build means a second command execution in the same temp workspace; it is not a long-running watch rebuild.',
      'Build timings are advisory and should be compared with package versions, machine details, and raw samples.'
    ],
    artifacts
  }
}

function getBuildRounds() {
  const value = Number(process.env.BENCHMARK_ROUNDS || 3)
  if (!Number.isFinite(value) || value < 1) return 3
  return Math.floor(value)
}

describe('build performance', () => {
  bench('write build performance report', async () => {
    await writeBuildPerformanceReportOnce()
  }, benchOptions)
})
