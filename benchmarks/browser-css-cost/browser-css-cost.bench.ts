import { chromium, type Browser } from '@playwright/test'
import { bench, describe } from 'vitest'
import { benchmarkFixtures } from '../fixtures/manifest'
import {
  browserCostCacheModes,
  browserCostCSSVolumeLevels,
  browserCostFixtureIds,
  browserCostMetrics,
  browserCostStressDOMScales,
  createBrowserCostCSSVolumePage,
  createBrowserCostCSSVolumeSamples,
  createBrowserCostCSSVolumeVariantId,
  createBrowserCostStressDOMPage,
  createBrowserCostStressDOMSamples,
  createBrowserCostStressDOMVariantId,
  createBrowserCostVariants,
  getBrowserCostAdapters,
  measureBrowserCost,
  type BrowserCacheMode
} from '../shared/browser-cost'
import { collectEnvironment, collectPackageVersions } from '../shared/environment'
import { validateFixtures } from '../shared/fixtures'
import { writeBenchmarkReport } from '../shared/report'
import { summarizeReportSamples } from '../shared/stats'
import type { BenchmarkArtifact, BenchmarkMetricUnit, BenchmarkReport, BenchmarkSample } from '../shared/types'

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

async function writeBrowserCSSCostReportOnce() {
  if (!reportPromise) {
    reportPromise = (async () => {
      const startedAt = performance.now()
      const report = await createBrowserCSSCostReport()
      const output = await writeBenchmarkReport(report)

      console.log(`Wrote browser CSS cost report JSON to ${output.jsonFile}`)
      console.log(`Wrote browser CSS cost report Markdown to ${output.markdownFile}`)

      return performance.now() - startedAt
    })()
  }

  return reportPromise
}

async function createBrowserCSSCostReport(): Promise<BenchmarkReport> {
  validateFixtures(benchmarkFixtures)

  const variants = createBrowserCostVariants()
  const samples: BenchmarkSample[] = []
  const artifacts = []
  const rounds = getBrowserCostRounds()
  const warmupRounds = getBrowserCostWarmupRounds()
  const browser = await chromium.launch({ headless: true })
  const browserVersion = browser.version()

  try {
    for (const level of browserCostCSSVolumeLevels) {
      for (const cacheMode of browserCostCacheModes) {
        const variantId = createBrowserCostCSSVolumeVariantId(level.id, cacheMode)
        console.log(`Preparing CSS rule volume browser cost page for ${variantId}`)
        const page = await createBrowserCostCSSVolumePage({
          level,
          variantId
        })

        samples.push(...createBrowserCostCSSVolumeSamples(variantId, page.css))
        artifacts.push(...page.artifacts)
        await collectBrowserCostSamples({
          browser,
          pageRoot: page.root,
          variantId,
          cacheMode,
          rounds,
          warmupRounds,
          samples,
          artifacts
        })
      }
    }

    for (const scale of browserCostStressDOMScales) {
      for (const cacheMode of browserCostCacheModes) {
        const variantId = createBrowserCostStressDOMVariantId(scale.id, cacheMode)
        console.log(`Preparing browser CSS cost page for ${variantId}`)
        const page = await createBrowserCostStressDOMPage({
          scale,
          variantId
        })

        samples.push(...createBrowserCostStressDOMSamples(variantId, scale, page.css))
        artifacts.push(...page.artifacts)
        await collectBrowserCostSamples({
          browser,
          pageRoot: page.root,
          variantId,
          cacheMode,
          rounds,
          warmupRounds,
          samples,
          artifacts
        })
      }
    }
  } finally {
    await browser.close()
  }

  const metricUnits = new Map(browserCostMetrics.map((metric) => [metric.id, metric.unit as BenchmarkMetricUnit]))

  return {
    schemaVersion: 1,
    suite: 'browser-css-cost',
    generatedAt: new Date().toISOString(),
    environment: collectEnvironment(),
    browser: {
      name: 'Chromium',
      version: browserVersion
    },
    packages: await collectPackageVersions([
      '@playwright/test',
      'css-tree'
    ]),
    fixtures: getBrowserCostFixtures(),
    adapters: getBrowserCostAdapters(),
    variants,
    metrics: browserCostMetrics,
    samples,
    summary: summarizeReportSamples(samples, metricUnits),
    limits: [
      'This suite primarily measures Chromium load-time browser costs as deterministic CSS rule volume grows while visible DOM stays fixed.',
      'Neutral CSS volume variants are browser-only controls; they are not a Master CSS versus Tailwind CSS comparison.',
      'Stress DOM variants are secondary diagnostics for DOM scaling with fixed CSS and should not be used as the main delivery-mode decision input.',
      'DOM control variants record repeated item count, measured DOM node count, fixed CSS bytes, and fixed CSS structure so CSS and DOM axes can be separated.',
      'This suite does not measure interaction mutation cost, runtime rule generation, HMR, or real application JavaScript.',
      'Trace-derived event names can change across Chromium versions, so raw trace artifacts are kept for review before publishing public conclusions.',
      'Cold-cache and warm-cache variants use fresh browser contexts per measured sample; warm-cache samples prime the context before tracing.'
    ],
    artifacts
  }
}

async function collectBrowserCostSamples(options: {
  browser: Browser
  pageRoot: string
  variantId: string
  cacheMode: BrowserCacheMode
  rounds: number
  warmupRounds: number
  samples: BenchmarkSample[]
  artifacts: BenchmarkArtifact[]
}) {
  for (let warmupRound = 0; warmupRound < options.warmupRounds; warmupRound++) {
    console.log(`Warming browser CSS cost for ${options.variantId}, warmup ${warmupRound + 1}/${options.warmupRounds}`)
    await measureBrowserCost({
      browser: options.browser,
      pageRoot: options.pageRoot,
      variantId: options.variantId,
      cacheMode: options.cacheMode,
      round: -warmupRound - 1
    })
  }

  for (let round = 0; round < options.rounds; round++) {
    console.log(`Measuring browser CSS cost for ${options.variantId}, round ${round + 1}/${options.rounds}`)
    const result = await measureBrowserCost({
      browser: options.browser,
      pageRoot: options.pageRoot,
      variantId: options.variantId,
      cacheMode: options.cacheMode,
      round
    })

    options.samples.push(...result.samples)
    if (round === options.rounds - 1) options.artifacts.push(...result.artifacts)
  }
}

function getBrowserCostFixtures() {
  return browserCostFixtureIds.map((id) => {
    const fixture = benchmarkFixtures.find((candidate) => candidate.id === id)
    if (!fixture) throw new Error(`Missing benchmark fixture: ${id}`)
    return fixture
  })
}

function getBrowserCostRounds() {
  const value = Number(process.env.BROWSER_COST_ROUNDS || process.env.BENCHMARK_ROUNDS || 3)
  if (!Number.isFinite(value) || value < 1) return 3
  return Math.floor(value)
}

function getBrowserCostWarmupRounds() {
  const value = Number(process.env.BROWSER_COST_WARMUP_ROUNDS || 1)
  if (!Number.isFinite(value) || value < 0) return 1
  return Math.floor(value)
}

describe('browser CSS cost', () => {
  bench('write browser CSS cost report', async () => {
    await writeBrowserCSSCostReportOnce()
  }, benchOptions)
})
