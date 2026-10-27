import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { test, describe } from 'vitest'
import { stylesheetDiagnosticMetrics, stylesheetDiagnosticLimits } from '../shared/stylesheet-diagnostic-metrics'
import { benchmarkFixtures } from '../fixtures/manifest'
import { staticFixtureIds } from '../fixtures/static'
import {
  createCompilerDiagnosticVariants,
  type CompilerDiagnosticResult
} from '../shared/compiler-diagnostics'
import { collectEnvironment, collectPackageVersions } from '../shared/environment'
import { validateFixtures } from '../shared/fixtures'
import { benchmarkRoot, runCommand } from '../shared/runner'
import { writeBenchmarkReport } from '../shared/report'
import { summarizeReportSamples } from '../shared/stats'
import { getStaticBenchmarkFixtures, staticBenchmarkAdapters } from '../shared/static-build'
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

const metrics = stylesheetDiagnosticMetrics

let reportPromise: Promise<number> | undefined

async function writeCompilerDiagnosticsReportOnce() {
  if (!reportPromise) {
    reportPromise = (async () => {
      const startedAt = performance.now()
      const report = await createCompilerDiagnosticsReport()
      const output = await writeBenchmarkReport(report)

      console.log(`Wrote compiler diagnostics report JSON to ${output.jsonFile}`)
      console.log(`Wrote compiler diagnostics report Markdown to ${output.markdownFile}`)

      return performance.now() - startedAt
    })()
  }

  return reportPromise
}

async function createCompilerDiagnosticsReport(): Promise<BenchmarkReport> {
  validateFixtures(benchmarkFixtures)
  const variants = createCompilerDiagnosticVariants(staticFixtureIds)
  const samples: BenchmarkSample[] = []
  const artifacts = []
  const rounds = getDiagnosticRounds()

  for (const variant of variants) {
    for (let round = 0; round < rounds; round++) {
      console.log(`Measuring compiler diagnostics for ${variant.label}, round ${round + 1}/${rounds}`)
      const workspace = resolve(
        benchmarkRoot,
        '.results',
        'compiler-diagnostics',
        'workspaces',
        variant.id,
        `round-${round}`
      )
      const result = await runCompilerDiagnosticInChild({
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
    suite: 'compiler-diagnostics',
    generatedAt: new Date().toISOString(),
    environment: collectEnvironment(),
    packages: await collectPackageVersions([
      '@master/css',
      '@master/css-compiler',
      '@master/css',
      '@master/css-compiler',
      '@master/css-tooling/scanner/node',
      '@master/css-tooling/source',
      '@master/css-compiler/stylesheet',
      'fast-glob'
    ]),
    fixtures: getStaticBenchmarkFixtures(benchmarkFixtures),
    adapters: staticBenchmarkAdapters,
    variants,
    metrics,
    samples,
    summary: summarizeReportSamples(samples, metricUnits),
    limits: [
      'This suite measures public API operation boundaries and does not replace end-user command timing.',
      ...stylesheetDiagnosticLimits
    ],
    artifacts
  }
}

async function runCompilerDiagnosticInChild(options: {
  workspace: string
  fixtureId: string
  variantId: string
  round: number
}): Promise<CompilerDiagnosticResult> {
  const output = resolve(options.workspace, 'diagnostic-result.json')
  await runCommand(process.execPath, [
    '--import',
    'tsx',
    'compiler-diagnostics/run-diagnostic.ts',
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

  return JSON.parse(await readFile(output, 'utf8')) as CompilerDiagnosticResult
}

function getDiagnosticRounds() {
  const value = Number(process.env.BENCHMARK_ROUNDS || 3)
  if (!Number.isFinite(value) || value < 1) return 3
  return Math.floor(value)
}

describe('compiler diagnostics', () => {
  test('write compiler diagnostics report', { timeout: 900_000 }, async ({ bench }) => {
    await bench('write compiler diagnostics report', async () => {
      await writeCompilerDiagnosticsReportOnce()
    }).run(benchOptions)
  })
})
