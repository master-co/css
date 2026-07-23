import { existsSync, readFileSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import {
  compileCSS,
  createManifestFromCSSResult,
  resolveMasterCSSPackageImportGraph,
  type CompileCSSManifestSourceOptions,
  type CompileCSSOptions,
  type CompileCSSResult
} from '@master/css-compiler'
import { findCSSManifestEntryFiles } from '@master/css-compiler/project/entries'
import CSSScanner from '@master/css-tooling/scanner'
import { extractClassCandidates } from '@master/css-tooling/source'
import {
  cleanStyleRequest,
  collectCSSVariableReferences,
  createExtractedCSS,
  getNativeCSS,
  preprocessStyleCSS,
  registerStyleCSSSource,
  removeMasterStyleDirectives,
  removeStyleCSSImports,
  type CompileStyleCSSOptions,
  type ScannerState,
  type StyleCSSSource,
  type StyleCSSSources
} from '@master/css-compiler/stylesheet'
import {
  hasStylesheetDirectives,
  hasStylesheetSourceDirectives,
  mergeStylesheetSourceOptions,
  resolveStylesheetSourcePaths,
  type StylesheetSourceOptions
} from '@master/css-compiler/stylesheet/directives'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { CompilerDiagnosticRecorder } from '../../packages/compiler/src/compiler-diagnostics'
import { renderCompiledManifestCSS } from '../../packages/compiler/src/stylesheet/render'
import fg from 'fast-glob'
import { getStaticFixtureSource } from '../fixtures/static'
import { hashBytes, summarizeBytes } from './bytes'
import {
  findCSSFiles,
  measureRelativeArtifact,
  readFiles
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

interface DiagnosticRunResult {
  measurements: Record<string, number>
  artifacts: BenchmarkArtifact[]
  cssBytes: ByteSummary
}

interface DiagnosticStyleCSSResult extends CompileCSSResult {
  dependencies: string[]
  warnings: string[]
  css: string
  generatedCSS: string
}

interface RenderedDiagnosticCSS {
  css: string
  generatedCSS: string
}

export interface CompilerDiagnosticResult {
  samples: BenchmarkSample[]
  artifacts: BenchmarkArtifact[]
}

const lowerDiagnosticMetricIds = [
  'lower-normalize-directive-input-ms',
  'lower-variable-name-resolver-ms',
  'lower-validate-token-conflicts-ms',
  'lower-warn-media-modes-ms',
  'lower-create-directive-css-total-ms',
  'lower-directive-css-manifest-creation-ms',
  'lower-create-compiler-css-ms',
  'lower-finalize-utility-definitions-ms',
  'lower-utility-at-rule-resolution-ms',
  'lower-utility-rule-resolution-ms',
  'lower-initial-refresh-manifest-creation-ms',
  'lower-initial-css-refresh-ms',
  'lower-finalize-style-definitions-total-ms',
  'lower-style-definition-grouping-ms',
  'lower-managed-style-sort-ms',
  'lower-managed-style-merge-ms',
  'lower-managed-style-push-ms',
  'lower-managed-refresh-manifest-creation-ms',
  'lower-managed-css-refresh-ms',
  'lower-native-style-merge-ms',
  'lower-native-style-render-ms',
  'lower-final-manifest-creation-ms',
  'lower-input-variable-count',
  'lower-input-utility-count',
  'lower-input-variant-count',
  'lower-input-animation-count',
  'lower-utility-definition-count',
  'lower-style-definition-count',
  'lower-managed-style-definition-count',
  'lower-native-style-definition-count',
  'lower-managed-style-group-count',
  'lower-managed-merged-style-definition-count',
  'lower-native-merged-style-definition-count',
  'lower-managed-style-refresh-count'
] as const

const manifestDiagnosticMetricIds = [
  'manifest-create-count',
  'manifest-variable-name-resolver-ms',
  'manifest-compile-variables-ms',
  'manifest-group-variables-ms',
  'manifest-compile-at-rules-ms',
  'manifest-variant-base-merge-ms',
  'manifest-compile-variants-ms',
  'manifest-compile-utilities-ms',
  'manifest-compile-animations-ms',
  'manifest-compile-animation-options-ms',
  'manifest-final-merge-ms',
  'manifest-input-variable-count',
  'manifest-input-utility-count',
  'manifest-input-variant-count',
  'manifest-input-animation-count',
  'manifest-output-variable-count',
  'manifest-output-utility-count',
  'manifest-output-variant-count',
  'manifest-output-selector-count',
  'manifest-output-at-rule-count',
  'manifest-output-animation-count'
] as const

const prefixedDiagnosticMetricIds = [
  ...lowerDiagnosticMetricIds,
  ...manifestDiagnosticMetricIds
].flatMap((id) => [
  `master-internal-${id}`,
  `outer-${id}`
])

export const compilerDiagnosticMetricIds = [
  'production-create-extracted-css-ms',
  'diagnostic-compiler-total-ms',
  'master-import-graph-resolution-ms',
  'master-package-artifact-read-ms',
  'master-package-compile-css-ms',
  'master-package-internal-manifest-finalization-ms',
  'entry-compile-css-ms',
  'entry-internal-manifest-finalization-ms',
  'outer-manifest-finalization-ms',
  'render-compiled-css-ms',
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
  'generated-css-raw-bytes',
  'generated-css-gzip-bytes',
  'generated-css-brotli-bytes',
  'final-css-raw-bytes',
  'final-css-gzip-bytes',
  'final-css-brotli-bytes',
  ...prefixedDiagnosticMetricIds
] as const

type CreateManifestWithDiagnostics = (
  result: CompileCSSResult,
  options?: CompileCSSManifestSourceOptions & { diagnostics?: CompilerDiagnosticRecorder }
) => ReturnType<typeof createManifestFromCSSResult>

const createManifestFromCSSResultWithDiagnostics = createManifestFromCSSResult as CreateManifestWithDiagnostics

const DEFAULT_PRESET_SOURCE_FILES = [
  'index.css',
  'base.css',
  'theme.css',
  'variants.css',
  'utilities.css'
]

interface DefaultMasterCSSPackageArtifact {
  manifest: MasterCSSManifest
  nativeCSS: string
}

export function createCompilerDiagnosticVariants(fixtureIds: BenchmarkFixtureId[]): BenchmarkVariant[] {
  return fixtureIds.map((fixtureId) => ({
    id: createCompilerDiagnosticVariantId(fixtureId),
    fixtureId,
    adapterId: 'master-static',
    label: `${fixtureId} / Master CSS compiler diagnostic`,
    limits: ['Diagnostic timings decompose compiler lowering and are not end-user command timings.']
  }))
}

export function createCompilerDiagnosticVariantId(fixtureId: BenchmarkFixtureId) {
  return `${fixtureId}-master-static-compiler`
}

export async function runCompilerDiagnostic(options: {
  workspace: string
  fixtureId: BenchmarkFixtureId
  variantId: string
  round: number
}): Promise<CompilerDiagnosticResult> {
  const result = await runMasterCompilerDiagnostic(options.workspace, options.fixtureId)

  return {
    samples: createDiagnosticSamples(options.variantId, options.round, result),
    artifacts: result.artifacts
  }
}

class DiagnosticRecorder implements CompilerDiagnosticRecorder {
  readonly timings: Record<string, number> = {}
  readonly counts: Record<string, number> = {}

  constructor(private readonly parent?: DiagnosticRecorder, private readonly prefix = '') { }

  time<T>(metricId: string, callback: () => T): T {
    const startedAt = performance.now()
    try {
      return callback()
    } finally {
      this.addTiming(metricId, performance.now() - startedAt)
    }
  }

  async timeAsync<T>(metricId: string, callback: () => Promise<T> | T): Promise<T> {
    const startedAt = performance.now()
    try {
      return await callback()
    } finally {
      this.addTiming(metricId, performance.now() - startedAt)
    }
  }

  addTiming(metricId: string, value: number) {
    if (this.parent) {
      this.parent.addTiming(this.prefix + metricId, value)
      return
    }
    this.timings[this.prefix + metricId] = (this.timings[this.prefix + metricId] || 0) + value
  }

  addCount(metricId: string, value = 1) {
    if (this.parent) {
      this.parent.addCount(this.prefix + metricId, value)
      return
    }
    this.counts[this.prefix + metricId] = (this.counts[this.prefix + metricId] || 0) + value
  }

  setCount(metricId: string, value: number) {
    if (this.parent) {
      this.parent.setCount(this.prefix + metricId, value)
      return
    }
    this.counts[this.prefix + metricId] = value
  }

  withPrefix(prefix: string) {
    return new DiagnosticRecorder(this, prefix)
  }

  entries() {
    return {
      ...this.timings,
      ...this.counts
    }
  }
}

async function runMasterCompilerDiagnostic(workspace: string, fixtureId: BenchmarkFixtureId): Promise<DiagnosticRunResult> {
  const tool = staticBuildTools.find((candidate) => candidate.id === 'master-static-cli')
  if (!tool) throw new Error('Missing Master CSS static CLI tool.')

  await prepareStaticWorkspace(workspace, fixtureId, tool)
  const setup = await prepareScannerWorkspace(workspace)
  const recorder = new DiagnosticRecorder()
  recorder.setCount('css-entry-count', setup.cssEntryCount)
  recorder.setCount('source-file-count', setup.sourceFileCount)
  recorder.setCount('latent-class-count', setup.scanner.latentClasses.size)
  recorder.setCount('valid-class-count', setup.scanner.validClasses.size)
  recorder.setCount('native-class-name-count', setup.scanner.nativeClassNames.size)
  recorder.setCount('used-native-class-count', setup.scanner.usedNativeClasses.size)

  const productionCSS = await recorder.timeAsync('production-create-extracted-css-ms', () => createExtractedCSS({
    scanner: setup.scanner,
    styleCSSSources: setup.styleCSSSources,
    projectDir: setup.scanner.cwd
  }))
  const productionHash = hashBytes(productionCSS)

  const diagnosticCSS = await recorder.timeAsync('diagnostic-compiler-total-ms', () => createDiagnosticExtractedCSS({
    scanner: setup.scanner,
    styleCSSSources: setup.styleCSSSources,
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
      `Compiler diagnostic CSS mismatch for ${fixtureId}.`,
      `Production SHA-256: ${productionHash}`,
      `Diagnostic SHA-256: ${diagnosticHash}`,
      `Production CSS: ${productionDebugFile}`,
      `Diagnostic CSS: ${diagnosticDebugFile}`
    ].join('\n'))
  }

  const output = resolve(workspace, 'dist/output.css')
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, diagnosticCSS.css)

  return collectCompilerDiagnosticOutput(workspace, fixtureId, recorder, diagnosticCSS)
}

async function prepareScannerWorkspace(workspace: string) {
  const styleCSSSources: StyleCSSSources = new Map()
  const scanner = new CSSScanner({}, workspace)
  await scanner.init()
  scanner.options.verbose = 0

  const entries = await findCSSManifestEntryFiles(scanner.cwd)
  for (const entry of entries) {
    await registerStyleCSSSource(scanner, styleCSSSources, entry, await readFile(entry, 'utf8'), {
      projectDir: scanner.cwd
    })
  }
  scanner.resetDependencies = [...new Set(
    Array.from(styleCSSSources.values()).flatMap((source) => source.dependencies)
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
    styleCSSSources,
    sourceFileCount: sourcePaths.length,
    cssEntryCount: entries.length
  }
}

async function createDiagnosticExtractedCSS(options: {
  scanner: ScannerState
  styleCSSSources: StyleCSSSources
  projectDir: string
  recorder: DiagnosticRecorder
}): Promise<RenderedDiagnosticCSS> {
  const {
    scanner,
    styleCSSSources,
    projectDir,
    recorder
  } = options
  const classes = getScannerClasses(scanner)
  const hasMasterCSS = hasMasterCSSPackageSource(styleCSSSources)
  const defaultArtifact = hasMasterCSS
    ? readDefaultMasterCSSPackageArtifact(projectDir, recorder)
    : undefined
  const masterCSSResult = hasMasterCSS && !defaultArtifact
    ? await compileMasterCSSPackage(projectDir, recorder)
    : undefined

  const entryStyleResults: DiagnosticStyleCSSResult[] = []
  for (const [id, styleSource] of styleCSSSources) {
    const sourceClasses = styleSource.pruneNativeCSS
      ? getStyleSourceClasses(scanner, styleSource, classes, projectDir)
      : undefined
    const result = await compileDiagnosticStyleCSS(id, styleSource.source, {
      classes: sourceClasses,
      projectDir
    }, recorder, 'entry')
    entryStyleResults.push(result)
  }

  const styleResults = [
    ...(masterCSSResult ? [masterCSSResult] : []),
    ...entryStyleResults
  ]
  let mergedManifest = defaultArtifact?.manifest ?? scanner.customOptions?.manifest ?? scanner.css.manifest
  const finalizedStyleResults = new Map<CompileCSSResult, ReturnType<typeof createManifestFromCSSResult>>()

  for (const result of styleResults) {
    if (!hasCompiledStyleManifestInput(result)) continue
    const finalizedResult = recorder.time('outer-manifest-finalization-ms', () => createManifestFromCSSResultWithDiagnostics(result, {
      baseManifest: mergedManifest,
      root: projectDir,
      diagnostics: recorder.withPrefix('outer-')
    }))
    mergedManifest = finalizedResult.manifest
    finalizedStyleResults.set(result, finalizedResult)
  }

  const nativeCSS = [
    ...(defaultArtifact
      ? [defaultArtifact.nativeCSS]
      : []),
    ...(masterCSSResult
      ? [getNativeCSS(finalizedStyleResults.get(masterCSSResult) || masterCSSResult)]
      : []),
    ...entryStyleResults
      .map((result) => finalizedStyleResults.get(result)?.css || result.nativeCSS)
  ].filter((source): source is string => Boolean(source))

  const generatedClasses = new Set(classes)
  for (const styleSource of styleCSSSources.values()) {
    if (!hasStylesheetDirectives(styleSource.directives)) continue
    for (const className of getStyleSourceClasses(scanner, styleSource, classes, projectDir)) {
      generatedClasses.add(className)
    }
  }
  recorder.setCount('generated-class-count', generatedClasses.size)
  recorder.setCount('native-css-source-count', nativeCSS.length)

  const renderedCSS = recorder.time('render-compiled-css-ms', () => renderCompiledManifestCSS({
    manifest: mergedManifest,
    nativeCSS,
    classNames: generatedClasses
  }))

  return {
    css: renderedCSS.css,
    generatedCSS: renderedCSS.generatedCSS
  }
}

async function compileMasterCSSPackage(projectDir: string, recorder: DiagnosticRecorder) {
  recorder.setCount('master-package-shortcut-fallback-count', 1)
  const graph = recorder.time('master-import-graph-resolution-ms', () => resolveMasterCSSPackageCompileSource(projectDir))
  const result = await compileDiagnosticStyleCSS(graph.dependencies[0] || '@master/css', graph.source, {
    projectDir
  }, recorder, 'master-package')
  return {
    ...result,
    dependencies: graph.dependencies
  }
}

async function compileDiagnosticStyleCSS(
  id: string,
  source: string,
  options: CompileStyleCSSOptions,
  recorder: DiagnosticRecorder,
  prefix: 'master-package' | 'entry'
): Promise<DiagnosticStyleCSSResult> {
  const { projectDir, loadSass: _loadSass, baseManifest, ...compileOptions } = options
  const filename = cleanStyleRequest(id)
  const css = await preprocessStyleCSS(source, id, options)
  const result = recorder.time(`${prefix}-compile-css-ms`, () => compileCSS(css, {
    ...compileOptions as CompileCSSOptions,
    from: filename
  }))
  const finalizedResult = recorder.time(`${prefix}-internal-manifest-finalization-ms`, () => createManifestFromCSSResultWithDiagnostics(result, {
    ...compileOptions,
    baseManifest,
    root: projectDir,
    from: filename,
    diagnostics: prefix === 'master-package'
      ? recorder.withPrefix('master-internal-')
      : undefined
  }))

  return {
    ...result,
    dependencies: finalizedResult.dependencies,
    warnings: finalizedResult.warnings,
    css: finalizedResult.css,
    generatedCSS: finalizedResult.generatedCSS
  }
}

function resolveMasterCSSPackageCompileSource(projectDir: string) {
  const graph = resolveMasterCSSPackageImportGraph(projectDir)
  return {
    source: removeMasterStyleDirectives(removeStyleCSSImports(graph.source).code).code,
    dependencies: graph.dependencies
  }
}

function readDefaultMasterCSSPackageArtifact(projectDir: string, recorder: DiagnosticRecorder): DefaultMasterCSSPackageArtifact | undefined {
  const graph = recorder.time('master-import-graph-resolution-ms', () => resolveMasterCSSPackageImportGraph(projectDir))
  const artifactFiles = findDefaultPresetArtifactFiles(graph.dependencies)
  if (!artifactFiles) {
    recorder.setCount('master-package-shortcut-hit-count', 0)
    return
  }

  recorder.setCount('master-package-shortcut-hit-count', 1)
  recorder.setCount('master-package-shortcut-fallback-count', 0)
  return recorder.time('master-package-artifact-read-ms', () => ({
    manifest: JSON.parse(readFileSync(artifactFiles.manifestFile, 'utf8')) as MasterCSSManifest,
    nativeCSS: readFileSync(artifactFiles.nativeCSSFile, 'utf8')
  }))
}

function findDefaultPresetArtifactFiles(dependencies: string[]) {
  if (dependencies.length !== DEFAULT_PRESET_SOURCE_FILES.length + 1) return
  const dependencySet = new Set(dependencies.map((dependency) => resolve(dependency)))
  for (const dependency of dependencies) {
    const directory = dirname(dependency)
    const sourceFiles = DEFAULT_PRESET_SOURCE_FILES.map((file) => resolve(directory, file))
    if (!sourceFiles.every((file) => dependencySet.has(file))) continue

    const manifestFile = resolve(directory, 'default-manifest.json')
    const nativeCSSFile = resolve(directory, 'default-native.css')
    if (!existsSync(manifestFile) || !existsSync(nativeCSSFile)) return
    return {
      manifestFile,
      nativeCSSFile
    }
  }
}

function hasMasterCSSPackageSource(styleCSSSources: StyleCSSSources) {
  return Array.from(styleCSSSources.values()).some((styleSource) => styleSource.masterCSS)
}

function hasCompiledStyleManifestInput(result: CompileCSSResult) {
  return Boolean(Object.keys(result.manifestInput || {}).length || result.styleDefinitions?.length)
}

function getScannerClasses(scanner: ScannerState) {
  return filterExcludedClasses([...new Set([
    ...(scanner.latentClasses || []),
    ...(scanner.validClasses || []),
    ...(scanner.usedNativeClasses || []),
    ...(scanner.options.safelist || [])
  ])], scanner.options.blocklist)
}

function getStyleSourceClasses(
  scanner: ScannerState,
  styleSource: StyleCSSSource,
  baseClasses: string[],
  projectDir: string
) {
  if (!hasStylesheetDirectives(styleSource.directives)) return baseClasses
  const scopedOptions = mergeStylesheetSourceOptions(scanner.options, styleSource.directives)
  const classes = hasStylesheetSourceDirectives(styleSource.directives)
    ? getStylesheetOptionClasses(scopedOptions, projectDir)
    : [
      ...baseClasses,
      ...(styleSource.directives.safelist || [])
    ]
  return filterExcludedClasses([...new Set(classes)], scopedOptions.blocklist)
}

function getStylesheetOptionClasses(options: StylesheetSourceOptions, projectDir: string) {
  const classes = new Set<string>(options.safelist || [])
  for (const sourcePath of resolveStylesheetSourcePaths(options, projectDir)) {
    const absolutePath = resolve(projectDir, sourcePath)
    if (!existsSync(absolutePath)) continue
    for (const className of extractClassCandidates(readFileSync(absolutePath, 'utf-8'))) {
      classes.add(className)
    }
  }
  return filterExcludedClasses([...classes], options.blocklist)
}

function filterExcludedClasses(classes: string[], excludeClasses?: Iterable<string | RegExp>) {
  const exact = new Set<string>()
  const patterns: RegExp[] = []
  for (const excludedClass of excludeClasses || []) {
    if (typeof excludedClass === 'string') {
      exact.add(excludedClass)
    } else {
      patterns.push(excludedClass)
    }
  }
  if (!exact.size && !patterns.length) return classes
  return classes.filter((className) => {
    if (exact.has(className)) return false
    for (const pattern of patterns) {
      pattern.lastIndex = 0
      const excluded = pattern.test(className)
      pattern.lastIndex = 0
      if (excluded) return false
    }
    return true
  })
}

async function collectCompilerDiagnosticOutput(
  workspace: string,
  fixtureId: BenchmarkFixtureId,
  recorder: DiagnosticRecorder,
  result: RenderedDiagnosticCSS
): Promise<DiagnosticRunResult> {
  const cssFiles = await findCSSFiles(resolve(workspace, 'dist'))
  if (!cssFiles.length) throw new Error(`No compiler diagnostic CSS files were generated for ${fixtureId}.`)

  const cssBuffer = await readFiles(cssFiles)
  const fixture = getStaticFixtureSource(fixtureId)
  for (const marker of fixture.expectedCSSMarkers) {
    if (!cssBuffer.includes(marker)) {
      throw new Error(`Compiler diagnostic CSS for ${fixtureId} is missing marker "${marker}".`)
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
    artifacts: await Promise.all(cssFiles.map((file) => measureRelativeArtifact(file))),
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
