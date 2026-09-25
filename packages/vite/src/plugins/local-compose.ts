import { withStylesheetDependencies } from '../utils/failed-stylesheet-dependencies'
import { withSassDiagnostics } from '../utils/sass-diagnostics'
import type { ModuleNode, Plugin, ViteDevServer } from 'vite'
import {
  discoverManifestEntries,
  loadProjectManifest
} from '@master/css-compiler/project'
import { defaultBuildManifest } from '@master/css-internal/project'
import {
  collectStylesheetEmittedGlobals,
  transformStylesheet,
  resolveStylesheet
} from '@master/css-compiler/stylesheet'
import {
  collectStylesheetDependenciesSync
} from '@master/css-compiler/node'
import type { MasterCSSVitePluginContext } from '../core'
import type { ResolvedMasterCSSVitePluginOptions } from '../options'
import { includesFile } from '../utils/path'
import { captureBuildStylesheetSource, clearBuildStylesheetSources, getBuildImportResolver } from '../utils/build-import-resolver'

import { getSassSourceFile, getPreparedSassSource, getPreparedSassSourceMap, isRawStyleRequest } from '../utils/build-sass-source'
import { getDevStylesheetDelivery, publishDevStylesheets } from '../utils/dev-stylesheet-delivery'
import { getBuildStylesheetDelivery } from '../utils/build-stylesheet-delivery'
import { inlineDelivery, isInlineStylesheet, registerLocalInlineStylesheet } from '../utils/inline-stylesheet'
import { clearLocalStylesheets, registerLocalStylesheet } from '../utils/local-stylesheet'

function invalidateModule(module: ModuleNode | undefined, server: ViteDevServer): boolean {
  if (!module) return false
  server.moduleGraph.invalidateModule(module)
  return true
}

export default function LocalComposePlugin(options: ResolvedMasterCSSVitePluginOptions, context: MasterCSSVitePluginContext): Plugin {
  let projectManifest: Awaited<ReturnType<typeof loadProjectManifest>> | undefined
  let projectManifestEntries: string[] = []
  let projectManifestDependencies: string[] = []
  let styleEntryEmittedGlobals: Awaited<ReturnType<typeof collectStylesheetEmittedGlobals>> | undefined
  const localComposeModules = new Set<string>()

  const addServerAllow = (paths: string[]) => {
    const allow = context.config?.server.fs.allow
    if (!allow) return
    for (const path of paths) {
      if (!allow.includes(path)) allow.push(path)
    }
  }

  const loadComposeContext = async (pluginContext: { addWatchFile?: (id: string) => void }) => {
    if (projectManifest) return projectManifest
    const root = context.config?.root
    const entries = await discoverManifestEntries({ root })
    projectManifestEntries = [...entries]
    const dependencies = new Set<string>()
    for (const entry of entries) {
      for (const dependency of collectStylesheetDependenciesSync(entry, undefined, { projectDir: root })) {
        dependencies.add(dependency)
      }
    }
    projectManifestDependencies = [...dependencies]
    addServerAllow(projectManifestDependencies)
    for (const dependency of projectManifestDependencies) {
      pluginContext.addWatchFile?.(dependency)
    }
    projectManifest = await loadProjectManifest({
      root,
      entries,
      baseManifest: defaultBuildManifest
    })
    for (const dependency of projectManifest.dependencies) {
      if (dependencies.has(dependency)) continue
      dependencies.add(dependency)
      pluginContext.addWatchFile?.(dependency)
    }
    projectManifestDependencies = [...dependencies]
    addServerAllow(projectManifestDependencies)
    return projectManifest
  }

  const loadStyleEntryEmittedGlobals = async (pluginContext: { addWatchFile?: (id: string) => void }) => {
    const manifestResult = await loadComposeContext(pluginContext)
    if (styleEntryEmittedGlobals) return styleEntryEmittedGlobals
    const dependencies = new Set(projectManifestDependencies)
    styleEntryEmittedGlobals = await collectStylesheetEmittedGlobals(projectManifestEntries, {
      baseManifest: manifestResult.manifest,
      projectDir: context.config?.root
    })
    for (const dependency of styleEntryEmittedGlobals.dependencies) {
      dependencies.add(dependency)
      pluginContext.addWatchFile?.(dependency)
    }
    projectManifestDependencies = [...dependencies]
    addServerAllow(projectManifestDependencies)
    return styleEntryEmittedGlobals
  }

  return {
    name: 'master-css:local-compose',
    enforce: 'pre',
    async buildStart() {
      clearBuildStylesheetSources(context)
      if (context.config?.command === 'build') clearLocalStylesheets(context)
      projectManifest = undefined
      projectManifestEntries = []
      projectManifestDependencies = []
      styleEntryEmittedGlobals = undefined
    },
    async transform(code, id) {
      return withStylesheetDependencies(context, this, id, onDependency => withSassDiagnostics(context, async () => {
        if (isRawStyleRequest(id)) return
        const dependencyHost = { addWatchFile: onDependency, resolve: this.resolve?.bind(this), load: this.load?.bind(this) }
        const sourceMeta = captureBuildStylesheetSource(context, id, code)
        if (id.startsWith('\0') && context.config?.command !== 'build') return
        const resolution = await resolveStylesheet(id, code, {
          projectDir: context.config?.root,
          baseFile: getSassSourceFile(id),
          preserveImports: true,
          resolveImport: getBuildImportResolver(context, dependencyHost),
          onDependency
        })
        const prepared = getPreparedSassSource(context, id)
        const moduleGraph = prepared && (await prepared.prepared).moduleSources
        const nativeModuleGraph = resolution?.kind === 'plain' && Boolean(moduleGraph && moduleGraph.size > 1)
        if (resolution?.kind !== 'local' && !nativeModuleGraph) return sourceMeta ? { meta: sourceMeta } : undefined

        const dependencies = new Set(resolution.dependencies)
        for (const dependency of dependencies) {
          onDependency(dependency)
        }
        const manifestResult = await loadComposeContext(dependencyHost)
        const emittedGlobalsResult = await loadStyleEntryEmittedGlobals(dependencyHost)
        const inline = context.config?.command === 'build' && isInlineStylesheet(id)
        const delivery = inline ? inlineDelivery(context) : getBuildStylesheetDelivery(context) ?? getDevStylesheetDelivery(context)
        const result = await transformStylesheet(id, code, {
          transformNativeStylesheets: nativeModuleGraph,
          baseManifest: manifestResult.manifest,
          projectDir: context.config?.root,
          emittedGlobals: emittedGlobalsResult.emittedGlobals,
          ...(delivery ? { delivery: {
            ...delivery, baseFile: getSassSourceFile(id), sourceMap: await getPreparedSassSourceMap(context, id), resolveImport: getBuildImportResolver(context, dependencyHost),
            onDependency
          } } : {})
        })
        if (!result.transformed) return sourceMeta ? { meta: sourceMeta } : undefined
        localComposeModules.add(id)
        for (const dependency of result.dependencies) {
          if (dependencies.has(dependency)) continue
          onDependency(dependency)
        }
        let output = result.code
        if (inline) registerLocalInlineStylesheet(context, id, result)
        else if (context.config?.command === 'build') {
          // Vue scopes selectors after this transform. Keep native rules in
          // that pipeline, while the generated theme rules remain global.
          const scopedVueStyle = id.includes('?vue&') && /(?:^|[?&])scoped(?:=|&|$)/u.test(id)
          if (scopedVueStyle && result.compilation && !result.stylesheets?.length) {
            const { nativeCSS, generatedCSS } = result.compilation
            if (generatedCSS) {
              const slot = registerLocalStylesheet(context, id, { ...result, code: generatedCSS })
              output = `${nativeCSS}\n:global(${slot.slice(0, slot.indexOf('{'))})${slot.slice(slot.indexOf('{'))}`
            } else output = nativeCSS
          } else output = registerLocalStylesheet(context, id, result)
        }
        else if (context.config?.command === 'serve') output = publishDevStylesheets(context, { ...result, css: result.code, emittedGlobals: emittedGlobalsResult.emittedGlobals }, '#master-css-local-slot{--slot:0}')
        return {
          code: output,
          map: null,
          ...(sourceMeta ? { meta: sourceMeta } : {})
        }
      }))
    },
    async handleHotUpdate({ file, server }) {
      if (!includesFile(projectManifestDependencies, file)) return
      projectManifest = undefined
      projectManifestEntries = []
      projectManifestDependencies = []
      styleEntryEmittedGlobals = undefined
      let handled = false
      for (const moduleId of localComposeModules) {
        const module = server.moduleGraph.getModuleById(moduleId)
        handled ||= Boolean(module)
        invalidateModule(module, server)
        if (module) await server.reloadModule(module)
      }
      if (handled) return []
    }
  }
}
