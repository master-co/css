import { chromium, type Browser } from '@playwright/test'
import { benchmarkFixtures } from '../fixtures/manifest'
import {
  createMasterDeliveryModePage,
  createMasterDeliveryModeVariantId,
  createMasterDeliveryModeVariants,
  deliveryModeDescriptors,
  getMasterDeliveryModeAdapters,
  masterDeliveryModeFixtureIds,
  masterDeliveryModeMetrics,
  measureMasterDeliveryMode,
  type DeliveryModeId
} from './delivery-modes'
import { collectEnvironment, collectPackageVersions } from './environment'
import { validateFixtures } from './fixtures'
import { writeBenchmarkReport } from './report'
import { summarizeReportSamples } from './stats'
import type { BenchmarkArtifact, BenchmarkMetricUnit, BenchmarkReport, BenchmarkSample } from './types'

export async function writeMasterDeliveryModeReport() {
  const report = await createMasterDeliveryModeReport()
  return writeBenchmarkReport(report)
}

async function createMasterDeliveryModeReport(): Promise<BenchmarkReport> {
  validateFixtures(benchmarkFixtures)

  const variants = createMasterDeliveryModeVariants()
  const samples: BenchmarkSample[] = []
  const artifacts: BenchmarkArtifact[] = []
  const rounds = getMasterDeliveryModeRounds()
  console.log('Launching Chromium for Master delivery mode benchmark')
  const browser = await chromium.launch({ headless: true })
  const browserVersion = browser.version()

  try {
    for (const fixtureId of masterDeliveryModeFixtureIds) {
      for (const mode of deliveryModeDescriptors) {
        const variantId = createMasterDeliveryModeVariantId(fixtureId, mode.id)
        console.log(`Preparing Master delivery mode page for ${variantId}`)
        const page = await createMasterDeliveryModePage({
          fixtureId,
          modeId: mode.id,
          variantId
        })

        samples.push(...page.samples)
        artifacts.push(...page.artifacts)
        await collectDeliveryModeSamples({
          browser,
          pageRoot: page.root,
          variantId,
          modeId: mode.id,
          rounds,
          samples,
          artifacts
        })
      }
    }
  } finally {
    await browser.close()
  }

  const metricUnits = new Map(masterDeliveryModeMetrics.map((metric) => [metric.id, metric.unit as BenchmarkMetricUnit]))

  return {
    schemaVersion: 1,
    suite: 'master-delivery-modes',
    generatedAt: new Date().toISOString(),
    environment: collectEnvironment(),
    browser: {
      name: 'Chromium',
      version: browserVersion
    },
    packages: await collectPackageVersions([
      '@master/css',
      '@master/css-cli',
      '@master/css-runtime',
      '@master/css-server',
      '@master/css-preset',
      '@playwright/test',
      'tailwindcss',
      '@tailwindcss/cli'
    ]),
    fixtures: getMasterDeliveryModeFixtures(),
    adapters: getMasterDeliveryModeAdapters(),
    variants,
    metrics: masterDeliveryModeMetrics,
    samples,
    summary: summarizeReportSamples(samples, metricUnits),
    limits: [
      'This suite measures local Chromium initial payload, page load, and Master CSS runtime/progressive adoption cost only.',
      'Master static and Tailwind static variants use CLI-generated external CSS from equivalent rendered fixture intent, not identical class strings.',
      'Master runtime uses the built browser runtime bundle and default manifest JSON; no upfront generated CSS is delivered.',
      'Master progressive uses @master/css-server to inline style#master-css and hydration manifest, then the built browser runtime adopts that CSS.',
      'Progressive fallback is reported as progressive-adopted = 0 so fixture-specific hydration issues remain visible in the report.',
      'This suite does not measure post-load mutation, route transition, HMR, dev workflow, Vite injection cost, CDN behavior, or public real-world page variance.',
      'Trace-derived event names can change across Chromium versions, so raw trace artifacts are kept for review before publishing public conclusions.'
    ],
    artifacts
  }
}

async function collectDeliveryModeSamples(options: {
  browser: Browser
  pageRoot: string
  variantId: string
  modeId: DeliveryModeId
  rounds: number
  samples: BenchmarkSample[]
  artifacts: BenchmarkArtifact[]
}) {
  for (let round = 0; round < options.rounds; round++) {
    console.log(`Measuring Master delivery mode for ${options.variantId}, round ${round + 1}/${options.rounds}`)
    const result = await measureMasterDeliveryMode({
      browser: options.browser,
      pageRoot: options.pageRoot,
      variantId: options.variantId,
      modeId: options.modeId,
      round
    })

    options.samples.push(...result.samples)
    if (round === options.rounds - 1) options.artifacts.push(...result.artifacts)
  }
}

function getMasterDeliveryModeFixtures() {
  return masterDeliveryModeFixtureIds.map((id) => {
    const fixture = benchmarkFixtures.find((candidate) => candidate.id === id)
    if (!fixture) throw new Error(`Missing benchmark fixture: ${id}`)
    return fixture
  })
}

function getMasterDeliveryModeRounds() {
  const value = Number(process.env.MASTER_DELIVERY_MODE_ROUNDS || process.env.BENCHMARK_ROUNDS || 3)
  if (!Number.isFinite(value) || value < 1) return 3
  return Math.floor(value)
}
