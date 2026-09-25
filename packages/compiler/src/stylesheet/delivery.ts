/** @internal Filesystem preparation and standalone stylesheet asset composition. */
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createCompilerBindingSessionSync } from '@master/css-binding/compiler/node'
import { prepareCSSImportGraph, prepareCSSImportGraphWithResolver, normalizeStylesheetGraphID, type PreparedCSSImportGraph, type CSSImportFileResolver } from '../node-imports'
import { analyzeCSSDependencies, compileCSS, inspectCSS, resolveCSSReferenceFile, mergeCSSDirectiveExtractionPolicy } from '../node-compiler'
import { collectStylesheetDirectives, mergeStylesheetDirectives, mergeStylesheetSourceOptions, hasStylesheetSourceDirectives, resolveStylesheetSourcePaths, hasLocalStyleDirectives } from './directives'
import { renderCompiledManifestCSS } from './render'
import { resolveReferenceOrigins } from './reference-origins'
import { stylesheetOutputMap } from './output-map'
import type { CSSOutputMapping } from '@master/css-schema/css-directives'
import { MasterCSSError } from '@master/css-schema'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { CompileCSSResult } from '../contracts'
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

function compileGraph(graph: PreparedCSSImportGraph, options: CompileStylesheetOptions, classes?: readonly string[], referenceStack: readonly string[] = [], owners: Record<string, string> = {}, classesByStylesheet: Record<string, string[] | null> = {}, nativeStylesheets?: string[], metadataOnly = false, inlineImports = false, hostImports: Record<string, string[]> = {}): {
  manifest: MasterCSSManifest, resolutionManifest: MasterCSSManifest, directives: CompileCSSResult, resources: StylesheetResourceAsset[],
  stylesheets: { id: string, href: string, css: string, nativeCSS: string, generatedCSS: string, outputMappings: CSSOutputMapping[] }[]
} {
  const delivery = options.delivery!
  const prepared = prepareDelivery(graph, delivery, owners, metadataOnly)
  if (new Set(Object.values(prepared.urls)).size !== Object.keys(prepared.urls).length) {
    throw new TypeError('Each stylesheet variant requires a distinct delivery URL.')
  }
  const references = Object.entries(graph.files).flatMap(([file, source]) => {
    // Keep parser diagnostics attached to the supplied source identity; only the
    // filesystem lookup of its references uses the host's original source owner.
    const parsed = compileCSS(source, { from: owners[file] ?? file })
    if (file === graph.entry && options.references) return options.references
    const references = parsed.references || []
    const owner = graph.baseFiles?.[file] ?? owners[file] ?? file
    return resolveReferenceOrigins(source, references.map(reference => ({ ...reference, file: owner })), owner, graph.sourceMaps?.[file])
  })
  const entryFile = graph.baseFiles?.[graph.entry] ?? owners[graph.entry] ?? graph.entry
  const stack = [...referenceStack, ...(entryFile.startsWith('\0') ? [] : [existsSync(entryFile) ? realpathSync(entryFile) : resolve(entryFile)])]
  const reference = { manifest: undefined as MasterCSSManifest | undefined, dependencies: [] as string[], warnings: [] as string[] }
  for (const item of references) {
    const file = resolveCSSReferenceFile(item, { root: options.projectDir })
    delivery.onDependency?.(file)
    const chain = [...stack, ...(item.file && !item.file.startsWith('\0') ? [existsSync(item.file) ? realpathSync(item.file) : resolve(item.file)] : [])]
    if (chain.includes(realpathSync(file))) throw new Error(`Circular CSS reference: ${[...stack, file].join(' -> ')}`)
    const referenceGraph = prepareCSSImportGraph(file, undefined, { projectDir: options.projectDir, onDependency: delivery.onDependency, resolveNodePackageImports: delivery.resolveNodePackageImports }, analyzeCSSDependencies)
    const compiled = compileGraph(referenceGraph, { ...options, references: undefined, baseManifest: reference.manifest ?? options.baseManifest }, undefined, chain, {}, {}, undefined, metadataOnly)
    reference.manifest = compiled.manifest
    reference.dependencies.push(...compiled.directives.dependencies)
    reference.warnings.push(...compiled.directives.warnings)
    prepared.resources.push(...compiled.resources)
  }
  const binding = createCompilerBindingSessionSync()
  try {
    const result = binding.compileCSSStylesheetGraph({
      graph,
      pruneNativeStylesheets: Object.keys(graph.files).filter(file => {
        const policy = collectStylesheetDirectives(graph.files[file], owners[file] ?? file, options.projectDir)
        return !policy.preserveNative && (policy.pruneNative || (options.pruneNativeCSS === true && !graph.packageFiles?.includes(file)))
      }),
      urls: prepared.urls,
      resourceURLs: inlineImports ? undefined : prepared.resourceURLs,
      inlineImports, hostImports,
      relativeResourceURLs: delivery.relativeResourceURLs,
      classesByStylesheet,
      nativeStylesheets,
      baseManifest: options.baseManifest,
      resolutionManifest: reference.manifest,
      options: { preserveNativeCSS: options.preserveNativeCSS ?? true,
        ...(options.preserveNativeSource === undefined ? {} : { preserveNativeSource: options.preserveNativeSource }), ...(classes ? { classes: [...classes] } : {}) }
    })
    const directives = result.directives as unknown as CompileCSSResult
    directives.extractionPolicy = mergeCSSDirectiveExtractionPolicy(directives.extractionPolicy)
    directives.dependencies = [...new Set([...directives.dependencies.map(file => owners[file] ?? file), ...reference.dependencies, ...prepared.resources.map(({ file }) => file)])]
    directives.warnings = [...new Set([...directives.warnings, ...reference.warnings])]
    return { ...result, manifest: result.manifest as MasterCSSManifest, directives, resources: [...new Map(prepared.resources.map(asset => [asset.file, asset])).values()] }
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
export function compileStylesheetMetadata(file: string, source: string, options: CompileStylesheetOptions) {
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
  const graphOptions = { baseFile: delivery.baseFile, sourceMap: delivery.sourceMap, projectDir: options.projectDir, onDependency: delivery.onDependency, resolveNodePackageImports: delivery.resolveNodePackageImports }
  const graph = delivery.resolveImport || delivery.baseFile || delivery.sourceMap
    ? await prepareCSSImportGraphWithResolver(filename, source, graphOptions, analyzeCSSDependencies, delivery.resolveImport ?? (() => undefined))
    : prepareCSSImportGraph(filename, source, graphOptions, analyzeCSSDependencies)
  if (!options.transformNativeStylesheets && !Object.entries(graph.files).some(([file, source]) => hasLocalStyleDirectives(source, file))) return
  const result = compileGraph(graph, {
    ...options,
    delivery: { ...delivery, stylesheetURL: (file, variant) => file === graph.entry ? delivery.entryURL : delivery.stylesheetURL(file, variant) }
  }, nativeClasses)
  const stylesheets = result.stylesheets.map(asset => ({ ...asset, sourceMap: stylesheetOutputMap(asset.css, asset.outputMappings, {
    file: asset.id, compilationFile: asset.id, source: graph.files[asset.id],
    sourceMap: graph.sourceMaps?.[asset.id], graph: { sources: graph.files }
  }) }))
  return { ...result, stylesheets, entry: graph.entry }
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
  const pruneNativeCSS = options.pruneNativeCSS === true || Object.values(graph.files).some(text => collectStylesheetDirectives(text).pruneNative)
  if (inlineImports && pruneNativeCSS && !scanner.registerNativeClasses) {
    throw new TypeError('Stylesheet scanner integrations require registerNativeClasses().')
  }
  const masterCSS = inlineImports && Object.values(graph.files).some(text => inspectCSS(text).hasMasterCSSImport)
  sources.set(filename, { source, graph, pruneNativeCSS, masterCSS, directives, dependencies, sourceDependencies })
  scanner.registerNativeClasses?.(filename, result.directives.nativeClassNames)
  return { ...result.directives, dependencies }
}

export function composeDeliveredStylesheets(
  sources: StylesheetSources,
  options: CompileStylesheetOptions & { manifest?: MasterCSSManifest, includeGeneratedCSS?: boolean, includeNativeCSS?: boolean, includeMasterBaseCSS?: boolean },
  classes: readonly string[],
  styleClasses: (source: StylesheetSource) => readonly string[],
  inlineImports = false
): Required<CreateExtractedCSSResult> {
  const entry = '\0master-css-output'
  const graph: PreparedCSSImportGraph = { entry, files: { [entry]: '' }, edges: [] }
  const generatedClasses = new Set(classes)
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
    for (const className of scopedClasses) generatedClasses.add(className)
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
    manifest: result.manifest as MasterCSSManifest,
    nativeCSS: result.stylesheets.map(asset => asset.css),
    classNames: generatedClasses,
    includeGeneratedCSS: options.includeGeneratedCSS
  })
  const css = `${result.directives.css}\n${rendered.generatedCSS}`
  return {
    css,
    emittedGlobals: rendered.emittedGlobals,
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
