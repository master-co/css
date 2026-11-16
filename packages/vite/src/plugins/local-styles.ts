import { withStylesheetDependencies } from '../utils/failed-stylesheet-dependencies'
import { withSassDiagnostics } from '../utils/sass-diagnostics'
import type { Plugin, ViteDevServer } from 'vite'
import {
  discoverManifestEntries,
  loadProjectManifest
} from '@master/css-compiler/project'
import { defaultBuildManifest } from '@master/css-internal/project'
import {
  transformStylesheet,
  resolveStylesheet
} from '@master/css-compiler/stylesheet'
import {
  collectStylesheetDependenciesSync,
  inspectCSSSync
} from '@master/css-compiler/node'
import { readFileSync } from 'node:fs'
import type { MasterCSSVitePluginContext } from '../core'
import type { ResolvedMasterCSSVitePluginOptions } from '../options'
import { includesFile } from '../utils/path'
import { captureBuildStylesheetSource, clearBuildStylesheetSources, getBuildImportResolver } from '../utils/build-import-resolver'

import { getSassSourceFile, getPreparedSassSource, getPreparedSassSourceMap, isRawStyleRequest } from '../utils/build-sass-source'
import { getDevStylesheetDelivery, publishDevGlobalStylesheet, publishDevStylesheets } from '../utils/dev-stylesheet-delivery'
import { getBuildStylesheetDelivery } from '../utils/build-stylesheet-delivery'
import { inlineDelivery, isInlineStylesheet, registerLocalInlineStylesheet } from '../utils/inline-stylesheet'
import { clearLocalStylesheets, registerLocalStylesheet } from '../utils/local-stylesheet'
import { clearSharedGlobals, registerSharedGlobals, setStyleEntryMissing, sharesGlobalsWithStyleEntry } from '../utils/shared-globals'
import { refreshGeneratedModule } from '../utils/dev-module-refresh'
import { clearDuplicatedImports, reportDuplicatedImports } from '../utils/duplicated-imports'

function declaresManifestEntry(file: string) {
  try {
    return inspectCSSSync(readFileSync(file, 'utf8')).hasMasterEntry
  } catch {
    return false
  }
}

/** How long a development server may stay idle before a style entry is considered absent. */
const STYLE_ENTRY_GRACE = 1000

interface StylesheetDependencyHost { addWatchFile?: (id: string) => void }

export default function LocalStylesPlugin(options: ResolvedMasterCSSVitePluginOptions, context: MasterCSSVitePluginContext): Plugin {
  let projectManifest: Awaited<ReturnType<typeof loadProjectManifest>> | undefined
  let projectManifestEntries: string[] = []
  let projectManifestDependencies: string[] = []
  let manifestGeneration = 0
  let loadingManifest: { generation: number, dependencies: Set<string>, hosts: Set<StylesheetDependencyHost>, promise: Promise<Awaited<ReturnType<typeof loadProjectManifest>>> } | undefined
  const localStyleModules = new Set<string>()
  let expectStyleEntry: (() => void) | undefined
  let lastLocalStyle = 0

  const addServerAllow = (paths: string[]) => {
    const allow = context.config?.server.fs.allow
    if (!allow) return
    for (const path of paths) {
      if (!allow.includes(path)) allow.push(path)
    }
  }

  const loadStyleContext = async (pluginContext: StylesheetDependencyHost) => {
    if (projectManifest) {
      for (const dependency of projectManifestDependencies) pluginContext.addWatchFile?.(dependency)
      return projectManifest
    }
    if (!loadingManifest) {
      const generation = manifestGeneration
      const dependencies = new Set<string>()
      const hosts = new Set<StylesheetDependencyHost>()
      const observe = (file: string) => {
        if (dependencies.has(file)) return
        dependencies.add(file)
        for (const host of hosts) host.addWatchFile?.(file)
      }
      const promise = (async () => {
        const root = context.config?.root
        const entries = await discoverManifestEntries({ root })
        if (generation === manifestGeneration) projectManifestEntries = [...entries]
        try {
          for (const entry of entries) {
            for (const dependency of collectStylesheetDependenciesSync(entry, undefined, { projectDir: root })) observe(dependency)
          }
          const result = await loadProjectManifest({ root, entries, baseManifest: defaultBuildManifest, onDependency: observe })
          for (const dependency of result.dependencies) observe(dependency)
          if (generation === manifestGeneration) projectManifest = result
          return result
        } finally {
          if (generation === manifestGeneration) {
            projectManifestDependencies = [...dependencies]
            addServerAllow(projectManifestDependencies)
          }
        }
      })()
      loadingManifest = { generation, dependencies, hosts, promise }
    }
    const operation = loadingManifest
    operation.hosts.add(pluginContext)
    for (const dependency of operation.dependencies) pluginContext.addWatchFile?.(dependency)
    try {
      const result = await operation.promise
      if (operation.generation !== manifestGeneration) return loadStyleContext(pluginContext)
      return result
    } finally {
      for (const dependency of operation.dependencies) pluginContext.addWatchFile?.(dependency)
      operation.hosts.delete(pluginContext)
      if (loadingManifest === operation) loadingManifest = undefined
    }
  }

  return {
    name: 'master-css:local-styles',
    enforce: 'pre',
    configureServer(server: ViteDevServer) {
      const refresh = () => {
        for (const id of localStyleModules) void refreshGeneratedModule(server, id).catch(error => server.config.logger.error(String(error)))
      }
      // Local stylesheets expect a style entry to emit their project globals.
      // One that is still loading keeps its environment busy; once every
      // environment has settled without any, they take their globals back.
      let settling: Promise<void> | undefined
      expectStyleEntry = () => {
        if (context.virtualCSSImporters?.size) return
        settling ??= (async () => {
          do {
            await new Promise(resolve => setTimeout(resolve, STYLE_ENTRY_GRACE))
            await Promise.all(Object.values(server.environments).map(environment => environment.waitForRequestsIdle()))
          } while (context.config === server.config && !context.virtualCSSImporters?.size && Date.now() - lastLocalStyle < STYLE_ENTRY_GRACE)
          if (context.config === server.config && !context.virtualCSSImporters?.size && setStyleEntryMissing(context, true)) refresh()
        })().catch(error => server.config.logger.error(String(error))).finally(() => { settling = undefined })
      }
      context.onStyleEntryDelivered = () => { if (setStyleEntryMissing(context, false)) refresh() }
    },
    async buildStart() {
      clearBuildStylesheetSources(context)
      clearDuplicatedImports(context)
      clearSharedGlobals(context)
      if (context.config?.command === 'build') clearLocalStylesheets(context)
      projectManifest = undefined
      manifestGeneration++
      loadingManifest = undefined
      projectManifestEntries = []
      projectManifestDependencies = []
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
        }).catch(error => {
          onDependency(getSassSourceFile(id) ?? id.replace(/[?#].*$/, ''))
          throw error
        })
        const prepared = getPreparedSassSource(context, id)
        const moduleGraph = prepared && (await prepared.prepared).moduleSources
        const nativeModuleGraph = resolution?.kind === 'plain' && Boolean(moduleGraph && moduleGraph.size > 1)
        if (resolution?.kind !== 'local' && resolution?.kind !== 'plain') return sourceMeta ? { meta: sourceMeta } : undefined

        const dependencies = new Set(resolution.dependencies)
        for (const dependency of dependencies) {
          onDependency(dependency)
        }
        const manifestResult = await loadStyleContext(dependencyHost)
        // Even a no-op depends on the context: adding a token can make it managed.
        localStyleModules.add(id)
        if (!projectManifestEntries.length && resolution.kind === 'plain' && !nativeModuleGraph) return sourceMeta ? { meta: sourceMeta } : undefined
        const scopedVueStyle = id.includes('?vue&') && /(?:^|[?&])scoped(?:=|&|$)/u.test(id)
        const compileOptions = {
          baseManifest: manifestResult.manifest, projectDir: context.config?.root,
          referenceFiles: projectManifestEntries, transformNativeStylesheets: true,
          baseFile: getSassSourceFile(id), sourceMap: await getPreparedSassSourceMap(context, id), onDependency,
        }
        const inline = context.config?.command === 'build' && isInlineStylesheet(id)
        // Project globals belong to the style entries, which emit them once for
        // every local stylesheet. A build settles that while rendering; a server
        // expects an entry and transforms these again if none is delivered.
        const shareable = !scopedVueStyle && !inline && projectManifestEntries.length > 0
        const delivery = inline ? inlineDelivery(context) : getBuildStylesheetDelivery(context) ?? getDevStylesheetDelivery(context)
        const deliveryOptions = delivery ? { delivery: {
          ...delivery, baseFile: getSassSourceFile(id), sourceMap: await getPreparedSassSourceMap(context, id), resolveImport: getBuildImportResolver(context, dependencyHost),
          onDependency
        } } : {}
        const transform = (sharesGlobals: boolean) => transformStylesheet(id, code, {
          ...compileOptions,
          generatedGlobals: scopedVueStyle ? 'separate' : sharesGlobals ? 'shared' : 'inline',
          preserveUnchangedNativeCSS: resolution.kind === 'plain' && !nativeModuleGraph,
          ...deliveryOptions
        })
        const sharesGlobals = shareable && sharesGlobalsWithStyleEntry(context)
        const result = await transform(sharesGlobals)
        const sharedCSS = result.transformed && result.sharedGlobals ? [result.code, ...(result.stylesheets ?? []).map(asset => asset.css)] : undefined
        if (registerSharedGlobals(context, id, manifestResult.manifest, sharedCSS)) context.onSharedGlobalsChange?.()
        if (sharedCSS) { lastLocalStyle = Date.now(); expectStyleEntry?.() }
        if (!result.transformed) return sourceMeta ? { meta: sourceMeta } : undefined
        localStyleModules.add(id)
        if (!inline) reportDuplicatedImports(context, id, result.stylesheets, message => this.warn ? this.warn(message) : context.config?.logger.warn(message))
        for (const dependency of result.dependencies) {
          if (dependencies.has(dependency)) continue
          onDependency(dependency)
        }
        let output = result.code
        if (inline) registerLocalInlineStylesheet(context, id, result)
        else if (context.config?.command === 'build') {
          // Vue scopes selectors after this transform. Keep native rules in
          // that pipeline, while the generated theme rules remain global.
          if (scopedVueStyle && !result.stylesheets?.length) {
            if (result.globalStylesheet) {
              // Copy property descriptors: spreading the result would compute its diagnostics.
              const globals = Object.defineProperties({}, {
                ...Object.getOwnPropertyDescriptors(result),
                code: { value: result.globalStylesheet.css, enumerable: true },
                globalStylesheet: { value: undefined, enumerable: true }
              }) as typeof result
              const slot = registerLocalStylesheet(context, id, globals)
              const nativeCSS = result.code
              output = `${nativeCSS}\n:global(${slot.slice(0, slot.indexOf('{'))})${slot.slice(slot.indexOf('{'))}`
            } else output = result.code
          } else output = registerLocalStylesheet(context, id, result)
        }
        else if (context.config?.command === 'serve') {
          // Pass only what is published: spreading the result would compute its diagnostics.
          output = publishDevStylesheets(context, { css: result.code, stylesheets: result.stylesheets }, '#master-css-local-slot{--slot:0}')
          if (result.globalStylesheet) output = publishDevGlobalStylesheet(context, result.globalStylesheet.css) + '\n' + output
        }
        return {
          code: output,
          map: null,
          ...(sourceMeta ? { meta: sourceMeta } : {})
        }
      }))
    },
    async hotUpdate({ type, file, modules }) {
      // Discovery walks the whole project, and this runs for every stylesheet
      // event in every environment. Only CSS files are entries, so discovery can
      // change only when this file declares an entry or a known entry stopped
      // declaring one (including its deletion).
      const entriesChanged = file.endsWith('.css')
        && (declaresManifestEntry(file) || projectManifestEntries.some(entry => !declaresManifestEntry(entry)))
        && JSON.stringify(await discoverManifestEntries({ root: context.config?.root })) !== JSON.stringify(projectManifestEntries)
      if (!includesFile(projectManifestDependencies, file) && !includesFile([...(loadingManifest?.dependencies ?? [])], file) && !entriesChanged) return
      projectManifest = undefined
      manifestGeneration++
      loadingManifest = undefined
      const affected = new Set(modules)
      for (const moduleId of localStyleModules) {
        const module = this.environment.moduleGraph.getModuleById(moduleId)
        if (!module) continue
        this.environment.moduleGraph.invalidateModule(module)
        affected.add(module)
      }
      // Svelte's HMR plugin tries to reload deleted CSS modules before it can
      // update their dependent styles. A reload also clears orphaned CSS.
      const hasSvelteStyle = [...affected].some(module => /\.svelte\?svelte&type=style(?:&|$)/u.test(module.id ?? ''))
      if (type === 'delete' && entriesChanged && hasSvelteStyle) {
        if (this.environment.name === 'client') this.environment.hot.send({ type: 'full-reload' })
        return []
      }
      return [...affected]
    }
  }
}
