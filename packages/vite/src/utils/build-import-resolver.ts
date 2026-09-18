import { moduleSourceID, moduleSourceOwner } from './module-sources'
import { isAbsolute } from 'node:path'
import { getSassSourceFile, getPreparedSassSource, getPreparedSassSourceMap, prepareBuildSassSource, sassSourceID } from './build-sass-source'
import type { MasterCSSStylesheetImportResolver } from '@master/css-compiler/stylesheet'
import type { MasterCSSVitePluginContext } from '../core'

interface ImportResolverContext {
  resolve?: (id: string, importer: string, options: { skipSelf: true }) => Promise<{ id: string, external?: boolean | string } | null>
  addWatchFile?: (id: string) => void
  load?: (options: { id: string }) => Promise<{ meta: Record<string, unknown> }>
}

interface BuildSourceState {
  sources: Map<string, string>
  importedModules: Set<string>
}
const SOURCE_META = 'master-css:stylesheet-source'
const states = new WeakMap<MasterCSSVitePluginContext, BuildSourceState>()
function state(context: MasterCSSVitePluginContext) {
  let result = states.get(context)
  if (!result) { result = { sources: new Map(), importedModules: new Set() }; states.set(context, result) }
  return result
}

export function clearBuildStylesheetSources(context: MasterCSSVitePluginContext) {
  states.delete(context)
}

/** Capture loader CSS before Master or Vite transforms replace it. */
export function captureBuildStylesheetSource(context: MasterCSSVitePluginContext, id: string, source: string) {
  if (context.config?.command !== 'build' || !/\.css(?:[?#].*)?$/i.test(id)) return
  state(context).sources.set(id, source)
  return { [SOURCE_META]: source }
}

/** Graph-only loads must not create another unconditional stylesheet entry. */
export function removeGraphOnlyStylesheetEntries(context: MasterCSSVitePluginContext, getModuleInfo: (id: string) => { importers: readonly string[], dynamicImporters: readonly string[] } | null) {
  for (const id of state(context).importedModules) {
    const info = getModuleInfo(id)
    if (info && !info.importers.length && !info.dynamicImporters.length) context.stylesheets?.delete(id)
  }
}

/** Reuse Vite/plugin resolution, including aliases and browser import conditions. */
export function getBuildImportResolver(context: MasterCSSVitePluginContext, plugin: ImportResolverContext): MasterCSSStylesheetImportResolver | undefined {
  if (!plugin.resolve) return
  return async (specifier, importer) => {
    if (/^(?:https?:|data:|\/\/|#)/i.test(specifier)) return null
    const scoped = moduleSourceOwner(importer)
    const owner = scoped?.owner ?? getSassSourceFile(importer)
    const result = await plugin.resolve!(specifier, scoped?.file ?? owner ?? importer, { skipSelf: true })
    if (!result) return
    if (result.external) return null
    const sassFile = getSassSourceFile(result.id)
    const originalFile = sassFile ?? result.id.replace(/[?#].*$/, '')
    const preparedOwner = owner && getPreparedSassSource(context, owner)
    const scopedSource = preparedOwner && (await preparedOwner.prepared).moduleSources?.get(originalFile)
    if (typeof scopedSource === 'string') {
      plugin.addWatchFile?.(originalFile)
      const id = moduleSourceID(owner!, originalFile)
      return { id, source: scopedSource, baseFile: originalFile, sourceMap: await getPreparedSassSourceMap(context, id) }
    }
    if (sassFile) {
      plugin.addWatchFile?.(sassFile)
      const prepared = await prepareBuildSassSource(context, sassFile, file => plugin.addWatchFile?.(file))
      for (const dependency of prepared.deps ?? []) plugin.addWatchFile?.(dependency)
      return { id: sassSourceID(sassFile), source: prepared.code, baseFile: sassFile, sourceMap: await getPreparedSassSourceMap(context, sassFile) }
    }
    const file = result.id.replace(/(\.(?:css|scss|sass))(?:[?#].*)$/i, '$1')
    if (isAbsolute(file) && /\.(?:scss|sass)$/i.test(file)) {
      plugin.addWatchFile?.(file)
      const prepared = await prepareBuildSassSource(context, file, file => plugin.addWatchFile?.(file))
      for (const dependency of prepared.deps ?? []) plugin.addWatchFile?.(dependency)
      return { id: file, source: prepared.code, baseFile: file, sourceMap: await getPreparedSassSourceMap(context, file) }
    }
    if (isAbsolute(file) && /\.css$/i.test(file)) return file
    if (result.id.startsWith('\0') && /\.css(?:[?#].*)?$/i.test(result.id) && plugin.load) {
      const loaded = state(context)
      loaded.importedModules.add(result.id)
      if (!loaded.sources.has(result.id)) {
        const info = await plugin.load({ id: result.id })
        const cachedSource = info.meta[SOURCE_META]
        if (!loaded.sources.has(result.id) && typeof cachedSource === 'string') loaded.sources.set(result.id, cachedSource)
      }
      const source = loaded.sources.get(result.id)
      if (source === undefined) throw new Error(`CSS loader did not provide source: ${result.id}`)
      return { id: result.id, source, baseFile: getSassSourceFile(result.id) }
    }
    // Master package root modules resolve as JS; Node retains its CSS style fallback.
  }
}
