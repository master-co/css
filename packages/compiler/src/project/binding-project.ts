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

function prepareManifestGraph(entry: string, projectDir: string, onDependency?: (file: string) => void) {
  const graph = prepareCSSImportGraph(entry, undefined, { projectDir, onDependency }, analyzeCSSDependencies)
  const pending = Object.keys(graph.files)
  const visited = new Set<string>()
  while (pending.length) {
    const file = pending.shift()!
    if (visited.has(file)) continue
    visited.add(file)
    for (const reference of compileCSS(graph.files[file], { from: file }).references || []) {
      const target = resolveCSSReferenceFile(reference, { root: projectDir })
      const referenced = prepareCSSImportGraph(target, undefined, { projectDir, onDependency }, analyzeCSSDependencies)
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

export function loadBindingProjectManifest(
  projectDir: string,
  baseManifest: MasterCSSManifest,
  entries?: readonly string[],
  onDependency?: (file: string) => void,
  includeSourceGraph = false
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
  const resolvedEntries = (entries ?? compiler.findManifestEntries(projectDir)).map(preservePath)
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
