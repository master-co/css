import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { discoverManifestEntries } from '@master/css-compiler/project'
import { createStylesheetCollection } from '@master/css-compiler/stylesheet'
import { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import fg from 'fast-glob'
import { getStaticFixtureSource } from '../fixtures/static'
import { hashBytes, summarizeBytes } from './bytes'
import { measureRelativeArtifact } from './runner'
import { prepareStaticWorkspace, staticBuildTools } from './static-build'
import { stylesheetDiagnosticMetricIds } from './stylesheet-diagnostic-metrics'
import type { BenchmarkArtifact, BenchmarkFixtureId, BenchmarkSample } from './types'

export interface StylesheetDiagnosticResult {
  samples: BenchmarkSample[]
  artifacts: BenchmarkArtifact[]
}

export class StylesheetDiagnosticRecorder {
  readonly values: Record<string, number> = {}
  readonly observations: { metricId: string, startedAt: number, endedAt: number, status: 'ok' | 'error' }[] = []

  constructor(private readonly now: () => number = () => performance.now()) { }

  async time<T>(metricId: string, work: () => T | Promise<T>): Promise<T> {
    const startedAt = this.now()
    let status: 'ok' | 'error' = 'error'
    try {
      const value = await work()
      status = 'ok'
      return value
    } finally {
      const endedAt = this.now()
      this.values[metricId] = (this.values[metricId] || 0) + endedAt - startedAt
      this.observations.push({ metricId, startedAt, endedAt, status })
    }
  }

  set(metricId: string, value: number) { this.values[metricId] = value }

  assertComplete(metricIds: readonly string[] = stylesheetDiagnosticMetricIds) {
    const expected = new Set(metricIds)
    for (const metricId of expected) {
      if (!Object.hasOwn(this.values, metricId)) throw new Error(`Missing diagnostic observation: ${metricId}`)
    }
    for (const [metricId, value] of Object.entries(this.values)) {
      if (!expected.has(metricId) || !Number.isFinite(value) || value < 0) throw new Error(`Invalid diagnostic observation: ${metricId}=${value}`)
    }
  }
}

export async function runStylesheetDiagnostic(options: {
  workspace: string
  fixtureId: BenchmarkFixtureId
  variantId: string
  round: number
}): Promise<StylesheetDiagnosticResult> {
  const { workspace, fixtureId, variantId, round } = options
  const tool = staticBuildTools.find(candidate => candidate.id === 'master-static-cli')
  if (!tool) throw new Error('Missing Master CSS static CLI tool.')
  await prepareStaticWorkspace(workspace, fixtureId, tool)
  const baseManifest = defaultManifestJSON as unknown as MasterCSSManifest
  const scanner = new MasterCSSScanner({ manifest: baseManifest }, workspace)
  const stylesheets = createStylesheetCollection()
  const recorder = new StylesheetDiagnosticRecorder()
  let results: { final: string, generated: string, 'native-only': string }
  try {
    results = await recorder.time('public-pipeline-total-ms', async () => {
      await recorder.time('scanner-init-ms', () => scanner.init())
      scanner.options.verbose = 0
      const entries = await recorder.time('css-entry-discovery-ms', () => discoverManifestEntries({ root: workspace }))
      const entrySources = await recorder.time('css-entry-read-ms', () => Promise.all(entries.map(file => readFile(file, 'utf8'))))
      await recorder.time('stylesheet-registration-ms', async () => {
        for (let index = 0; index < entries.length; index++) {
          await stylesheets.register(scanner, entries[index], entrySources[index], { baseManifest, projectDir: workspace })
        }
      })
      scanner.resetDependencies = [...stylesheets.snapshot().dependencies]
      const sources = await recorder.time('source-glob-ms', () => fg(['index.html'], { cwd: workspace }))
      const contents = await recorder.time('source-read-ms', () => Promise.all(sources.map(file => readFile(resolve(workspace, file), 'utf8'))))
      await recorder.time('source-scan-ms', () => Promise.all(sources.map((file, index) => scanner.scan(file, contents[index]))))
      recorder.set('css-entry-count', entries.length)
      recorder.set('source-file-count', sources.length)
      recorder.set('registered-stylesheet-count', stylesheets.size)
      await recorder.time('scanner-class-collection-ms', () => {
        recorder.set('latent-class-count', scanner.latentClasses.size)
        recorder.set('valid-class-count', scanner.validClasses.size)
        recorder.set('native-class-name-count', scanner.nativeClassNames.size)
        recorder.set('used-native-class-count', scanner.usedNativeClasses.size)
        recorder.set('scanner-class-candidate-count', new Set([
          ...scanner.latentClasses, ...scanner.validClasses, ...scanner.usedNativeClasses, ...(scanner.options.safelist || [])
        ]).size)
      })
      const composeOptions = { scanner, baseManifest, projectDir: workspace }
      const baseline = await recorder.time('baseline-compose-ms', () => stylesheets.compose(composeOptions))
      const final = await recorder.time('diagnostic-compose-ms', () => stylesheets.compose(composeOptions))
      if (hashBytes(baseline.css) !== hashBytes(final.css)) throw new Error(`Diagnostic CSS mismatch for ${fixtureId}. Baseline=${hashBytes(baseline.css)} diagnostic=${hashBytes(final.css)}`)
      const generated = await recorder.time('generated-only-compose-ms', () => stylesheets.compose({
        ...composeOptions, includeMasterBaseCSS: false, includeNativeCSS: false
      }))
      const native = await recorder.time('native-only-compose-ms', () => stylesheets.compose({ ...composeOptions, includeGeneratedCSS: false }))
      return { final: final.css, generated: generated.css, 'native-only': native.css }
    })
  } finally {
    stylesheets.dispose()
    await scanner.dispose()
  }
  for (const marker of getStaticFixtureSource(fixtureId).expectedCSSMarkers) {
    if (!results.final.includes(marker)) throw new Error(`Diagnostic CSS for ${fixtureId} is missing marker ${marker}.`)
  }
  const files: string[] = []
  for (const [mode, css] of Object.entries(results)) {
    const bytes = summarizeBytes(Buffer.from(css))
    recorder.set(`${mode}-css-raw-bytes`, bytes.rawBytes)
    recorder.set(`${mode}-css-gzip-bytes`, bytes.gzipBytes)
    recorder.set(`${mode}-css-brotli-bytes`, bytes.brotliBytes)
    const file = resolve(workspace, mode === 'final' ? 'dist/output.css' : `diagnostic/${mode}.css`)
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, css)
    files.push(file)
  }
  recorder.assertComplete()
  const observations = resolve(workspace, 'diagnostic/phase-observations.json')
  await writeFile(observations, JSON.stringify(recorder.observations, null, 2) + '\n')
  files.push(observations)
  return {
    samples: Object.entries(recorder.values).map(([metricId, value]) => ({ metricId, value, variantId, round })),
    artifacts: await Promise.all(files.map(file => measureRelativeArtifact(file)))
  }
}
