import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { bench, describe } from 'vitest'
import { benchmarkFixtures } from '../fixtures/manifest'
import { staticFixtureIds } from '../fixtures/static'
import {
  compilerDiagnosticMetricIds,
  createCompilerDiagnosticVariants,
  type CompilerDiagnosticResult
} from '../shared/compiler-diagnostics'
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

const metrics: BenchmarkMetric[] = compilerDiagnosticMetricIds.map((id) => ({
  id,
  ...createMetricMetadata(id)
}))

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
      '@master/css-tooling/scanner',
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
      'This suite is diagnostic and does not replace end-user production command timing from build-performance.',
      'Compiler diagnostics instrument internal source modules without adding package exports or public APIs.',
      'The diagnostic extraction path must produce the same final CSS SHA-256 as production createExtractedCSS before numbers are reported.',
      'Do not use diagnostic numbers as permission to change directive semantics, generated CSS, cascade order, source detection, hydration, or public behavior.'
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

function createMetricMetadata(id: string): Omit<BenchmarkMetric, 'id'> {
  return {
    label: toMetricLabel(id),
    unit: getMetricUnit(id),
    description: toMetricDescription(id)
  }
}

function getMetricUnit(id: string): BenchmarkMetricUnit {
  if (id.endsWith('-bytes')) return 'B'
  if (id.endsWith('-count')) return 'count'
  return 'ms'
}

function toMetricLabel(id: string) {
  return id
    .replace(/^master-internal-/, 'Master internal ')
    .replace(/^outer-/, 'Outer ')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function toMetricDescription(id: string) {
  if (id.startsWith('master-internal-')) {
    return 'Compiler lowering metric collected while compiling the @master/css package source.'
  }
  if (id.startsWith('outer-')) {
    return 'Compiler lowering metric collected while finalizing the extracted stylesheet manifest.'
  }
  if (id === 'production-create-extracted-css-ms') {
    return 'Time spent in the production createExtractedCSS path after scanner setup.'
  }
  if (id === 'diagnostic-compiler-total-ms') {
    return 'Total elapsed time for the benchmark-local compiler diagnostic extraction path.'
  }
  return 'Compiler diagnostic metric.'
}

describe('compiler diagnostics', () => {
  bench('write compiler diagnostics report', async () => {
    await writeCompilerDiagnosticsReportOnce()
  }, benchOptions)
})
