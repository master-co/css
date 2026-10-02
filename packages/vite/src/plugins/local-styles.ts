import { withStylesheetDependencies } from '../utils/failed-stylesheet-dependencies'
import { withSassDiagnostics } from '../utils/sass-diagnostics'
import type { Plugin } from 'vite'
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
  collectStylesheetDependenciesSync
} from '@master/css-compiler/node'
import type { MasterCSSVitePluginContext } from '../core'
import type { ResolvedMasterCSSVitePluginOptions } from '../options'
import { includesFile } from '../utils/path'
import { captureBuildStylesheetSource, clearBuildStylesheetSources, getBuildImportResolver } from '../utils/build-import-resolver'

import { getSassSourceFile, getPreparedSassSource, getPreparedSassSourceMap, isRawStyleRequest } from '../utils/build-sass-source'
import { getDevStylesheetDelivery, publishDevGlobalStylesheet, publishDevStylesheets } from '../utils/dev-stylesheet-delivery'
import { getBuildStylesheetDelivery } from '../utils/build-stylesheet-delivery'
import { inlineDelivery, isInlineStylesheet, registerLocalInlineStylesheet } from '../utils/inline-stylesheet'
import { clearLocalStylesheets, registerLocalStylesheet } from '../utils/local-stylesheet'

export default function LocalStylesPlugin(options: ResolvedMasterCSSVitePluginOptions, context: MasterCSSVitePluginContext): Plugin {
  let projectManifest: Awaited<ReturnType<typeof loadProjectManifest>> | undefined
  let projectManifestEntries: string[] = []
  let projectManifestDependencies: string[] = []
  const localStyleModules = new Set<string>()

  const addServerAllow = (paths: string[]) => {
    const allow = context.config?.server.fs.allow
    if (!allow) return
    for (const path of paths) {
      if (!allow.includes(path)) allow.push(path)
    }
  }

  const loadStyleContext = async (pluginContext: { addWatchFile?: (id: string) => void }) => {
    if (projectManifest) {
      for (const dependency of projectManifestDependencies) pluginContext.addWatchFile?.(dependency)
      return projectManifest
    }
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
      baseManifest: defaultBuildManifest,
      onDependency: file => { dependencies.add(file); pluginContext.addWatchFile?.(file) }
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

  return {
    name: 'master-css:local-styles',
    enforce: 'pre',
    async buildStart() {
      clearBuildStylesheetSources(context)
      if (context.config?.command === 'build') clearLocalStylesheets(context)
      projectManifest = undefined
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
          generatedGlobals: scopedVueStyle ? 'separate' as const : 'inline' as const
        }
        if (resolution.kind === 'plain' && !nativeModuleGraph) {
          const probe = await transformStylesheet(id, code, compileOptions)
          if (!probe.transformed) return sourceMeta ? { meta: sourceMeta } : undefined
        }
        const inline = context.config?.command === 'build' && isInlineStylesheet(id)
        const delivery = inline ? inlineDelivery(context) : getBuildStylesheetDelivery(context) ?? getDevStylesheetDelivery(context)
        const result = await transformStylesheet(id, code, {
          ...compileOptions,
          ...(delivery ? { delivery: {
            ...delivery, baseFile: getSassSourceFile(id), sourceMap: await getPreparedSassSourceMap(context, id), resolveImport: getBuildImportResolver(context, dependencyHost),
            onDependency
          } } : {})
        })
        if (!result.transformed) return sourceMeta ? { meta: sourceMeta } : undefined
        localStyleModules.add(id)
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
              const slot = registerLocalStylesheet(context, id, { ...result, code: result.globalStylesheet.css, globalStylesheet: undefined })
              const nativeCSS = result.code
              output = `${nativeCSS}\n:global(${slot.slice(0, slot.indexOf('{'))})${slot.slice(slot.indexOf('{'))}`
            } else output = result.code
          } else output = registerLocalStylesheet(context, id, result)
        }
        else if (context.config?.command === 'serve') {
          output = publishDevStylesheets(context, { ...result, css: result.code, emittedGlobals: { variables: {}, keyframes: {}, keyframeSlots: [], suppressedKeyframes: [] } }, '#master-css-local-slot{--slot:0}')
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
      const entriesChanged = /\.(?:css|scss|sass)$/u.test(file)
        && JSON.stringify(await discoverManifestEntries({ root: context.config?.root })) !== JSON.stringify(projectManifestEntries)
      if (!includesFile(projectManifestDependencies, file) && !entriesChanged) return
      projectManifest = undefined
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
