import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { bench, describe } from 'vitest'
import { benchmarkFixtures } from '../fixtures/manifest'
import { staticFixtureIds } from '../fixtures/static'
import { collectEnvironment, collectPackageVersions } from '../shared/environment'
import { validateFixtures } from '../shared/fixtures'
import { benchmarkRoot, runCommand } from '../shared/runner'
import { writeBenchmarkReport } from '../shared/report'
import { summarizeReportSamples } from '../shared/stats'
import { getStaticBenchmarkFixtures, staticBenchmarkAdapters } from '../shared/static-build'
import {
  createStartupDiagnosticVariants,
  startupDiagnosticMetricIds,
  type StartupDiagnosticResult,
  type StartupDiagnosticToolId
} from '../shared/startup-diagnostics'
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

const metrics: BenchmarkMetric[] = startupDiagnosticMetricIds.map((id) => ({
  id,
  label: toMetricLabel(id),
  unit: getMetricUnit(id),
  description: toMetricDescription(id)
}))

let reportPromise: Promise<number> | undefined

async function writeStartupDiagnosticsReportOnce() {
  if (!reportPromise) {
    reportPromise = (async () => {
      const startedAt = performance.now()
      const report = await createStartupDiagnosticsReport()
      const output = await writeBenchmarkReport(report)

      console.log(`Wrote startup diagnostics report JSON to ${output.jsonFile}`)
      console.log(`Wrote startup diagnostics report Markdown to ${output.markdownFile}`)

      return performance.now() - startedAt
    })()
  }

  return reportPromise
}

async function createStartupDiagnosticsReport(): Promise<BenchmarkReport> {
  validateFixtures(benchmarkFixtures)
  const variants = createStartupDiagnosticVariants(staticFixtureIds)
  const samples: BenchmarkSample[] = []
  const artifacts = []
  const rounds = getDiagnosticRounds()

  for (const variant of variants) {
    const toolId: StartupDiagnosticToolId = variant.id.endsWith('master-cli-startup-diagnostic')
      ? 'master-cli-startup-diagnostic'
      : 'master-vite-startup-diagnostic'

    for (let round = 0; round < rounds; round++) {
      console.log(`Measuring startup diagnostics for ${variant.label}, round ${round + 1}/${rounds}`)
      const workspace = resolve(
        benchmarkRoot,
        '.results',
        'startup-diagnostics',
        'workspaces',
        variant.id,
        `round-${round}`
      )
      const result = await runStartupDiagnosticInChild({
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
    suite: 'startup-diagnostics',
    generatedAt: new Date().toISOString(),
    environment: collectEnvironment(),
    packages: await collectPackageVersions([
      '@master/css',
      '@master/css-cli',
      '@master/css-project',
      '@master/css-scanner',
      '@master/css-stylesheet',
      '@master/css.vite',
      'chokidar',
      'commander',
      'consola',
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
      'Module import probes run in separate child processes, so each import metric is a cold diagnostic approximation, not an additive flamegraph.',
      'CLI runProgram probes use the built package core entry to split import and execution while the full CLI command metric still uses the published bin entry.',
      'Vite diagnostics include a baseline command metric because most full Vite build time is unrelated to Master CSS plugin work.',
      'Do not use diagnostic numbers as permission to change CSS output, cascade order, source detection, hydration, or public behavior.'
    ],
    artifacts
  }
}

async function runStartupDiagnosticInChild(options: {
  workspace: string
  fixtureId: string
  toolId: StartupDiagnosticToolId
  variantId: string
  round: number
}): Promise<StartupDiagnosticResult> {
  const output = resolve(options.workspace, 'diagnostic-result.json')
  await runCommand(process.execPath, [
    '--import',
    'tsx',
    'startup-diagnostics/run-diagnostic.ts',
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

  return JSON.parse(await readFile(output, 'utf8')) as StartupDiagnosticResult
}

function getDiagnosticRounds() {
  const value = Number(process.env.BENCHMARK_ROUNDS || 3)
  if (!Number.isFinite(value) || value < 1) return 3
  return Math.floor(value)
}

function getMetricUnit(id: string): BenchmarkMetricUnit {
  if (id.endsWith('-bytes')) return 'B'
  if (id.endsWith('-count')) return 'count'
  return 'ms'
}

function toMetricLabel(id: string) {
  return id
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function toMetricDescription(id: string) {
  if (id.includes('import')) return 'Cold child-process module import timing for startup diagnostics.'
  if (id.includes('command')) return 'Full child-process command timing measured by the benchmark parent process.'
  if (id.includes('probe')) return 'Benchmark-local probe timing used to split startup and execution costs.'
  if (id.includes('vite-master')) return 'Instrumented Master CSS Vite plugin startup or hook timing.'
  if (id.includes('generated-css')) return 'Generated CSS artifact size from the diagnostic output.'
  return 'Startup diagnostic metric.'
}

describe('startup diagnostics', () => {
  bench('write startup diagnostics report', async () => {
    await writeStartupDiagnosticsReportOnce()
  }, benchOptions)
})
