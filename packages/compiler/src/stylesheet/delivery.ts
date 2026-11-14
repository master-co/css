/** @internal Filesystem preparation and standalone stylesheet asset composition. */
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createCompilerBindingSessionSync } from '@master/css-binding/compiler/node'
import { prepareCSSImportGraph, prepareCSSImportGraphWithResolver, normalizeStylesheetGraphID, assertRegularResourceFile, type PreparedCSSImportGraph, type CSSImportFileResolver } from '../node-imports'
import { analyzeCSSDependencies, compileCSSReferences, inspectCSS, resolveCSSReferenceFile, mergeCSSDirectiveExtractionPolicy } from '../node-compiler'
import { collectStylesheetDirectives, mergeStylesheetDirectives, mergeStylesheetSourceOptions, hasStylesheetSourceDirectives, resolveStylesheetSourcePaths, hasLocalStyleDirectives } from './directives'
import { hasStylesheetResourceReferences, renderCompiledManifestCSS } from './render'
import { resolveReferenceOrigins } from './reference-origins'
import { referenceFileInputs } from './reference-files'
import { stylesheetOutputMap } from './output-map'
import type { CSSOutputMapping } from '@master/css-schema/css-directives'
import { MasterCSSError } from '@master/css-schema'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSManifestReference, MasterCSSManifestSource } from '@master/css-binding/compiler/node'
import type { CompileCSSResult } from '../contracts'
import { fileStampsCurrent, settledFileStamps, type FileStamp } from '../file-stamps'
import type { TransformLocalStylesheetOptions, CompileStylesheetOptions, ScannerState, StylesheetSources, StylesheetSource, CreateExtractedCSSResult } from './types'

export interface StylesheetDeliveryOptions {
  /** Filesystem owner of a supplied virtual entry source. */
  readonly baseFile?: string
  /** Serialized source map v3 for original reference origins in the supplied entry. */
  readonly sourceMap?: string
  /** Final URL of the emitted entry stylesheet. */
  readonly entryURL: string
  /** Reports attempted filesystem dependencies, including files that are missing. */
  readonly onDependency?: (file: string) => void
  readonly stylesheetURL: (file: string, variant?: string) => string
  readonly resourceURL: (file: string) => string
  /** Standalone sibling assets only; the resulting manifest is not for inline CSS. */
  readonly relativeResourceURLs?: boolean
  /**
   * Flatten local imports into their importers wherever import order and namespace
   * scope survive. Only assets that retained boundaries still import are returned.
   */
  readonly inlineImports?: boolean
  /** Resolve CSS package exports with the Node host and preserve their native rules. */
  readonly resolveNodePackageImports?: boolean
  /** Async registration only: resolve imports with a build host before Node fallback. */
  readonly resolveImport?: CSSImportFileResolver
}

export interface StylesheetResourceAsset {
  readonly file: string
  readonly href: string
}

function prepareDelivery(graph: PreparedCSSImportGraph, delivery: StylesheetDeliveryOptions, owners: Record<string, string>, metadataOnly = false) {
  const urls: Record<string, string> = {}
  const resourceURLs: Record<string, Record<string, string>> = {}
  const resources = new Map<string, StylesheetResourceAsset>()
  for (const [file, source] of Object.entries(graph.files)) {
    const owner = owners[file] ?? file
    if (!owner.startsWith('\0')) delivery.onDependency?.(owner)
    urls[file] = delivery.stylesheetURL(owner, owners[file] ? file : undefined)
    resourceURLs[file] = {}
    for (const { url } of analyzeCSSDependencies(source).resources) {
      if (url.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(url)) continue
      const baseFile = graph.baseFiles?.[file] ?? (isAbsolute(owner) ? owner : undefined)
      if (!baseFile) throw new TypeError(`Relative resource URL requires a source baseFile: ${owner}`)
      const original = new URL(url, pathToFileURL(baseFile))
      const resourceFile = fileURLToPath(original)
      // Hosts read and publish resource bytes; a device or FIFO would never finish.
      assertRegularResourceFile(resourceFile)
      if (!metadataOnly) {
        delivery.onDependency?.(resourceFile)
        // Publication verifies assets; metadata collection leaves them to the host.
        readFileSync(resourceFile)
      }
      const href = delivery.resourceURL(resourceFile)
      if (!metadataOnly) resources.set(resourceFile, { file: resourceFile, href })
      resourceURLs[file][url] = `${href}${original.search}${original.hash}`
    }
  }
  return { urls, resourceURLs, resources: [...resources.values()] }
}

/** Graph compilation options; manifests may stay referenced in the binding. */
type GraphOptions = Omit<CompileStylesheetOptions, 'baseManifest'> & {
  readonly baseManifest?: MasterCSSManifestSource
  /** Compile only for the manifests, dependencies and warnings a referencing graph reads. */
  readonly referenceContext?: boolean
}

interface GraphReferenceContext {
  manifest?: MasterCSSManifestReference
  dependencies: string[]
  warnings: string[]
  resources: StylesheetResourceAsset[]
}

function prepareGraphReferences(graph: PreparedCSSImportGraph, options: GraphOptions, referenceStack: readonly string[] = [], owners: Record<string, string> = {}, metadataOnly = false): GraphReferenceContext {
  const delivery = options.delivery!
  const references = [...referenceFileInputs(options.referenceFiles), ...Object.entries(graph.files).flatMap(([file, source]) => {
    // Keep parser diagnostics attached to the supplied source identity; only the
    // filesystem lookup of its references uses the host's original source owner.
    const references = compileCSSReferences(source, owners[file] ?? file)
    if (file === graph.entry && options.references) return options.references
    const owner = graph.baseFiles?.[file] ?? owners[file] ?? file
    return resolveReferenceOrigins(source, references.map(reference => ({ ...reference, file: owner })), owner, graph.sourceMaps?.[file])
  })]
  const entryFile = graph.baseFiles?.[graph.entry] ?? owners[graph.entry] ?? graph.entry
  const stack = [...referenceStack, ...(entryFile.startsWith('\0') ? [] : [existsSync(entryFile) ? realpathSync(entryFile) : resolve(entryFile)])]
  const reference: GraphReferenceContext = { dependencies: [], warnings: [], resources: [] }
  for (const item of references) {
    const file = resolveCSSReferenceFile(item, { root: options.projectDir })
    delivery.onDependency?.(file)
    const chain = [...stack, ...(item.file && !item.file.startsWith('\0') ? [existsSync(item.file) ? realpathSync(item.file) : resolve(item.file)] : [])]
    if (chain.includes(realpathSync(file))) throw new Error(`Circular CSS reference: ${[...stack, file].join(' -> ')}`)
    // A reference graph is definition context that is never delivered, so its
    // package imports resolve like the project manifest's, whatever the host's.
    const compiled = compileReferenceGraph(file, reference.manifest ?? options.baseManifest, options, chain, metadataOnly)
    reference.manifest = compiled.manifest
    reference.dependencies.push(...compiled.dependencies)
    reference.warnings.push(...compiled.warnings)
    reference.resources.push(...compiled.resources)
  }
  return reference
}

interface CompiledReferenceGraph {
  readonly manifest: MasterCSSManifestReference
  readonly dependencies: readonly string[]
  readonly warnings: readonly string[]
  readonly resources: readonly StylesheetResourceAsset[]
}

interface CachedReferenceGraph {
  readonly stamps: readonly FileStamp[]
  /** Every file the compilation read, to detect a referencing stylesheet among them. */
  readonly files: ReadonlySet<string>
  /** The dependencies it reported, replayed to later hosts in order. */
  readonly observed: readonly string[]
  readonly result: CompiledReferenceGraph
}

const REFERENCE_GRAPH_CAPACITY = 32
const withoutBaseManifest = {}
const referenceGraphs = new WeakMap<object, Map<string, CachedReferenceGraph>>()

const comparable = (file: string) => existsSync(file) ? realpathSync(file) : resolve(file)

/**
 * The definitions a graph reads from one `@reference`. Hosts deliver every local
 * stylesheet against the same project references, so a compilation is reused
 * while every file it read is unchanged. Graphs with resources are compiled
 * each time: their URLs belong to the delivering host.
 */
function compileReferenceGraph(file: string, baseManifest: MasterCSSManifestSource | undefined, options: GraphOptions, chain: readonly string[], metadataOnly: boolean): CompiledReferenceGraph {
  const delivery = options.delivery!
  const key = JSON.stringify([
    file, options.projectDir ?? '', metadataOnly, options.preserveNativeCSS ?? null, options.preserveNativeSource ?? null,
    options.pruneNativeCSS === true, delivery.inlineImports === true, delivery.relativeResourceURLs === true
  ])
  const cache = referenceGraphs.get(baseManifest ?? withoutBaseManifest)
  const cached = cache?.get(key)
  // A referencing stylesheet the definitions read is a cycle: compile to report it.
  if (cached && !chain.some(item => cached.files.has(item)) && fileStampsCurrent(cached.stamps)) {
    cache!.delete(key)
    cache!.set(key, cached)
    for (const dependency of cached.observed) delivery.onDependency?.(dependency)
    return cached.result
  }
  const startedAt = Date.now()
  const observed: string[] = []
  const onDependency = (dependency: string) => { observed.push(dependency); delivery.onDependency?.(dependency) }
  const referenceGraph = prepareCSSImportGraph(file, undefined, { projectDir: options.projectDir, onDependency, resolveNodePackageImports: true }, analyzeCSSDependencies)
  const compiled = compileGraph(referenceGraph, {
    ...options, referenceFiles: undefined, references: undefined, baseManifest, referenceContext: true,
    delivery: { ...delivery, onDependency }
  }, undefined, chain, {}, {}, [], metadataOnly)
  const result: CompiledReferenceGraph = {
    manifest: compiled.manifest,
    dependencies: compiled.directives.dependencies,
    warnings: compiled.directives.warnings,
    resources: compiled.resources
  }
  const read = [file, ...observed, ...result.dependencies]
  const stamps = !result.resources.length && settledFileStamps(read, startedAt)
  if (stamps) {
    let entries = cache
    if (!entries) referenceGraphs.set(baseManifest ?? withoutBaseManifest, entries = new Map())
    entries.delete(key)
    if (entries.size >= REFERENCE_GRAPH_CAPACITY) entries.delete(entries.keys().next().value!)
    entries.set(key, { stamps, files: new Set(read.map(comparable)), observed, result: Object.freeze({ ...result, dependencies: Object.freeze([...result.dependencies]), warnings: Object.freeze([...result.warnings]), resources: Object.freeze([]) }) })
  }
  return result
}

function compileGraph(graph: PreparedCSSImportGraph, options: GraphOptions, classes?: readonly string[], referenceStack: readonly string[] = [], owners: Record<string, string> = {}, classesByStylesheet: Record<string, string[] | null> = {}, nativeStylesheets?: string[], metadataOnly = false, inlineImports = false, hostImports: Record<string, string[]> = {}, preparedReference?: GraphReferenceContext): {
  manifest: MasterCSSManifestReference, resolutionManifest: MasterCSSManifestReference, directives: CompileCSSResult, resources: StylesheetResourceAsset[],
  stylesheets: { id: string, href: string, css: string, nativeCSS: string, generatedCSS: string, outputMappings: CSSOutputMapping[] }[]
} {
  const delivery = options.delivery!
  const prepared = prepareDelivery(graph, delivery, owners, metadataOnly)
  if (new Set(Object.values(prepared.urls)).size !== Object.keys(prepared.urls).length) {
    throw new TypeError('Each stylesheet variant requires a distinct delivery URL.')
  }
  const reference = preparedReference ?? prepareGraphReferences(graph, options, referenceStack, owners, metadataOnly)
  prepared.resources.push(...reference.resources)
  const binding = createCompilerBindingSessionSync()
  try {
    const result = binding.compileCSSStylesheetGraphWithReferences({
      graph,
      pruneNativeStylesheets: Object.keys(graph.files).filter(file => {
        const policy = collectStylesheetDirectives(graph.files[file], owners[file] ?? file, options.projectDir)
        return !policy.preserveNative && (policy.pruneNative || (options.pruneNativeCSS === true && !graph.packageFiles?.includes(file)))
      }),
      urls: prepared.urls,
      resourceURLs: inlineImports ? undefined : prepared.resourceURLs,
      // Delivered inlining keeps relocated resource URLs; Rust omits unreachable assets.
      inlineImports: inlineImports || delivery.inlineImports === true, hostImports,
      relativeResourceURLs: delivery.relativeResourceURLs,
      classesByStylesheet,
      nativeStylesheets,
      baseManifest: options.baseManifest,
      resolutionManifest: reference.manifest,
      ...(options.referenceContext ? { referenceContext: true } : {}),
      options: { preserveNativeCSS: options.preserveNativeCSS ?? true,
        ...(options.preserveNativeSource === undefined ? {} : { preserveNativeSource: options.preserveNativeSource }), ...(classes ? { classes: [...classes] } : {}) }
    })
    const directives = result.directives as unknown as CompileCSSResult
    directives.extractionPolicy = mergeCSSDirectiveExtractionPolicy(directives.extractionPolicy)
    directives.dependencies = [...new Set([...directives.dependencies.map(file => owners[file] ?? file), ...reference.dependencies, ...prepared.resources.map(({ file }) => file)])]
    directives.warnings = [...new Set([...directives.warnings, ...reference.warnings])]
    return { ...result, directives, resources: [...new Map(prepared.resources.map(asset => [asset.file, asset])).values()] }
  } catch (error) {
    if (error instanceof MasterCSSError && error.diagnostics.some(diagnostic => diagnostic.source && owners[diagnostic.source])) {
      throw new MasterCSSError({ ...error.payload, diagnostics: error.diagnostics.map(diagnostic => ({
        ...diagnostic,
        ...(diagnostic.source ? { source: owners[diagnostic.source] ?? diagnostic.source } : {})
      })) }, { cause: error })
    }
    throw error
  } finally { binding.dispose() }
}

/** Compile native resource usage without flattening imports or reading host-owned assets. */
export function compileStylesheetMetadata(file: string, source: string, options: GraphOptions) {
  const graph = prepareCSSImportGraph(file, source, { projectDir: options.projectDir }, analyzeCSSDependencies)
  if (!Object.values(graph.files).some(text => inspectCSS(text).hasMasterEntry)) return
  return compileGraph(graph, {
    ...options,
    delivery: {
      entryURL: pathToFileURL(file).href,
      stylesheetURL: id => pathToFileURL(id).href,
      resourceURL: id => pathToFileURL(id).href
    }
  }, undefined, [], {}, {}, undefined, true)
}

/** Compile one file and its dependencies for a host that publishes every asset. */
export function compileDeliveredFile(file: string, options: CompileStylesheetOptions) {
  const filename = resolve(options.projectDir ?? '', file)
  const delivery = options.delivery!
  if (delivery.resolveImport) throw new TypeError('Custom import resolution requires asynchronous stylesheet registration.')
  const graph = prepareCSSImportGraph(filename, undefined, {
    projectDir: options.projectDir, onDependency: delivery.onDependency, resolveNodePackageImports: delivery.resolveNodePackageImports
  }, analyzeCSSDependencies)
  const result = compileGraph(graph, {
    ...options,
    delivery: {
      ...delivery,
      stylesheetURL: (id, variant) => id === filename ? delivery.entryURL : delivery.stylesheetURL(id, variant)
    }
  }, options.classes)
  return { ...result, entry: graph.entry }
}

/** Compile supplied local CSS and its imports without flattening their boundaries. */
export async function compileDeliveredSource(id: string, source: string, options: TransformLocalStylesheetOptions, nativeClasses?: readonly string[]) {
  const filename = normalizeStylesheetGraphID(id), delivery = options.delivery!
  const graphOptions = { baseFile: delivery.baseFile ?? options.baseFile, sourceMap: delivery.sourceMap ?? options.sourceMap, projectDir: options.projectDir, onDependency: delivery.onDependency, resolveNodePackageImports: delivery.resolveNodePackageImports }
  const graph = delivery.resolveImport || graphOptions.baseFile || graphOptions.sourceMap
    ? await prepareCSSImportGraphWithResolver(filename, source, graphOptions, analyzeCSSDependencies, delivery.resolveImport ?? (() => undefined))
    : prepareCSSImportGraph(filename, source, graphOptions, analyzeCSSDependencies)
  const nativeGraph = (!options.transformNativeStylesheets || options.preserveUnchangedNativeCSS)
    && !Object.entries(graph.files).some(([file, source]) => hasLocalStyleDirectives(source, file))
  // The host still owns native URLs (including aliases) on a passthrough. Reuse
  // its reference context before deciding whether entry delivery is needed.
  let reference: GraphReferenceContext | undefined
  if (nativeGraph) {
    if (!options.transformNativeStylesheets) return
    reference = prepareGraphReferences(graph, options)
    if (!hasStylesheetResourceReferences(reference.manifest ?? options.baseManifest, graph.files[graph.entry])) return
  }
  const result = compileGraph(graph, {
    ...options,
    delivery: { ...delivery, stylesheetURL: (file, variant) => file === graph.entry ? delivery.entryURL : delivery.stylesheetURL(file, variant) }
  }, nativeClasses, [], {}, {}, undefined, false, false, {}, reference)
  const stylesheets = result.stylesheets.map(asset => ({ ...asset, sourceMap: stylesheetOutputMap(asset.css, asset.outputMappings, {
    file: asset.id, compilationFile: asset.id, source: graph.files[asset.id],
    sourceMap: graph.sourceMaps?.[asset.id], graph: { sources: graph.files }
  }) }))
  return { ...result, stylesheets, entry: graph.entry, outputMap: (css: string, mappings: CSSOutputMapping[], file = graph.entry) => stylesheetOutputMap(css, mappings, { file, compilationFile: file, source: graph.files[file], sourceMap: graph.sourceMaps?.[file], graph: { sources: graph.files } }) }
}

export async function registerDeliveredStylesheet(
  scanner: ScannerState, sources: StylesheetSources, id: string, source: string, options: CompileStylesheetOptions, inlineImports = false
) {
  const filename = normalizeStylesheetGraphID(id)
  const graphOptions = { baseFile: options.delivery?.baseFile, sourceMap: options.delivery?.sourceMap, projectDir: options.projectDir ?? scanner.cwd, onDependency: options.delivery?.onDependency, resolveNodePackageImports: options.delivery?.resolveNodePackageImports }
  const graph = options.delivery?.resolveImport || options.delivery?.baseFile || options.delivery?.sourceMap
    ? await prepareCSSImportGraphWithResolver(filename, source, graphOptions, analyzeCSSDependencies, options.delivery.resolveImport ?? (() => undefined))
    : prepareCSSImportGraph(filename, source, graphOptions, analyzeCSSDependencies)
  const directives = mergeStylesheetDirectives(...Object.entries(graph.files).map(([file, text]) => collectStylesheetDirectives(text, graph.baseFiles?.[file] ?? file, scanner.cwd)))
  const result = compileGraph(graph, options, undefined, [], {}, {}, undefined, inlineImports, inlineImports, inlineImports ? collectionHostImports(graph) : {})
  const scoped = mergeStylesheetSourceOptions({ ...scanner.options, exclude: scanner.customOptions ? scanner.customOptions.exclude : scanner.options.exclude }, directives)
  const sourceDependencies = hasStylesheetSourceDirectives(directives)
    ? resolveStylesheetSourcePaths(scoped, scanner.cwd).map(file => resolve(scanner.cwd, file)) : []
  const dependencies = [...new Set([...result.directives.dependencies, ...sourceDependencies])]
  const rootPolicy = collectStylesheetDirectives(graph.files[graph.entry])
  const pruneNativeCSS = !rootPolicy.preserveNative && (options.pruneNativeCSS === true || rootPolicy.pruneNative)
  const hasPruning = pruneNativeCSS || Object.values(graph.files).some(text => {
    const policy = collectStylesheetDirectives(text)
    return !policy.preserveNative && policy.pruneNative
  })
  if (inlineImports && hasPruning && result.directives.nativeClassNames.length && !scanner.registerNativeClasses) {
    throw new TypeError('Stylesheet scanner integrations require registerNativeClasses().')
  }
  const masterCSS = inlineImports && Object.values(graph.files).some(text => inspectCSS(text).hasMasterCSSImport)
  sources.set(filename, { source, graph, pruneNativeCSS, masterCSS, directives, dependencies, sourceDependencies,
    classIndependent: !hasPruning && !hasStylesheetSourceDirectives(directives) })
  scanner.registerNativeClasses?.(filename, result.directives.nativeClassNames)
  return { ...result.directives, dependencies }
}

export function composeDeliveredStylesheets(
  sources: StylesheetSources,
  options: CompileStylesheetOptions & { manifest?: MasterCSSManifest, includeGeneratedCSS?: boolean, includeNativeCSS?: boolean, includeMasterBaseCSS?: boolean },
  classes: readonly string[],
  styleClasses: (source: StylesheetSource) => readonly string[],
  inlineImports = false,
  generationClasses: (source: StylesheetSource) => readonly string[] = styleClasses
): Required<CreateExtractedCSSResult> {
  const entry = '\0master-css-output'
  const graph: PreparedCSSImportGraph = { entry, files: { [entry]: '' }, edges: [] }
  // Each root narrows its own scope; default discovery applies through roots without source policy.
  const generatedClasses = new Set(sources.size ? [] : classes)
  const owners: Record<string, string> = {}
  const classesByStylesheet: Record<string, string[] | null> = {}
  const nativeStylesheets: string[] = []
  const hostImports: Record<string, string[]> = {}
  for (const [id, source] of sources) {
    if (!source.graph) throw new TypeError('Standalone delivery requires graph registration for every stylesheet.')
    const specifier = `sheet-${graph.edges.length}`
    graph.files[entry] += `@import "${specifier}";\n`
    const masterFiles = new Set<string>()
    const pending = source.graph.edges.filter(edge => edge.specifier === '@master/css' || edge.specifier === '@master/css-preset').map(edge => edge.resolved)
    // Package ownership follows prepared filesystem edges; CSS semantics stay in Rust.
    while (pending.length) {
      const file = pending.pop()!
      if (masterFiles.has(file)) continue
      masterFiles.add(file)
      pending.push(...source.graph.edges.filter(edge => edge.from === file).map(edge => edge.resolved))
    }
    const scopedClasses = [...styleClasses(source)]
    const variant = (file: string) => `${file}\0${specifier}`
    for (const [file, text] of Object.entries(source.graph.files)) {
      const key = variant(file)
      graph.files[key] = text
      ;(graph.resourceOwners ??= {})[key] = source.graph.resourceOwners?.[file] ?? file
      if (source.graph.baseFiles?.[file]) (graph.baseFiles ??= {})[key] = source.graph.baseFiles[file]
      if (source.graph.sourceMaps?.[file]) (graph.sourceMaps ??= {})[key] = source.graph.sourceMaps[file]
      owners[key] = file
      const filePolicy = collectStylesheetDirectives(text, file, options.projectDir)
      classesByStylesheet[key] = !filePolicy.preserveNative
        && (filePolicy.pruneNative || (options.pruneNativeCSS === true && !source.graph.packageFiles?.includes(file))) ? scopedClasses : null
      if (masterFiles.has(file) ? options.includeMasterBaseCSS !== false : options.includeNativeCSS !== false) {
        nativeStylesheets.push(key)
      }
    }
    if (inlineImports) hostImports[variant(id)] = collectionHostImports(source.graph)[id]
    graph.edges.push({ from: entry, specifier, resolved: variant(id) }, ...source.graph.edges.map(edge => ({
      ...edge, from: variant(edge.from), resolved: variant(edge.resolved)
    })))
    for (const className of generationClasses(source)) generatedClasses.add(className)
  }
  const delivery = options.delivery!
  const result = compileGraph(graph, {
    ...options,
    baseManifest: options.manifest ?? options.baseManifest,
    delivery: { ...delivery, stylesheetURL: (file, variant) => file === entry ? delivery.entryURL : delivery.stylesheetURL(file, variant) }
  }, [...generatedClasses], [], owners, classesByStylesheet, nativeStylesheets, inlineImports, inlineImports, hostImports)
  if (inlineImports && result.stylesheets.length > 1) {
    throw new MasterCSSError({ code: 'CSS_IMPORT_ERROR', domain: 'compiler', message: 'This stylesheet retains import or resource boundaries and requires stylesheet asset delivery.' })
  }
  const rendered = renderCompiledManifestCSS({
    manifest: result.manifest,
    nativeCSS: result.stylesheets.map(asset => asset.css),
    classNames: generatedClasses,
    includeGeneratedCSS: options.includeGeneratedCSS
  })
  // References supply resources used by native declarations, while only the
  // public manifest can generate markup utilities for this collection.
  const referenced = renderCompiledManifestCSS({
    manifest: result.resolutionManifest,
    nativeCSS: result.stylesheets.map(asset => asset.css),
    includeGeneratedCSS: false,
    emittedGlobals: rendered.emittedGlobals
  })
  const css = [result.stylesheets.find(asset => asset.id === entry)?.css, rendered.generatedCSS, referenced.generatedCSS].filter(Boolean).join('\n')
  return {
    css,
    emittedGlobals: referenced.emittedGlobals,
    stylesheets: result.stylesheets.filter(asset => asset.id !== entry),
    resources: result.resources,
    dependencies: result.directives.dependencies.filter(file => file !== entry)
  }
}

/** Only the registered entry's unresolved imports are emitted by its host source.
 * Imported children's external boundaries still require explicit asset delivery.
 */
function collectionHostImports(graph: PreparedCSSImportGraph) {
  const local = new Set(graph.edges.filter(edge => edge.from === graph.entry).map(edge => edge.specifier))
  return { [graph.entry]: analyzeCSSDependencies(graph.files[graph.entry]).imports
    .map(imported => imported.source).filter(specifier => !local.has(specifier)) }
}
