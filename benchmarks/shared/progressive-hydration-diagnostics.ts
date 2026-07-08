import { chromium, type Browser } from '@playwright/test'
import { benchmarkAdapters, benchmarkFixtures } from '../fixtures/manifest'
import {
  createMasterDeliveryModePage,
  createMasterDeliveryModeVariantId,
  masterDeliveryModeFixtureIds,
  measureProgressiveHydrationDiagnostics
} from './delivery-modes'
import { collectEnvironment, collectPackageVersions } from './environment'
import { validateFixtures } from './fixtures'
import { writeBenchmarkReport } from './report'
import { summarizeReportSamples } from './stats'
import type {
  BenchmarkAdapter,
  BenchmarkArtifact,
  BenchmarkMetric,
  BenchmarkMetricUnit,
  BenchmarkReport,
  BenchmarkSample,
  BenchmarkVariant
} from './types'

const progressiveHydrationDiagnosticMetrics = [
  {
    id: 'progressive-adopted',
    label: 'Progressive adopted',
    unit: 'count',
    description: '1 when runtime successfully adopted the server-rendered style#master-css, otherwise 0.'
  },
  {
    id: 'hydration-manifest-rule-count',
    label: 'Hydration manifest rules',
    unit: 'count',
    description: 'Generated rules listed in the injected progressive hydration manifest.'
  },
  {
    id: 'cssom-top-level-rule-count',
    label: 'CSSOM top-level rules',
    unit: 'count',
    description: 'Top-level CSSOM rules in style#master-css before or after runtime fallback.'
  },
  {
    id: 'cssom-layer-rule-count',
    label: 'CSSOM layer rules',
    unit: 'count',
    description: 'Nested CSSOM rules inside top-level layer/grouping rules.'
  },
  {
    id: 'runtime-generated-rule-count',
    label: 'Runtime style rules',
    unit: 'count',
    description: 'Recursive CSSOM rule count in style#master-css after runtime observe/hydration.'
  },
  {
    id: 'runtime-style-raw-bytes',
    label: 'Runtime style raw bytes',
    unit: 'B',
    description: 'Raw bytes of style#master-css after runtime observe/hydration.'
  },
  {
    id: 'connected-class-count',
    label: 'Connected classes',
    unit: 'count',
    description: 'Unique class names connected in the rendered page when runtime observe completes.'
  },
  {
    id: 'missing-hydrated-class-count',
    label: 'Missing hydrated classes',
    unit: 'count',
    description: 'Connected class names not represented in runtime classUtilities after observe/hydration.'
  }
] satisfies BenchmarkMetric[]

export async function writeProgressiveHydrationDiagnosticsReport() {
  const report = await createProgressiveHydrationDiagnosticsReport()
  return writeBenchmarkReport(report)
}

async function createProgressiveHydrationDiagnosticsReport(): Promise<BenchmarkReport> {
  validateFixtures(benchmarkFixtures)

  const variants = createProgressiveHydrationDiagnosticVariants()
  const samples: BenchmarkSample[] = []
  const artifacts: BenchmarkArtifact[] = []
  const rounds = getProgressiveHydrationDiagnosticRounds()
  console.log('Launching Chromium for progressive hydration diagnostics')
  const browser = await chromium.launch({ headless: true })

  try {
    for (const fixtureId of masterDeliveryModeFixtureIds) {
      const variantId = createMasterDeliveryModeVariantId(fixtureId, 'master-progressive')
      console.log(`Preparing progressive hydration diagnostic page for ${variantId}`)
      const page = await createMasterDeliveryModePage({
        fixtureId,
        modeId: 'master-progressive',
        variantId,
        pageSuite: 'progressive-hydration-diagnostics'
      })

      artifacts.push(...page.artifacts)
      await collectProgressiveHydrationDiagnosticSamples({
        browser,
        pageRoot: page.root,
        variantId,
        rounds,
        samples,
        artifacts
      })
    }
  } finally {
    await browser.close()
  }

  const metricUnits = new Map(progressiveHydrationDiagnosticMetrics.map((metric) => [metric.id, metric.unit as BenchmarkMetricUnit]))

  return {
    schemaVersion: 1,
    suite: 'progressive-hydration-diagnostics',
    generatedAt: new Date().toISOString(),
    environment: collectEnvironment(),
    packages: await collectPackageVersions([
      '@master/css',
      '@master/css-runtime',
      '@master/css-server',
      '@master/css-preset',
      '@playwright/test'
    ]),
    fixtures: getProgressiveHydrationDiagnosticFixtures(),
    adapters: getProgressiveHydrationDiagnosticAdapters(),
    variants,
    metrics: progressiveHydrationDiagnosticMetrics,
    samples,
    summary: summarizeReportSamples(samples, metricUnits),
    limits: [
      'This suite diagnoses progressive hydration adoption only; it does not optimize or change runtime, server, compiler, or CSS output behavior.',
      'Only Master CSS progressive delivery is measured, using the same static fixtures as the delivery-mode suite.',
      'Runtime fallback is intentionally recorded instead of failing the suite so fixture-specific causes remain reviewable.',
      'Diagnostic artifacts include server inline CSS, hydration manifest JSON, runtime CSS after observe, screenshots, console warnings, and CSSOM/class counts.',
      'Missing hydrated class count is a diagnostic signal, not a correctness verdict by itself; authored/native classes can require manual review.'
    ],
    artifacts
  }
}

async function collectProgressiveHydrationDiagnosticSamples(options: {
  browser: Browser
  pageRoot: string
  variantId: string
  rounds: number
  samples: BenchmarkSample[]
  artifacts: BenchmarkArtifact[]
}) {
  for (let round = 0; round < options.rounds; round++) {
    console.log(`Measuring progressive hydration diagnostics for ${options.variantId}, round ${round + 1}/${options.rounds}`)
    const result = await measureProgressiveHydrationDiagnostics({
      browser: options.browser,
      pageRoot: options.pageRoot,
      variantId: options.variantId,
      round
    })

    options.samples.push(...result.samples)
    if (round === options.rounds - 1) options.artifacts.push(...result.artifacts)
  }
}

function createProgressiveHydrationDiagnosticVariants(): BenchmarkVariant[] {
  return masterDeliveryModeFixtureIds.map((fixtureId) => ({
    id: createMasterDeliveryModeVariantId(fixtureId, 'master-progressive'),
    fixtureId,
    adapterId: 'master-progressive',
    label: `${fixtureId} / Master CSS progressive hydration`
  }))
}

function getProgressiveHydrationDiagnosticFixtures() {
  return masterDeliveryModeFixtureIds.map((id) => {
    const fixture = benchmarkFixtures.find((candidate) => candidate.id === id)
    if (!fixture) throw new Error(`Missing benchmark fixture: ${id}`)
    return fixture
  })
}

function getProgressiveHydrationDiagnosticAdapters(): BenchmarkAdapter[] {
  return benchmarkAdapters.filter((adapter) => adapter.id === 'master-progressive')
}

function getProgressiveHydrationDiagnosticRounds() {
  const value = Number(process.env.PROGRESSIVE_HYDRATION_DIAGNOSTIC_ROUNDS || process.env.BENCHMARK_ROUNDS || 3)
  if (!Number.isFinite(value) || value < 1) return 3
  return Math.floor(value)
}
