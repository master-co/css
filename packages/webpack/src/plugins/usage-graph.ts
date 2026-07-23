import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'
import { isVirtualManifestModulePath } from '../utils/path'

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
        for (const dependency of context.getResetDependencyPaths()) {
          compilation.fileDependencies.add(dependency)
        }

        // Per-module: only synchronously record source. `succeedModule` is a
        // SyncHook; async scanning belongs in `finishModules.tapPromise()`.
        const pendingByPath = new Map<string, string>()
        compilation.hooks.succeedModule.tap({ name: context.name, stage: Number.MAX_SAFE_INTEGER }, (module) => {
          const sourceModule = module as WebpackSourceModule
          const modulePath = sourceModule.resourceResolveData?.path || sourceModule.resource
          if (!modulePath) return
          if (isVirtualManifestModulePath(modulePath)) return
          if (context.isGeneratedCSSModulePath(modulePath)) return
          const moduleContent = sourceModule._source?.source?.() ?? sourceModule.originalSource?.()?.source?.()
          if (moduleContent === undefined || moduleContent === null) return
          context.setModuleContent(modulePath, moduleContent)
          pendingByPath.set(modulePath, String(moduleContent))
        })

        compilation.hooks.finishModules.tapPromise(context.name, async () => {
          if (!pendingByPath.size) return
          await context.init()
          const entries = Array.from(pendingByPath.entries())
          pendingByPath.clear()
          await context.processModuleContents(entries, context.isGeneratedCSSModulePath)
          await context.writeGeneratedCSSModule()
        })
      })
    }
  }
}
