import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { discoverManifestEntries } from '@master/css-compiler/project'
import { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  createExtractedCSS,
  createExtractedCSSResult,
  getScannerClasses,
  registerStylesheetSource,
  type ScannerState,
  type StylesheetSources
} from '@master/css-compiler/stylesheet'
import fg from 'fast-glob'
import { getStaticFixtureSource } from '../fixtures/static'
import { hashBytes, summarizeBytes } from './bytes'
import {
  findCSSFiles,
  measureRelativeArtifact,
  readFiles,
  toRepoPath
} from './runner'
import {
  prepareStaticWorkspace,
  staticBuildTools
} from './static-build'
import type {
  BenchmarkArtifact,
  BenchmarkFixtureId,
  BenchmarkSample,
  BenchmarkVariant,
  ByteSummary
} from './types'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

interface DiagnosticRunResult {
  measurements: Record<string, number>
  artifacts: BenchmarkArtifact[]
  cssBytes: ByteSummary
}

interface RenderDiagnosticResult {
  css: string
  generatedCSS: string
}

export interface ExtractionDiagnosticResult {
  samples: BenchmarkSample[]
  artifacts: BenchmarkArtifact[]
}

export const extractionDiagnosticMetricIds = [
  'production-create-extracted-css-ms',
  'diagnostic-extraction-total-ms',
  'master-import-graph-resolution-ms',
  'master-package-artifact-read-ms',
  'master-package-css-compilation-ms',
  'entry-css-compilation-ms',
  'manifest-finalization-ms',
  'native-css-collection-ms',
  'generated-class-collection-ms',
  'engine-css-creation-ms',
  'engine-rule-generation-ms',
  'native-variable-reference-scan-ms',
  'native-animation-reference-scan-ms',
  'css-text-serialization-ms',
  'emitted-globals-creation-ms',
  'final-css-assembly-ms',
  'css-entry-count',
  'source-file-count',
  'latent-class-count',
  'valid-class-count',
  'native-class-name-count',
  'used-native-class-count',
  'generated-class-count',
  'master-package-shortcut-hit-count',
  'master-package-shortcut-fallback-count',
  'native-css-source-count',
  'native-css-raw-bytes',
  'generated-css-raw-bytes',
  'generated-css-gzip-bytes',
  'generated-css-brotli-bytes',
  'final-css-raw-bytes',
  'final-css-gzip-bytes',
  'final-css-brotli-bytes'
] as const

export function createExtractionDiagnosticVariants(fixtureIds: BenchmarkFixtureId[]): BenchmarkVariant[] {
  return fixtureIds.map((fixtureId) => ({
    id: createExtractionDiagnosticVariantId(fixtureId),
    fixtureId,
    adapterId: 'master-static',
    label: `${fixtureId} / Master CSS extraction diagnostic`,
    limits: ['Diagnostic timings decompose the static extraction path and are not end-user command timings.']
  }))
}

export function createExtractionDiagnosticVariantId(fixtureId: BenchmarkFixtureId) {
  return `${fixtureId}-master-static-extraction`
}

export async function runExtractionDiagnostic(options: {
  workspace: string
  fixtureId: BenchmarkFixtureId
  variantId: string
  round: number
}): Promise<ExtractionDiagnosticResult> {
  const result = await runMasterExtractionDiagnostic(options.workspace, options.fixtureId)

  return {
    samples: createDiagnosticSamples(options.variantId, options.round, result),
    artifacts: result.artifacts
  }
}

class DiagnosticRecorder {
  readonly timings: Record<string, number> = {}
  readonly counts: Record<string, number> = {}

  async time<T>(metricId: string, callback: () => Promise<T> | T): Promise<T> {
    const startedAt = performance.now()
    try {
      return await callback()
    } finally {
      this.addTiming(metricId, performance.now() - startedAt)
    }
  }

  timeSync<T>(metricId: string, callback: () => T): T {
    const startedAt = performance.now()
    try {
      return callback()
    } finally {
      this.addTiming(metricId, performance.now() - startedAt)
    }
  }

  addTiming(metricId: string, value: number) {
    this.timings[metricId] = (this.timings[metricId] || 0) + value
  }

  setCount(metricId: string, value: number) {
    this.counts[metricId] = value
  }

  entries() {
    return {
      ...this.timings,
      ...this.counts
    }
  }
}

async function runMasterExtractionDiagnostic(workspace: string, fixtureId: BenchmarkFixtureId): Promise<DiagnosticRunResult> {
  const tool = staticBuildTools.find((candidate) => candidate.id === 'master-static-cli')
  if (!tool) throw new Error('Missing Master CSS static CLI tool.')

  await prepareStaticWorkspace(workspace, fixtureId, tool)

  const setup = await prepareScannerWorkspace(workspace)
  const recorder = new DiagnosticRecorder()
  recorder.setCount('css-entry-count', setup.cssEntryCount)
  recorder.setCount('source-file-count', setup.sourceFileCount)
  const productionCSS = await recorder.time('production-create-extracted-css-ms', () => createExtractedCSS({
    scanner: setup.scanner,
    stylesheetSources: setup.stylesheetSources,
    projectDir: setup.scanner.cwd
  }))
  const productionHash = hashBytes(productionCSS)

  const diagnosticCSS = await recorder.time('diagnostic-extraction-total-ms', () => createDiagnosticExtractedCSS({
    scanner: setup.scanner,
    stylesheetSources: setup.stylesheetSources,
    projectDir: setup.scanner.cwd,
    recorder
  }))
  const diagnosticHash = hashBytes(diagnosticCSS.css)

  if (diagnosticHash !== productionHash) {
    await mkdir(resolve(workspace, 'debug'), { recursive: true })
    const productionDebugFile = resolve(workspace, 'debug/production.css')
    const diagnosticDebugFile = resolve(workspace, 'debug/diagnostic.css')
    await writeFile(productionDebugFile, productionCSS)
    await writeFile(diagnosticDebugFile, diagnosticCSS.css)
    throw new Error([
      `Extraction diagnostic CSS mismatch for ${fixtureId}.`,
      `Production SHA-256: ${productionHash}`,
      `Diagnostic SHA-256: ${diagnosticHash}`,
      `Production CSS: ${productionDebugFile}`,
      `Diagnostic CSS: ${diagnosticDebugFile}`
    ].join('\n'))
  }

  const output = resolve(workspace, 'dist/output.css')
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, diagnosticCSS.css)

  return collectExtractionDiagnosticOutput(workspace, fixtureId, recorder, diagnosticCSS)
}

async function prepareScannerWorkspace(workspace: string) {
  const stylesheetSources: StylesheetSources = new Map()
  const scanner = new MasterCSSScanner({ manifest: defaultManifest }, workspace)
  await scanner.init()
  scanner.options.verbose = 0

  const entries = await discoverManifestEntries({ root: scanner.cwd })
  for (const entry of entries) {
    await registerStylesheetSource(scanner, stylesheetSources, entry, await readFile(entry, 'utf8'), {
      projectDir: scanner.cwd
    })
  }
  scanner.resetDependencies = [...new Set(
    Array.from(stylesheetSources.values()).flatMap((source) => source.dependencies)
  )]

  const sourcePaths = await fg(['index.html'], {
    cwd: scanner.cwd
  })
  await Promise.all(sourcePaths.map(async (source) => {
    const filepath = resolve(scanner.cwd, source)
    await scanner.scan(source, await readFile(filepath, 'utf8'))
  }))

  return {
    scanner,
    stylesheetSources,
    sourceFileCount: sourcePaths.length,
    cssEntryCount: entries.length
  }
}

async function createDiagnosticExtractedCSS(options: {
  scanner: ScannerState
  stylesheetSources: StylesheetSources
  projectDir: string
  recorder: DiagnosticRecorder
}): Promise<RenderDiagnosticResult> {
  const {
    scanner,
    stylesheetSources,
    projectDir,
    recorder
  } = options
  const classes = getScannerClasses(scanner)
  recorder.setCount('latent-class-count', scanner.latentClasses.size)
  recorder.setCount('valid-class-count', scanner.validClasses.size)
  recorder.setCount('native-class-name-count', scanner.nativeClassNames.size)
  recorder.setCount('used-native-class-count', scanner.usedNativeClasses.size)
  recorder.setCount('generated-class-count', classes.length)
  recorder.setCount('native-css-source-count', stylesheetSources.size)

  const rendered = await recorder.time('engine-css-creation-ms', () =>
    createExtractedCSSResult({
      scanner,
      stylesheetSources,
      projectDir
    })
  )
  const generated = await recorder.time('engine-rule-generation-ms', () =>
    createExtractedCSSResult({
      scanner,
      stylesheetSources,
      projectDir,
      includeMasterBaseCSS: false,
      includeNativeCSS: false
    })
  )

  return {
    css: rendered.css,
    generatedCSS: generated.css
  }
}

async function collectExtractionDiagnosticOutput(
  workspace: string,
  fixtureId: BenchmarkFixtureId,
  recorder: DiagnosticRecorder,
  result: RenderDiagnosticResult
): Promise<DiagnosticRunResult> {
  const cssFiles = await findCSSFiles(resolve(workspace, 'dist'))
  if (!cssFiles.length) throw new Error(`No extraction diagnostic CSS files were generated for ${fixtureId}.`)

  const cssBuffer = await readFiles(cssFiles)
  const fixture = getStaticFixtureSource(fixtureId)
  for (const marker of fixture.expectedCSSMarkers) {
    if (!cssBuffer.includes(marker)) {
      throw new Error(`Extraction diagnostic CSS for ${fixtureId} is missing marker "${marker}".`)
    }
  }

  const generatedCSSBytes = summarizeBytes(Buffer.from(result.generatedCSS))
  const finalCSSBytes = summarizeBytes(cssBuffer)
  return {
    measurements: {
      ...recorder.entries(),
      'generated-css-raw-bytes': generatedCSSBytes.rawBytes,
      'generated-css-gzip-bytes': generatedCSSBytes.gzipBytes,
      'generated-css-brotli-bytes': generatedCSSBytes.brotliBytes,
      'final-css-raw-bytes': finalCSSBytes.rawBytes,
      'final-css-gzip-bytes': finalCSSBytes.gzipBytes,
      'final-css-brotli-bytes': finalCSSBytes.brotliBytes
    },
    artifacts: await Promise.all(cssFiles.map(async (file) => ({
      ...await measureRelativeArtifact(file),
      path: toRepoPath(file)
    }))),
    cssBytes: finalCSSBytes
  }
}

function createDiagnosticSamples(variantId: string, round: number, result: DiagnosticRunResult): BenchmarkSample[] {
  return Object.entries(result.measurements).map(([metricId, value]) => ({
    metricId,
    variantId,
    round,
    value
  }))
}
