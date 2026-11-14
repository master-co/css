import { createCompilerBindingSessionSync } from '@master/css-binding/compiler/node'
import type { CSSDirectiveExtractionPolicy } from '@master/css-schema/css-directives'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  analyzeCSSDependencies,
  compileCSS,
  resolveCSSReferenceFile,
  stripWindowsExtendedPathPrefix
} from '../node-compiler'
import { realpathSync } from 'node:fs'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
import { prepareCSSImportGraph } from '../node-imports'
import type { MasterCSSProjectSourceGraph } from './options'
import { fileStampsCurrent, settledFileStamps, type FileStamp } from '../file-stamps'
import { deepFreeze } from '../deep-freeze'

// Package specifiers resolve as the build delivery resolves them, so editor, lint
// and MCP manifests see the definitions a shared workspace stylesheet supplies.
function prepareManifestGraph(entry: string, projectDir: string, onDependency?: (file: string) => void) {
  const graph = prepareCSSImportGraph(entry, undefined, { projectDir, onDependency, resolveNodePackageImports: true }, analyzeCSSDependencies)
  const pending = Object.keys(graph.files)
  const visited = new Set<string>()
  while (pending.length) {
    const file = pending.shift()!
    if (visited.has(file)) continue
    visited.add(file)
    for (const reference of compileCSS(graph.files[file], { from: file }).references || []) {
      const target = resolveCSSReferenceFile(reference, { root: projectDir })
      const referenced = prepareCSSImportGraph(target, undefined, { projectDir, onDependency, resolveNodePackageImports: true }, analyzeCSSDependencies)
      graph.edges.push({ from: file, specifier: reference.source, resolved: referenced.entry }, ...referenced.edges)
      Object.assign(graph.files, referenced.files)
      Object.assign(graph.resourceOwners ??= {}, referenced.resourceOwners)
      pending.push(...Object.keys(referenced.files).filter(id => !visited.has(id)))
    }
  }
  return graph
}

interface BindingProjectSourceEntryPlan {
  entry: string
  include: string[]
  exclude: string[]
  files: string[]
}

interface BindingProjectManifestResult {
  sourceGraph?: MasterCSSProjectSourceGraph
  entries: string[]
  manifest: MasterCSSManifest
  dependencies: string[]
  extractionPolicy: CSSDirectiveExtractionPolicy
  classNames: string[]
  nativeClassNames: string[]
  nativeCSS: string
  css: string
  generatedCSS: string
  warnings: string[]
  sourcePlan: {
    version: 1
    entries: BindingProjectSourceEntryPlan[]
    files: string[]
  }
}

function isProjectPath(root: string, file: string) {
  const local = relative(root, file)
  return local !== '..' && !local.startsWith(`..${sep}`) && !isAbsolute(local)
    && !local.split(sep).includes('node_modules')
}

interface CachedProjectManifest {
  readonly stamps: readonly FileStamp[]
  /** The dependencies in the order the load observed them, replayed to hosts. */
  readonly observed: readonly string[]
  readonly result: BindingProjectManifestResult
}

const PROJECT_CACHE_CAPACITY = 8
const projectManifests = new WeakMap<MasterCSSManifest, Map<string, CachedProjectManifest>>()

/**
 * Build hosts without a watcher of their own, such as the Next and Webpack
 * loaders, load the project manifest for every stylesheet they transform.
 * Reuse a load while its entries and every file it read are unchanged.
 */
export function loadBindingProjectManifest(
  projectDir: string,
  baseManifest: MasterCSSManifest,
  entries?: readonly string[],
  onDependency?: (file: string) => void,
  includeSourceGraph = false
): BindingProjectManifestResult {
  const resolvedEntries = entries ?? createCompilerBindingSessionSync().findManifestEntries(projectDir)
  const key = JSON.stringify([resolve(projectDir), includeSourceGraph, resolvedEntries])
  let cache = projectManifests.get(baseManifest)
  const cached = cache?.get(key)
  if (cached && fileStampsCurrent(cached.stamps)) {
    cache!.delete(key)
    cache!.set(key, cached)
    for (const file of cached.observed) onDependency?.(file)
    return cached.result
  }
  const startedAt = Date.now()
  const observed: string[] = []
  const result = loadProjectManifestNow(projectDir, baseManifest, resolvedEntries, file => {
    observed.push(file)
    onDependency?.(file)
  }, includeSourceGraph)
  const stamps = settledFileStamps([...result.entries, ...observed, ...result.dependencies], startedAt)
  if (stamps) {
    if (!cache) projectManifests.set(baseManifest, cache = new Map())
    cache.delete(key)
    if (cache.size >= PROJECT_CACHE_CAPACITY) cache.delete(cache.keys().next().value!)
    cache.set(key, { stamps, observed, result: deepFreeze(result) })
  }
  return result
}

function loadProjectManifestNow(
  projectDir: string,
  baseManifest: MasterCSSManifest,
  entries: readonly string[],
  onDependency: (file: string) => void,
  includeSourceGraph: boolean
): BindingProjectManifestResult {
  const compiler = createCompilerBindingSessionSync()
  const root = resolve(projectDir)
  let realRoot = root
  try {
    realRoot = resolve(stripWindowsExtendedPathPrefix(realpathSync.native(root)))
  } catch {
    // The binding project layer reports unreadable project roots with its typed error.
  }
  const preservePath = (file: string) => {
    const absoluteFile = resolve(stripWindowsExtendedPathPrefix(file))
    return realRoot !== root
      && (absoluteFile === realRoot || absoluteFile.startsWith(`${realRoot}${sep}`))
      ? join(root, relative(realRoot, absoluteFile))
      : absoluteFile
  }
  const resolvedEntries = entries.map(preservePath)
  const observed = new Set<string>()
  const dependency = onDependency ? (file: string) => {
    const path = preservePath(file)
    if (observed.has(path)) return
    observed.add(path)
    onDependency(path)
  } : undefined
  const graphs = resolvedEntries.map((entry) => ({
    entry,
    source: '',
    dependencies: [],
    manifestGraph: prepareManifestGraph(entry, projectDir, dependency)
  }))
  const result = compiler.loadPreparedProjectManifest(
    projectDir,
    baseManifest,
    graphs
  ) as BindingProjectManifestResult
  if (includeSourceGraph) {
    const files = new Map<string, string>()
    const edges = new Map<string, { from: string, specifier: string, resolved: string }>()
    for (const { manifestGraph } of graphs) {
      for (const [source, content] of Object.entries(manifestGraph.files)) files.set(preservePath(source), content)
      for (const edge of manifestGraph.edges) {
        const value = { from: preservePath(edge.from), specifier: edge.specifier, resolved: preservePath(edge.resolved) }
        edges.set(JSON.stringify(value), value)
      }
    }
    result.sourceGraph = Object.freeze({
      version: 1,
      files: Object.freeze([...files].map(([source, content]) => Object.freeze({
        source,
        content,
        projectOwned: isProjectPath(root, source)
          && isProjectPath(realRoot, stripWindowsExtendedPathPrefix(realpathSync.native(source)))
      }))),
      edges: Object.freeze([...edges.values()].map(edge => Object.freeze(edge)))
    })
  }
  result.entries = result.entries.map(preservePath)
  result.dependencies = result.dependencies.map(preservePath)
  result.sourcePlan.files = result.sourcePlan.files.map(preservePath)
  result.sourcePlan.entries = result.sourcePlan.entries.map((entry) => ({
    ...entry,
    entry: preservePath(entry.entry),
    files: entry.files.map(preservePath)
  }))
  return result
}
