import { compilePreparedStylesheet } from './compiled-source'
import { compileRenderedDelivery } from './render-delivery'
import { mapStylesheetError } from './source-context'
import { registerDeliveredStylesheet, composeDeliveredStylesheets, compileStylesheetMetadata, compileDeliveredSource } from './delivery'
import { prepareCSSImportGraph } from '../node-imports'
import { pathToFileURL } from 'node:url'
import {
  createManifestFromCSSResult,
  analyzeCSSDependencies,
  filterCSSExtractionCandidates,
  inspectCSS,
  resolveCSSImportGraphSource,
  type CompileCSSOptions,
  type CompileCSSResult,
  isMasterCSSPackageStyleFile as isMasterCSSCompilerPackageStyleFile,
  resolveMasterCSSPackageImportGraph,
  stripRequestSuffix
} from '../node-compiler'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { renderCompiledManifestCSS, type RenderCompiledManifestCSSResult } from './render'
import { createToolingSessionSync } from '@master/css-tooling/node'
import { extname, resolve } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import {
  findStylesheetDirectiveStatements,
  hasStylesheetDirectives,
  hasLocalStyleDirectives,
  hasStylesheetSourceDirectives,
  mergeStylesheetSourceOptions,
  removeStylesheetDirectiveStatements,
  resolveStylesheetSourcePaths,
  type StylesheetDirectives,
  type StylesheetSourceOptions
} from './directives'

export {
  hasLocalStyleDirectives,
  collectStylesheetDirectives,
  collectStylesheetDirectivesFromCSSGraph,
  createStylesheetDirectives,
  findStylesheetDirectiveStatements,
  hasStylesheetDirectives,
  hasStylesheetSourceDirectives,
  mergeStylesheetDirectives,
  mergeStylesheetSourceOptions,
  removeStylesheetDirectiveStatements,
  resolveStylesheetSourcePaths,
  type CollectedStylesheetDirectives,
  type StylesheetDirectiveStatement,
  type StylesheetDirectives,
  type StylesheetSourceOptions
} from './directives'

const STYLESHEET_REQUEST_RE = /\.(css|scss|sass)(?:[?#].*)?$/
const MASTER_CSS_ENTRY_DIRECTIVE_NAME = 'entry'
const VIRTUAL_CSS_ID = 'virtual:master-utilities.css'
const MASTER_CSS_MODULE_IDS = ['@master/css'] as const

import { prepareSassSource } from './source'
import type { StylesheetPreparationOptions } from './types'

import type {
  SassModule,
  CompileStylesheetOptions,
  CompileRenderedStylesheetResult,
  TransformLocalStylesheetResult,
  TransformLocalStylesheetOptions,
  RegisterStylesheetSourceOptions,
  CreateStyleEntryEmittedGlobalsOptions,
  CreateStyleEntryEmittedGlobalsResult,
  CreateExtractedCSSOptions,
  CreateExtractedCSSResult,
  ScannerState,
  StylesheetSource,
  StylesheetSources,
  ResolvedStylesheetSource,
  ResolveStylesheetImportGraphOptions,
  CreateStylesheetHostSourceOptions
} from './types'

export type {
  SassModule,
  CompileStylesheetOptions,
  CompileRenderedStylesheetResult,
  TransformLocalStylesheetResult,
  TransformLocalStylesheetOptions,
  RegisterStylesheetSourceOptions,
  CreateStyleEntryEmittedGlobalsOptions,
  CreateStyleEntryEmittedGlobalsResult,
  CreateExtractedCSSOptions,
  CreateExtractedCSSResult,
  ScannerState,
  StylesheetSource,
  StylesheetSources,
  ResolvedStylesheetSource,
  ResolveStylesheetImportGraphOptions,
  CreateStylesheetHostSourceOptions,
  ScannerCSSState,
  ScannerClassState
} from './types'
function normalizeStylesheetModuleIds() {
  return new Set<string>(MASTER_CSS_MODULE_IDS)
}

function createStylesheetImportPattern() {
  return /(?:@master\s+entry\s*;|@import\s+(?:url\(\s*)?(['"])@master\/css\1\s*\)?[^;]*;)/
}

export function cleanStyleRequest(id: string) {
  // Virtual module queries are part of the host's opaque source identity.
  if (id.startsWith('\0')) return id
  return stripRequestSuffix(id)
}

function getStyleRequestSearchParams(id: string) {
  const queryStart = id.indexOf('?')
  return queryStart === -1 ? new URLSearchParams() : new URLSearchParams(id.slice(queryStart + 1))
}

function getStyleRequestExtension(id: string) {
  const cleanExtension = extname(cleanStyleRequest(id))
  if (cleanExtension === '.css' || cleanExtension === '.scss' || cleanExtension === '.sass') {
    return cleanExtension
  }
  const lang = getStyleRequestSearchParams(id).get('lang')
  if (lang === 'css' || lang === 'scss' || lang === 'sass') {
    return '.' + lang
  }
  return cleanExtension
}

function isStyleModuleRequest(source: string) {
  return getStyleRequestSearchParams(source).get('type') === 'style'
}

export function isStylesheetRequest(id: string) {
  return STYLESHEET_REQUEST_RE.test(id) || (isStyleModuleRequest(id) && ['.css', '.scss', '.sass'].includes(getStyleRequestExtension(id)))
}

export function replaceStylesheetImports(source: string, replacement: string) {
  const ids = new Set([
    ...normalizeStylesheetModuleIds(),
    VIRTUAL_CSS_ID
  ])
  const imports = analyzeCSSDependencies(source).imports
  let replaced = false
  let code = source
  for (const statement of imports.toReversed()) {
    if (!ids.has(statement.source)) continue
    code = code.slice(0, statement.start) + replacement + code.slice(statement.end)
    replaced = true
  }
  return { code, replaced }
}

function isExpandableStyleImportSource(source: string) {
  return (source.startsWith('./') || source.startsWith('../')) && extname(source) === '.css'
}

function findImportStatements(source: string) {
  return analyzeCSSDependencies(source).imports
}

export function resolveStylesheetImportGraph(
  file: string,
  source: string,
  projectDir?: string,
  options: ResolveStylesheetImportGraphOptions = {}
): ResolvedStylesheetSource {
  if (!STYLESHEET_REQUEST_RE.test(cleanStyleRequest(file))) {
    return {
      source,
      dependencies: [cleanStyleRequest(file)]
    }
  }
  return resolveCSSImportGraphSource(cleanStyleRequest(file), source, {
    projectDir,
    expandPackageImports: options.expandMasterCSSPackage !== false
  })
}

export function collectStylesheetDependencies(
  file: string,
  source?: string,
  projectDir?: string
) {
  const dependencies = new Set<string>()
  const filename = cleanStyleRequest(file)
  dependencies.add(filename)

  let resolvedSource = source
  if (resolvedSource === undefined) {
    try {
      resolvedSource = readFileSync(filename, 'utf-8')
    } catch {
      return [...dependencies]
    }
  }

  try {
    const graph = prepareCSSImportGraph(filename, resolvedSource, { projectDir, expandPackageImports: false }, analyzeCSSDependencies)
    for (const dependency of Object.keys(graph.files)) {
      dependencies.add(cleanStyleRequest(dependency))
    }
  } catch {
    // Keep the direct file dependency so the next valid edit can rerun the integration.
  }

  return [...dependencies]
}

export function removeStylesheetImports(source: string) {
  return replaceStylesheetImports(source, '')
}


export function hasStylesheetImport(source: string) {
  return removeStylesheetImports(source).replaced
}

export function hasMasterStyleEntrypoint(source: string) {
  return inspectCSS(source).hasMasterEntry
}

export function resolveMasterStyleSource(
  file: string,
  source: string,
  projectDir?: string
) {
  if (!isStylesheetRequest(file)) return
  const sourceHasMasterEntry = hasMasterStyleEntrypoint(source)
  let unresolvedPackageSource: ResolvedStylesheetSource
  try {
    unresolvedPackageSource = resolveStylesheetImportGraph(file, source, projectDir, {
      expandMasterCSSPackage: false
    })
  } catch (error) {
    if (!sourceHasMasterEntry) return
    throw error
  }
  if (!isMasterStyleSource(unresolvedPackageSource.source)) return
  return resolveStylesheetImportGraph(file, source, projectDir)
}

export function isMasterCSSModuleId(id: string) {
  return normalizeStylesheetModuleIds().has(id)
}

export function isMasterCSSPackageStyleFile(id: string, projectDir?: string) {
  return isMasterCSSCompilerPackageStyleFile(id, projectDir)
}

export function removeMasterStyleDirectives(source: string) {
  return removeStylesheetDirectiveStatements(source)
}

function isStylesheetHostImport(importSource: string, masterImport: string) {
  return importSource === masterImport || (masterImport === '@master/css' && normalizeStylesheetModuleIds().has(importSource))
}

export function createStylesheetHostSource(source: string, options: CreateStylesheetHostSourceOptions = {}) {
  const masterImport = options.masterImport || '@master/css'
  const masterSource = options.masterSource
  const hasMasterSource = Object.prototype.hasOwnProperty.call(options, 'masterSource')
  const cleanSource = removeMasterStyleDirectives(source).code
  const imports = findImportStatements(cleanSource)
  const preservedImports: string[] = []
  for (const importStatement of imports) {
    const importSource = importStatement.source
    if (!importSource) continue
    if (importSource === VIRTUAL_CSS_ID || normalizeStylesheetModuleIds().has(importSource)) {
      if (!hasMasterSource && isStylesheetHostImport(importSource, masterImport)) {
        preservedImports.push(importStatement.statement.trim())
      }
      continue
    }
    if (!isExpandableStyleImportSource(importSource)) {
      preservedImports.push(importStatement.statement.trim())
    }
  }
  if (hasMasterSource) {
    if (masterSource) {
      preservedImports.push(masterSource)
    }
  } else if (!preservedImports.some((statement) => {
    const importSource = findImportStatements(statement)[0]?.source
    return importSource && isStylesheetHostImport(importSource, masterImport)
  })) {
    preservedImports.unshift(`@import "${masterImport}";`)
  }
  return preservedImports.join('\n')
}

function resolveMasterCSSPackageCompileSource(projectDir?: string) {
  const graph = resolveMasterCSSPackageImportGraph(projectDir)
  return {
    source: removeMasterStyleDirectives(removeStylesheetImports(graph.source).code).code,
    dependencies: graph.dependencies
  }
}

export async function createMasterCSSPackageHostSource(
  projectDir: string | undefined,
  options: CompileStylesheetOptions
) {
  const graph = resolveMasterCSSPackageCompileSource(projectDir)
  const result = await compileStylesheet(graph.dependencies[0] || '@master/css', graph.source, {
    ...options,
    preserveNativeCSS: true
  })
  const nativeCSS = getNativeCSS(result)
  const finalizedResult = createManifestFromCSSResult(result, options)
  return {
    source: renderCompiledManifestCSS({
      manifest: finalizedResult.manifest,
      nativeCSS
    }).css,
    dependencies: graph.dependencies
  }
}

export function hasMasterEntryDirective(source: string) {
  return findStylesheetDirectiveStatements(source).some((statement) => statement.name === MASTER_CSS_ENTRY_DIRECTIVE_NAME)
}

export function hasPreserveNativeDirective(source: string) {
  return findStylesheetDirectiveStatements(source)
    .some((statement) => statement.atRuleName === 'preserve' && statement.modifiers.includes('native'))
}

export function isMasterStyleSource(source: string) {
  return hasMasterStyleEntrypoint(source)
}

export function prepareStylesheetSource(id: string, source: string, options: StylesheetPreparationOptions = {}) {
  return prepareSassSource(cleanStyleRequest(id), source, getStyleRequestExtension(id.startsWith('\0') && options.baseFile ? options.baseFile : id), options)
}

async function preprocessStylesheet(source: string, id: string, options: CompileStylesheetOptions) {
  const extension = getStyleRequestExtension(id)
  if (extension !== '.scss' && extension !== '.sass') return source
  return (await prepareStylesheetSource(id, source, options)).source
}

export async function compileStylesheet(
  id: string,
  source: string,
  options: CompileStylesheetOptions
): Promise<CompileCSSResult> {
  const { result, finalizedResult, outputMap } = await compileStylesheetResult(id, source, options)
  return {
    ...result,
    dependencies: finalizedResult.dependencies,
    warnings: finalizedResult.warnings,
    css: finalizedResult.css,
    generatedCSS: finalizedResult.generatedCSS,
    sourceMap: outputMap(finalizedResult.css)
  }
}

async function compileStylesheetResult(id: string, source: string, options: CompileStylesheetOptions, resolveImports = false) {
  const prepared = await prepareStylesheetSource(id, source, options)
  return compilePreparedStylesheet(cleanStyleRequest(id), prepared.source, { ...options, sourceMap: options.sourceMap ?? prepared.sourceMap }, resolveImports)
}

export async function compileRenderedStylesheet(
  id: string,
  source: string,
  options: CompileStylesheetOptions
): Promise<CompileRenderedStylesheetResult> {
  if (options.delivery) {
    const prepared = await prepareStylesheetSource(id, source, options)
    const filename = id.startsWith('\0') ? id : resolve(options.projectDir ?? '', cleanStyleRequest(id))
    const result = await compileRenderedDelivery(filename, prepared.source, {
      ...options,
      delivery: { ...options.delivery,
        onDependency: file => {
          options.onDependency?.(file)
          if (options.delivery!.onDependency !== options.onDependency) options.delivery!.onDependency?.(file)
        },
        baseFile: options.delivery.baseFile ?? options.baseFile,
        sourceMap: options.delivery.sourceMap ?? options.sourceMap ?? prepared.sourceMap
      }
    })
    return { ...result, dependencies: [...new Set([...prepared.dependencies, ...result.dependencies])] }
  }
  const { compileOptions, finalizedResult, result, outputMap } = await compileStylesheetResult(id, source, options, true)
  const renderedCSS = renderCompiledManifestCSS({
    manifest: finalizedResult.manifest,
    // Lowering emits composed native rules separately from parsed native CSS.
    nativeCSS: finalizedResult.css,
    classNames: compileOptions.classes
  })
  return {
    ...result,
    dependencies: finalizedResult.dependencies,
    warnings: finalizedResult.warnings,
    css: renderedCSS.css,
    sourceMap: outputMap(renderedCSS.css),
    nativeCSS: renderedCSS.nativeCSS,
    generatedCSS: renderedCSS.generatedCSS,
    emittedGlobals: renderedCSS.emittedGlobals,
    manifest: finalizedResult.manifest,
    renderedCSS
  }
}

function createEmptyStyleEntryEmittedGlobals(): Required<MasterCSSEmittedGlobals> {
  return {
    variables: {},
    animations: {}
  }
}

function hasEmittedGlobals(emittedGlobals: MasterCSSEmittedGlobals | undefined) {
  return Boolean(
    Object.keys(emittedGlobals?.variables || {}).length
    || Object.keys(emittedGlobals?.animations || {}).length
  )
}

export async function createStyleEntryEmittedGlobals(
  entries: string[],
  options: CreateStyleEntryEmittedGlobalsOptions
): Promise<CreateStyleEntryEmittedGlobalsResult> {
  const dependencies = new Set<string>()
  let baseManifest = options.baseManifest
  let emittedGlobals = createEmptyStyleEntryEmittedGlobals()

  for (const entry of [...new Set(entries)].sort()) {
    const filename = cleanStyleRequest(entry)
    const source = await preprocessStylesheet(readFileSync(filename, 'utf-8'), filename, options)
    const result = compileStylesheetMetadata(filename, source, { ...options, baseManifest, preserveNativeCSS: true })
    if (!result) continue
    for (const dependency of result.directives.dependencies) dependencies.add(cleanStyleRequest(dependency))
    const renderedCSS = renderCompiledManifestCSS({
      manifest: result.manifest,
      nativeCSS: result.stylesheets.map(stylesheet => stylesheet.css),
      emittedGlobals
    })
    if (hasEmittedGlobals(renderedCSS.emittedGlobals)) {
      emittedGlobals = renderedCSS.emittedGlobals
    }
    baseManifest = result.manifest
  }

  return {
    emittedGlobals,
    dependencies: [...dependencies]
  }
}

export async function transformLocalStylesheet(
  id: string,
  source: string,
  options: TransformLocalStylesheetOptions
): Promise<TransformLocalStylesheetResult> {
  let local = false
  try { local = isStylesheetRequest(id) && (Boolean(options.delivery) || hasLocalStyleDirectives(source, cleanStyleRequest(id))) }
  catch (error) { throw mapStylesheetError(error, cleanStyleRequest(id), options, source) }
  if (!isStylesheetRequest(id) || !local) {
    return {
      code: source,
      dependencies: [],
      transformed: false
    }
  }
  const {
    emittedGlobals,
    ...compileOptions
  } = options
  if (options.delivery) {
    const compiled = await compileDeliveredSource(cleanStyleRequest(id), await preprocessStylesheet(source, id, options), {
      ...compileOptions,
      preserveNativeCSS: true
    })
    if (!compiled) return { code: source, dependencies: [], transformed: false }
    const rendered = renderCompiledManifestCSS({
      manifest: compiled.resolutionManifest,
      nativeCSS: compiled.stylesheets.map(asset => asset.css),
      includeGeneratedCSS: false,
      emittedGlobals
    })
    const code = [compiled.directives.css, rendered.generatedCSS].filter(Boolean).join('\n\n')
    return {
      code, transformed: true, dependencies: compiled.directives.dependencies,
      stylesheets: compiled.stylesheets.filter(asset => asset.id !== compiled.entry).map(({ id, href, css }) => ({ id, href, css })),
      resources: compiled.resources,
      result: { ...compiled.directives, css: code, generatedCSS: rendered.generatedCSS }
    }
  }
  const { result, finalizedResult, outputMap } = await compileStylesheetResult(id, source, {
    ...compileOptions,
    preserveNativeCSS: true
  })
  const renderedCSS = renderCompiledManifestCSS({
    manifest: finalizedResult.resolutionManifest,
    nativeCSS: finalizedResult.css || result.nativeCSS,
    includeGeneratedCSS: false,
    emittedGlobals
  })
  const transformedResult = {
    ...result,
    dependencies: finalizedResult.dependencies,
    warnings: finalizedResult.warnings,
    css: renderedCSS.css,
    sourceMap: outputMap(renderedCSS.css),
    generatedCSS: renderedCSS.generatedCSS
  }
  return {
    code: transformedResult.css || transformedResult.nativeCSS || '',
    dependencies: [...new Set([cleanStyleRequest(id), ...(transformedResult.dependencies || [])])],
    transformed: true,
    result: transformedResult
  }
}

export function getNativeCSS(result: { css?: string, generatedCSS?: string, nativeCSS?: string }) {
  if (result.nativeCSS !== undefined) return result.nativeCSS
  const css = result.css || ''
  const generatedCSS = result.generatedCSS || ''
  if (generatedCSS && css.endsWith(generatedCSS)) {
    return css.slice(0, -generatedCSS.length).trim()
  }
  return css
}

function hasCompiledStyleManifestInput(result: CompileCSSResult) {
  return Boolean(Object.keys(result.manifestInput || {}).length || result.styleDefinitions?.length)
}

export function getScannerClasses(scanner: ScannerState) {
  return filterCSSExtractionCandidates([...new Set([
    ...(scanner.latentClasses || []),
    ...(scanner.validClasses || []),
    ...(scanner.usedNativeClasses || []),
    ...(scanner.options.safelist || [])
  ])], scanner.options.blocklist)
}

function getStylesheetOptionClasses(
  options: StylesheetSourceOptions,
  manifest: MasterCSSManifest,
  projectDir = process.cwd()
) {
  const classes = new Set<string>(options.safelist || [])
  const tooling = createToolingSessionSync({ manifest })
  try {
    for (const sourcePath of resolveStylesheetSourcePaths(options, projectDir)) {
      const absolutePath = resolve(projectDir, sourcePath)
      if (!existsSync(absolutePath)) continue
      for (const className of tooling.extractClassCandidates(readFileSync(absolutePath, 'utf-8'))) {
        classes.add(className)
      }
    }
  } finally {
    tooling.dispose()
  }
  return filterCSSExtractionCandidates([...classes], options.blocklist)
}

function getStyleSourceClasses(
  scanner: ScannerState,
  styleSource: StylesheetSource,
  baseClasses: readonly string[],
  projectDir?: string
) {
  if (!hasStylesheetDirectives(styleSource.directives)) return baseClasses
  const scopedOptions = mergeStylesheetSourceOptions(scanner.options, styleSource.directives)
  const classes = hasStylesheetSourceDirectives(styleSource.directives)
    ? getStylesheetOptionClasses(scopedOptions, scanner.css.manifest, projectDir)
    : [
      ...baseClasses,
      ...(styleSource.directives.safelist || [])
    ]
  return filterCSSExtractionCandidates([...new Set(classes)], scopedOptions.blocklist)
}


export async function registerStylesheetSource(
  scanner: ScannerState,
  stylesheetSources: StylesheetSources,
  id: string,
  source: string,
  options: RegisterStylesheetSourceOptions
): Promise<CompileCSSResult> {
  if (options.delivery) return registerDeliveredStylesheet(scanner, stylesheetSources, id, source, options)
  const filename = cleanStyleRequest(id)
  const prepared = await prepareStylesheetSource(filename, source, options)
  const compileOptions = {
    ...options,
    delivery: defaultCollectionDelivery(options.projectDir ?? scanner.cwd, {
      ...options, sourceMap: options.sourceMap ?? prepared.sourceMap
    })
  }
  return registerDeliveredStylesheet(scanner, stylesheetSources, filename, prepared.source, compileOptions, true)
}

function defaultCollectionDelivery(projectDir: string, options: CompileStylesheetOptions) {
  return {
    entryURL: pathToFileURL(resolve(projectDir, 'master.css')).href,
    stylesheetURL: (file: string, variant?: string) => pathToFileURL(variant ?? file).href,
    resourceURL: (file: string) => pathToFileURL(file).href,
    baseFile: options.baseFile,
    sourceMap: options.sourceMap,
    onDependency: options.onDependency
  }
}

function hasMasterCSSPackageSource(stylesheetSources?: StylesheetSources) {
  return Array.from(stylesheetSources?.values() || []).some((styleSource) => styleSource.masterCSS)
}

async function compileMasterCSSPackage(projectDir: string | undefined, options: CompileStylesheetOptions) {
  const graph = resolveMasterCSSPackageCompileSource(projectDir)
  const result = await compileStylesheet(graph.dependencies[0] || '@master/css', graph.source, options)
  return {
    ...result,
    dependencies: graph.dependencies
  }
}

function createEmptyExtractedCSSResult(css = ''): CreateExtractedCSSResult {
  return {
    css,
    emittedGlobals: {
      variables: {},
      animations: {}
    }
  }
}

export async function createExtractedCSSResult(options: CreateExtractedCSSOptions): Promise<CreateExtractedCSSResult> {
  const {
    scanner,
    stylesheetSources,
    manifest: planOption,
    includeGeneratedCSS = true,
    includeNativeCSS = true,
    includeMasterBaseCSS = true,
    ...compileOptions
  } = options
  const classes = compileOptions.classes ?? getScannerClasses(scanner)
  if (compileOptions.delivery || (stylesheetSources?.size && [...stylesheetSources.values()].every(source => source.graph))) {
    const inlineImports = !compileOptions.delivery
    return composeDeliveredStylesheets(stylesheetSources ?? new Map(), {
      ...compileOptions, delivery: compileOptions.delivery ?? defaultCollectionDelivery(compileOptions.projectDir ?? scanner.cwd, compileOptions),
      manifest: planOption, includeGeneratedCSS, includeNativeCSS, includeMasterBaseCSS
    }, classes, source => getStyleSourceClasses(scanner, source, classes, compileOptions.projectDir ?? scanner.cwd), inlineImports)
  }

  if (!planOption && !compileOptions.classes && !stylesheetSources?.size) {
    return createEmptyExtractedCSSResult(includeGeneratedCSS ? scanner.css.text : '')
  }

  const hasMasterCSS = hasMasterCSSPackageSource(stylesheetSources)
  const explicitPlan = planOption
  const masterCSSResult = hasMasterCSS
    ? await compileMasterCSSPackage(compileOptions.projectDir, compileOptions)
    : undefined
  const entryStyleResults = await Promise.all(
    Array.from(stylesheetSources || [])
      .map(([id, styleSource]) => compileStylesheet(id, styleSource.source, {
        ...compileOptions,
        references: styleSource.references,
        classes: styleSource.pruneNativeCSS
          ? getStyleSourceClasses(scanner, styleSource, classes, compileOptions.projectDir ?? scanner.cwd)
          : undefined
      }))
  )
  const styleResults = [
    ...(masterCSSResult ? [masterCSSResult] : []),
    ...entryStyleResults
  ]
  let mergedPlan = explicitPlan ?? compileOptions.baseManifest
  const finalizedStyleResults = new Map<CompileCSSResult, ReturnType<typeof createManifestFromCSSResult>>()
  for (const result of styleResults) {
    if (!hasCompiledStyleManifestInput(result)) continue
    const finalizedResult = createManifestFromCSSResult(result, {
      ...compileOptions,
      baseManifest: mergedPlan
    })
    mergedPlan = finalizedResult.manifest
    finalizedStyleResults.set(result, finalizedResult)
  }
  const nativeCSS = [
    ...(includeMasterBaseCSS
      ? [
        ...(masterCSSResult ? [getNativeCSS(finalizedStyleResults.get(masterCSSResult) || masterCSSResult)] : [])
      ]
      : []),
    ...(includeNativeCSS
      ? entryStyleResults
        .map((result: CompileCSSResult) => finalizedStyleResults.get(result)?.css || result.nativeCSS)
        .filter(Boolean)
      : [])
  ]
  const generatedClasses = new Set(classes)
  if (includeGeneratedCSS) {
    for (const styleSource of stylesheetSources?.values() || []) {
      if (!hasStylesheetDirectives(styleSource.directives)) continue
      for (const className of getStyleSourceClasses(scanner, styleSource, classes, compileOptions.projectDir ?? scanner.cwd)) {
        generatedClasses.add(className)
      }
    }
  }
  const renderedCSS = renderCompiledManifestCSS({
    manifest: mergedPlan,
    nativeCSS,
    classNames: generatedClasses,
    includeGeneratedCSS
  })
  return {
    css: renderedCSS.css,
    emittedGlobals: renderedCSS.emittedGlobals
  }
}

export async function createExtractedCSS(options: CreateExtractedCSSOptions) {
  return (await createExtractedCSSResult(options)).css
}
