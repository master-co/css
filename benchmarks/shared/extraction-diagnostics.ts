import { existsSync, readFileSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import {
  AnimationRule,
  VariableRule,
  type MasterCSSEmittedGlobals
} from '@master/css'
import {
  createManifestFromCSSResult,
  resolveMasterCSSPackageImportGraph,
  type CompileCSSResult
} from '@master/css-compiler'
import { collectAnimationNamesFromDeclaration } from '@master/css'
import { findCSSManifestEntryFiles } from '@master/css-compiler/project/entries'
import CSSScanner from '@master/css-tooling/scanner'
import {
  collectCSSVariableReferences,
  compileStyleCSS,
  createExtractedCSS,
  getNativeCSS,
  registerStyleCSSSource,
  removeMasterStyleDirectives,
  removeStyleCSSImports,
  type ScannerState,
  type StyleCSSSource,
  type StyleCSSSources
} from '@master/css-compiler/stylesheet'
import { extractClassCandidates } from '@master/css-tooling/source'
import {
  hasStylesheetDirectives,
  hasStylesheetSourceDirectives,
  mergeStylesheetSourceOptions,
  resolveStylesheetSourcePaths,
  type StylesheetSourceOptions
} from '@master/css-compiler/stylesheet/directives'
import { createCSSWithNativeDeclarations } from '@master/css-tooling/validator/native-declaration'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
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

type StylesheetCSS = ReturnType<typeof createCSSWithNativeDeclarations>

interface DiagnosticRunResult {
  measurements: Record<string, number>
  artifacts: BenchmarkArtifact[]
  cssBytes: ByteSummary
}

interface RenderDiagnosticResult {
  css: string
  nativeCSS: string
  generatedCSS: string
  emittedGlobals: Required<MasterCSSEmittedGlobals>
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
    styleCSSSources: setup.styleCSSSources,
    projectDir: setup.scanner.cwd
  }))
  const productionHash = hashBytes(productionCSS)

  const diagnosticCSS = await recorder.time('diagnostic-extraction-total-ms', () => createDiagnosticExtractedCSS({
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
}): Promise<RenderDiagnosticResult> {
  const {
    scanner,
    styleCSSSources,
    projectDir,
    recorder
  } = options
  const classes = getScannerClasses(scanner)
  recorder.setCount('latent-class-count', scanner.latentClasses.size)
  recorder.setCount('valid-class-count', scanner.validClasses.size)
  recorder.setCount('native-class-name-count', scanner.nativeClassNames.size)
  recorder.setCount('used-native-class-count', scanner.usedNativeClasses.size)

  const hasMasterCSS = hasMasterCSSPackageSource(styleCSSSources)
  const defaultArtifact = hasMasterCSS
    ? readDefaultMasterCSSPackageArtifact(projectDir, recorder)
    : undefined
  const masterCSSResult = hasMasterCSS && !defaultArtifact
    ? await compileMasterCSSPackage(projectDir, recorder)
    : undefined

  const entryStyleResults: CompileCSSResult[] = []
  for (const [id, styleSource] of styleCSSSources) {
    const sourceClasses = styleSource.pruneNativeCSS
      ? getStyleSourceClasses(scanner, styleSource, classes, projectDir)
      : undefined
    const result = await recorder.time('entry-css-compilation-ms', () => compileStyleCSS(id, styleSource.source, {
      classes: sourceClasses,
      projectDir
    }))
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
    const finalizedResult = recorder.timeSync('manifest-finalization-ms', () => createManifestFromCSSResult(result, {
      baseManifest: mergedManifest,
      root: projectDir
    }))
    mergedManifest = finalizedResult.manifest
    finalizedStyleResults.set(result, finalizedResult)
  }

  const nativeCSS = recorder.timeSync('native-css-collection-ms', () => [
    ...(defaultArtifact
      ? [defaultArtifact.nativeCSS]
      : []),
    ...(masterCSSResult
      ? [getNativeCSS(finalizedStyleResults.get(masterCSSResult) || masterCSSResult)]
      : []),
    ...entryStyleResults
      .map((result) => finalizedStyleResults.get(result)?.css || result.nativeCSS)
  ].filter((source): source is string => Boolean(source)))

  const generatedClasses = recorder.timeSync('generated-class-collection-ms', () => {
    const nextClasses = new Set(classes)
    for (const styleSource of styleCSSSources.values()) {
      if (!hasStylesheetDirectives(styleSource.directives)) continue
      for (const className of getStyleSourceClasses(scanner, styleSource, classes, projectDir)) {
        nextClasses.add(className)
      }
    }
    return nextClasses
  })
  recorder.setCount('generated-class-count', generatedClasses.size)
  recorder.setCount('native-css-source-count', nativeCSS.length)
  recorder.setCount('native-css-raw-bytes', Buffer.byteLength(nativeCSS.join('\n\n')))

  return renderDiagnosticCompiledManifestCSS({
    recorder,
    manifest: mergedManifest,
    nativeCSS,
    classNames: generatedClasses
  })
}

async function compileMasterCSSPackage(projectDir: string, recorder: DiagnosticRecorder) {
  recorder.setCount('master-package-shortcut-fallback-count', 1)
  const graph = recorder.timeSync('master-import-graph-resolution-ms', () => resolveMasterCSSPackageCompileSource(projectDir))
  const result = await recorder.time('master-package-css-compilation-ms', () => compileStyleCSS(graph.dependencies[0] || '@master/css', graph.source, {
    projectDir
  }))
  return {
    ...result,
    dependencies: graph.dependencies
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
  const graph = recorder.timeSync('master-import-graph-resolution-ms', () => resolveMasterCSSPackageImportGraph(projectDir))
  const artifactFiles = findDefaultPresetArtifactFiles(graph.dependencies)
  if (!artifactFiles) {
    recorder.setCount('master-package-shortcut-hit-count', 0)
    return
  }

  recorder.setCount('master-package-shortcut-hit-count', 1)
  recorder.setCount('master-package-shortcut-fallback-count', 0)
  return recorder.timeSync('master-package-artifact-read-ms', () => ({
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

function renderDiagnosticCompiledManifestCSS(options: {
  recorder: DiagnosticRecorder
  manifest: Parameters<typeof createCSSWithNativeDeclarations>[0]
  nativeCSS: string[]
  classNames: Iterable<string>
}): RenderDiagnosticResult {
  const {
    recorder,
    manifest,
    nativeCSS,
    classNames
  } = options
  const nativeAnimationNames = collectStyleCSSKeyframeNames(nativeCSS)
  const css = recorder.timeSync('engine-css-creation-ms', () => createCSSWithNativeDeclarations(manifest))
  if (nativeAnimationNames.size) {
    css.registerEmittedGlobals({
      animations: Object.fromEntries([...nativeAnimationNames].map((name) => [name, 1]))
    })
  }

  recorder.timeSync('engine-rule-generation-ms', () => {
    for (const className of classNames) {
      css.ensureClassRules(className)
    }
  })

  const variableReferences = recorder.timeSync('native-variable-reference-scan-ms', () => collectStyleCSSVariableReferences(nativeCSS))
  const animationReferences = recorder.timeSync('native-animation-reference-scan-ms', () => collectNativeCSSAnimationReferences(nativeCSS, css, nativeAnimationNames))
  insertVariableReferences(css, variableReferences)
  insertAnimationReferences(css, animationReferences)

  const generatedCSS = recorder.timeSync('css-text-serialization-ms', () => css.text)
  const assembledCSS = recorder.timeSync('final-css-assembly-ms', () => [
    ...nativeCSS,
    generatedCSS
  ].filter(Boolean).join('\n\n'))
  const emittedGlobals = recorder.timeSync('emitted-globals-creation-ms', () => createEmittedGlobals(css))

  return {
    css: assembledCSS,
    nativeCSS: nativeCSS.join('\n\n'),
    generatedCSS,
    emittedGlobals
  }
}

function collectStyleCSSVariableReferences(nativeCSS: string[]) {
  const references = new Set<string>()
  for (const source of nativeCSS) {
    for (const reference of collectCSSVariableReferences(source)) {
      references.add(reference)
    }
  }
  return references
}

function collectCSSKeyframeNames(source: string) {
  const names = new Set<string>()
  for (const match of source.matchAll(/@keyframes\s+(-?[_a-zA-Z][-_a-zA-Z0-9]*)/g)) {
    names.add(match[1])
  }
  return names
}

function collectStyleCSSKeyframeNames(nativeCSS: string[]) {
  const names = new Set<string>()
  for (const source of nativeCSS) {
    for (const name of collectCSSKeyframeNames(source)) {
      names.add(name)
    }
  }
  return names
}

function collectCSSAnimationReferences(source: string, css: StylesheetCSS, ignoredAnimationNames = new Set<string>()) {
  const references = new Set<string>()
  const animationNames = Array.from(css.animations.keys())
  if (!animationNames.length) return references
  for (const match of source.matchAll(/\b(animation(?:-name)?)\s*:\s*([^;{}]+)/g)) {
    for (const name of collectAnimationNamesFromDeclaration(match[1], match[2], {
      animationNames,
      variables: css.variables,
      variableNames: collectCSSVariableReferences(match[2])
    })) {
      if (ignoredAnimationNames.has(name)) continue
      references.add(name)
    }
  }
  return references
}

function collectNativeCSSAnimationReferences(nativeCSS: string[], css: StylesheetCSS, ignoredAnimationNames = new Set<string>()) {
  const references = new Set<string>()
  for (const source of nativeCSS) {
    for (const reference of collectCSSAnimationReferences(source, css, ignoredAnimationNames)) {
      references.add(reference)
    }
  }
  return references
}

function insertVariableReferences(css: StylesheetCSS, references: Set<string>) {
  const insert = (name: string, visited = new Set<string>()) => {
    if (visited.has(name)) return
    visited.add(name)
    const variable = css.variables.get(name)
    if (!variable || variable.inline) return
    css.themeLayer.insert(new VariableRule(name, variable, css))
    variable.dependencies?.forEach((dependency) => insert(dependency, visited))
  }
  const visited = new Set<string>()
  for (const name of references) {
    insert(name, visited)
  }
}

function insertAnimationReferences(css: StylesheetCSS, references: Set<string>) {
  for (const name of references) {
    const keyframes = css.animations.get(name)
    if (!keyframes) continue
    const rule = new AnimationRule(name, keyframes, css)
    css.animationsNonLayer.insert(rule)
    insertVariableReferences(css, rule.variableNames ?? new Set())
  }
}

function createEmittedGlobals(css: StylesheetCSS): Required<MasterCSSEmittedGlobals> {
  const emittedGlobals: Required<MasterCSSEmittedGlobals> = {
    variables: { ...css.emittedGlobals.variables },
    animations: { ...css.emittedGlobals.animations }
  }
  for (const rule of css.themeLayer.rules) {
    if (rule instanceof VariableRule) {
      emittedGlobals.variables[rule.name] = 1
    }
  }
  for (const rule of css.animationsNonLayer.rules) {
    if (rule instanceof AnimationRule) {
      emittedGlobals.animations[rule.name] = 1
    }
  }
  return emittedGlobals
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
