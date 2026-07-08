import { bench, describe } from 'vitest'
import { benchmarkAdapters, benchmarkFixtures } from '../fixtures/manifest'
import { collectEnvironment, collectPackageVersions } from '../shared/environment'
import { validateFixtures } from '../shared/fixtures'
import { writeBenchmarkReport } from '../shared/report'
import { summarizeReportSamples } from '../shared/stats'
import type { BenchmarkMetric, BenchmarkReport, BenchmarkSample, BenchmarkVariant } from '../shared/types'

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
    id: 'smoke-duration',
    label: 'Smoke duration',
    unit: 'ms',
    description: 'Deterministic fake timing used to validate summary output.'
  },
  {
    id: 'smoke-bytes',
    label: 'Smoke bytes',
    unit: 'B',
    description: 'Deterministic fake byte size used to validate summary output.'
  }
]

const variants: BenchmarkVariant[] = [
  { id: 'minimal-master-runtime', fixtureId: 'minimal', adapterId: 'master-runtime', label: 'Minimal / Master runtime' },
  { id: 'docs-master-static', fixtureId: 'docs', adapterId: 'master-static', label: 'Docs / Master static' },
  { id: 'dashboard-master-progressive', fixtureId: 'dashboard', adapterId: 'master-progressive', label: 'Dashboard / Master progressive' },
  { id: 'dynamic-tailwind-cli', fixtureId: 'dynamic', adapterId: 'tailwind-cli', label: 'Dynamic / Tailwind CLI' },
  { id: 'stress-css-tailwind-vite', fixtureId: 'stress-css', adapterId: 'tailwind-vite', label: 'Stress CSS / Tailwind Vite' },
  { id: 'stress-css-browser-css', fixtureId: 'stress-css', adapterId: 'browser-css', label: 'Stress CSS / Browser CSS' },
  { id: 'stress-dom-browser-dom', fixtureId: 'stress-dom', adapterId: 'browser-dom', label: 'Stress DOM / Browser DOM' }
]

let smokePromise: Promise<number> | undefined

async function writeSmokeReportOnce() {
  if (!smokePromise) {
    smokePromise = (async () => {
      const startedAt = performance.now()
      const report = await createSmokeReport()
      const output = await writeBenchmarkReport(report)

      console.log(`Wrote report smoke JSON to ${output.jsonFile}`)
      console.log(`Wrote report smoke Markdown to ${output.markdownFile}`)

      return performance.now() - startedAt
    })()
  }

  return smokePromise
}

async function createSmokeReport(): Promise<BenchmarkReport> {
  validateFixtures(benchmarkFixtures)
  const samples = createSamples()
  const metricUnits = new Map(metrics.map((metric) => [metric.id, metric.unit]))

  return {
    schemaVersion: 1,
    suite: 'report-smoke',
    generatedAt: new Date().toISOString(),
    environment: collectEnvironment(),
    packages: await collectPackageVersions([
      '@master/css',
      '@master/css-cli',
      '@master/css-runtime',
      'cheerio'
    ]),
    fixtures: benchmarkFixtures,
    adapters: benchmarkAdapters,
    variants,
    metrics,
    samples,
    summary: summarizeReportSamples(samples, metricUnits),
    limits: [
      'Smoke values are deterministic fake data.',
      'This suite validates report shape and writer behavior only.',
      'Do not publish smoke values as benchmark results.'
    ],
    artifacts: []
  }
}

function createSamples(): BenchmarkSample[] {
  const samples: BenchmarkSample[] = []

  variants.forEach((variant, variantIndex) => {
    for (let round = 0; round < 5; round++) {
      samples.push({
        metricId: 'smoke-duration',
        variantId: variant.id,
        round,
        value: 10 + variantIndex * 3 + round * 0.5
      })
      samples.push({
        metricId: 'smoke-bytes',
        variantId: variant.id,
        round,
        value: 1000 + variantIndex * 250 + round * 25
      })
    }
  })

  return samples
}

describe('report smoke', () => {
  bench('write normalized benchmark report', async () => {
    await writeSmokeReportOnce()
  }, benchOptions)
})
