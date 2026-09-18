import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'
import { isVirtualManifestModulePath } from '../utils/path'
import { existsSync } from 'node:fs'

function addDependencies(compilation: import('webpack').Compilation, dependencies: readonly string[]) {
  for (const dependency of dependencies) {
    if (existsSync(dependency)) compilation.fileDependencies.add(dependency)
    else compilation.missingDependencies.add(dependency)
  }
}

interface WebpackSourceModule {
  resourceResolveData?: {
    path?: string
  }
  resource?: string
  _source?: {
    source?: () => unknown
  }
  originalSource?: () => {
    source?: () => unknown
  } | null | undefined
}

export default function UsageGraphPlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
  return {
    apply(compiler: Compiler) {
      compiler.hooks.thisCompilation.tap(context.name, (compilation) => {
        for (const error of context.takeCompilationErrors()) compilation.errors.push(error)

        // Per-module: only synchronously record source. `succeedModule` is a
        // SyncHook; async scanning belongs in `finishModules.tapPromise()`.
        const pendingByPath = new Map<string, string>()
        const sourceEntry = (module: WebpackSourceModule): [string, string] | undefined => {
          const sourceModule = module as WebpackSourceModule
          const modulePath = sourceModule.resourceResolveData?.path || sourceModule.resource
          if (!modulePath) return
          if (isVirtualManifestModulePath(modulePath)) return
          if (context.isGeneratedCSSModulePath(modulePath)) return
          const moduleContent = sourceModule._source?.source?.() ?? sourceModule.originalSource?.()?.source?.()
          if (moduleContent === undefined || moduleContent === null) return
          return [modulePath, String(moduleContent)]
        }
        compilation.hooks.succeedModule.tap({ name: context.name, stage: Number.MAX_SAFE_INTEGER }, (module) => {
          const entry = sourceEntry(module)
          if (entry) pendingByPath.set(...entry)
        })

        compilation.hooks.finishModules.tapPromise(context.name, async (modules) => {
          try {
            await context.init()
            // Cached modules do not fire succeedModule. Include the complete
            // current graph when releasing old owners and restoring cached ones.
            const activeByPath = new Map(pendingByPath)
            for (const module of modules) {
              const entry = sourceEntry(module)
              if (entry) activeByPath.set(...entry)
            }
            const entries = await context.reconcileModuleContents([...activeByPath], new Set(pendingByPath.keys()))
            pendingByPath.clear()
            if (!entries) return
            // A virtual-module invalidation can rebuild a changed stylesheet
            // before its filesystem event reaches watchRun. Refresh manifest
            // ownership from the sources this compilation actually rebuilt.
            if (entries.some(([file]) => context.getDefaultManifestDependencyPaths().includes(file))) {
              await context.writeDefaultManifestModule()
            }
            await context.processModuleContents(entries, context.isGeneratedCSSModulePath)
            await context.writeGeneratedCSSModule()
          } catch (error) {
            compilation.errors.push(error instanceof Error ? error : new Error(String(error)))
          } finally {
            addDependencies(compilation, context.getResetDependencyPaths())
          }
        })
      })
    }
  }
}
