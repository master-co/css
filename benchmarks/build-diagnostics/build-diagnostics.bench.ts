import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import { bench, describe } from 'vitest'
import { benchmarkFixtures } from '../fixtures/manifest'
import { staticFixtureIds } from '../fixtures/static'
import {
  buildDiagnosticMetricIds,
  createBuildDiagnosticVariants,
  type BuildDiagnosticResult
} from '../shared/build-diagnostics'
import { collectEnvironment, collectPackageVersions } from '../shared/environment'
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

const metricMetadata: Record<typeof buildDiagnosticMetricIds[number], Omit<BenchmarkMetric, 'id'>> = {
  'total-diagnostic-ms': {
    label: 'Total diagnostic duration',
    unit: 'ms',
    description: 'Total elapsed time for the diagnostic runner path.'
  },
  'generated-css-raw-bytes': {
    label: 'Generated CSS raw bytes',
    unit: 'B',
    description: 'Raw bytes of diagnostic generated CSS.'
  },
  'generated-css-gzip-bytes': {
    label: 'Generated CSS gzip bytes',
    unit: 'B',
    description: 'Gzip bytes of diagnostic generated CSS.'
  },
  'generated-css-brotli-bytes': {
    label: 'Generated CSS brotli bytes',
    unit: 'B',
    description: 'Brotli bytes of diagnostic generated CSS.'
  },
  'source-file-count': {
    label: 'Source files scanned',
    unit: 'count',
    description: 'Number of fixture source files scanned by the diagnostic path.'
  },
  'css-entry-count': {
    label: 'CSS entries',
    unit: 'count',
    description: 'Number of managed CSS entries used by the diagnostic path.'
  },
  'cli-scanner-init-ms': {
    label: 'CLI scanner init',
    unit: 'ms',
    description: 'Time spent initializing the CSS scanner in the CLI-equivalent path.'
  },
  'cli-css-entry-register-ms': {
    label: 'CLI CSS entry registration',
    unit: 'ms',
    description: 'Time spent finding and registering managed CSS entries.'
  },
  'cli-source-glob-ms': {
    label: 'CLI source glob',
    unit: 'ms',
    description: 'Time spent resolving CLI source file patterns.'
  },
  'cli-source-scan-ms': {
    label: 'CLI source scan',
    unit: 'ms',
    description: 'Time spent scanning fixture source files.'
  },
  'cli-css-extraction-ms': {
    label: 'CLI CSS extraction',
    unit: 'ms',
    description: 'Time spent creating extracted Master CSS.'
  },
  'cli-file-write-ms': {
    label: 'CLI file write',
    unit: 'ms',
    description: 'Time spent writing diagnostic CSS output.'
  },
  'vite-baseline-build-ms': {
    label: 'Vite baseline build',
    unit: 'ms',
    description: 'Vite production build time for the fixture without Master CSS plugin work.'
  },
  'vite-total-build-ms': {
    label: 'Vite total build',
    unit: 'ms',
    description: 'Total Vite production build time with instrumented Master CSS plugin work.'
  },
  'vite-master-scanner-init-ms': {
    label: 'Vite scanner init',
    unit: 'ms',
    description: 'Time spent initializing the Master CSS scanner during Vite config resolution.'
  },
  'vite-master-html-scan-ms': {
    label: 'Vite HTML scan',
    unit: 'ms',
    description: 'Time spent scanning transformed HTML.'
  },
  'vite-master-module-scan-ms': {
    label: 'Vite module scan',
    unit: 'ms',
    description: 'Time spent scanning transformed Vite modules.'
  },
  'vite-master-style-entry-ms': {
    label: 'Vite style entry',
    unit: 'ms',
    description: 'Time spent handling Master CSS style entry transforms and virtual CSS loads.'
  },
  'vite-master-generate-bundle-ms': {
    label: 'Vite bundle CSS extraction',
    unit: 'ms',
    description: 'Time spent extracting generated CSS and splicing it into the final CSS bundle.'
  }
}

const metrics: BenchmarkMetric[] = buildDiagnosticMetricIds.map((id) => ({
  id,
  ...metricMetadata[id]
}))

let reportPromise: Promise<number> | undefined

async function writeBuildDiagnosticsReportOnce() {
  if (!reportPromise) {
    reportPromise = (async () => {
      const startedAt = performance.now()
      const report = await createBuildDiagnosticsReport()
      const output = await writeBenchmarkReport(report)

      console.log(`Wrote build diagnostics report JSON to ${output.jsonFile}`)
      console.log(`Wrote build diagnostics report Markdown to ${output.markdownFile}`)

      return performance.now() - startedAt
    })()
  }

  return reportPromise
}

async function createBuildDiagnosticsReport(): Promise<BenchmarkReport> {
  validateFixtures(benchmarkFixtures)
  const variants = createBuildDiagnosticVariants(staticFixtureIds)
  const samples: BenchmarkSample[] = []
  const artifacts = []
  const rounds = getDiagnosticRounds()

  for (const variant of variants) {
    const toolId = variant.id.endsWith('master-cli-diagnostic')
      ? 'master-cli-diagnostic'
      : 'master-vite-diagnostic'

    for (let round = 0; round < rounds; round++) {
      console.log(`Measuring build diagnostics for ${variant.label}, round ${round + 1}/${rounds}`)
      const workspace = resolve(
        benchmarkRoot,
        '.results',
        'build-diagnostics',
        'workspaces',
        variant.id,
        `round-${round}`
      )
      const result = await runBuildDiagnosticInChild({
        workspace,
        fixtureId: variant.fixtureId,
        toolId,
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
    suite: 'build-diagnostics',
    generatedAt: new Date().toISOString(),
    environment: collectEnvironment(),
    packages: await collectPackageVersions([
      '@master/css',
      '@master/css-cli',
      '@master/css-compiler',
      '@master/css-tooling/scanner',
      '@master/css-compiler/stylesheet',
      '@master/css-vite',
      'fast-glob',
      'vite'
    ]),
    fixtures: getStaticBenchmarkFixtures(benchmarkFixtures),
    adapters: staticBenchmarkAdapters,
    variants,
    metrics,
    samples,
    summary: summarizeReportSamples(samples, metricUnits),
    limits: [
      'This suite is diagnostic and does not replace end-user production command timing from build-performance.',
      'CLI diagnostics mirror the scan and extraction pipeline in-process, so child-process startup and package loader cost are intentionally excluded.',
      'Vite diagnostics instrument Master CSS plugin hooks and include a Vite baseline metric for context.',
      'Do not use diagnostic numbers as permission to change CSS output, cascade order, source detection, hydration, or public behavior.'
    ],
    artifacts
  }
}

async function runBuildDiagnosticInChild(options: {
  workspace: string
  fixtureId: string
  toolId: string
  variantId: string
  round: number
}): Promise<BuildDiagnosticResult> {
  const output = resolve(options.workspace, 'diagnostic-result.json')
  await runCommand(process.execPath, [
    '--import',
    'tsx',
    'build-diagnostics/run-diagnostic.ts',
    '--workspace',
    options.workspace,
    '--fixture-id',
    options.fixtureId,
    '--tool-id',
    options.toolId,
    '--variant-id',
    options.variantId,
    '--round',
    String(options.round),
    '--output',
    output
  ], benchmarkRoot)

  return JSON.parse(await readFile(output, 'utf8')) as BuildDiagnosticResult
}

function getDiagnosticRounds() {
  const value = Number(process.env.BENCHMARK_ROUNDS || 3)
  if (!Number.isFinite(value) || value < 1) return 3
  return Math.floor(value)
}

describe('build diagnostics', () => {
  bench('write build diagnostics report', async () => {
    await writeBuildDiagnosticsReportOnce()
  }, benchOptions)
})
