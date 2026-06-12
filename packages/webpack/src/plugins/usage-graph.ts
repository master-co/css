import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'
import { isVirtualPlanModulePath } from '../utils/path'

interface WebpackSourceModule {
    resourceResolveData?: {
        path?: string
    }
    resource?: string
    _source?: {
        source?: () => unknown
    }
}

export default function UsageGraphPlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
    return {
        apply(compiler: Compiler) {
            compiler.hooks.thisCompilation.tap(context.name, (compilation) => {
                for (const dependency of context.getDefaultPlanDependencyPaths()) {
                    compilation.fileDependencies.add(dependency)
                }

                // Per-module: only synchronously record source. `succeedModule` is a
                // SyncHook; async extraction belongs in `finishModules.tapPromise()`.
                const pendingByPath = new Map<string, string>()
                compilation.hooks.succeedModule.tap(context.name, (module) => {
                    const sourceModule = module as WebpackSourceModule
                    const modulePath = sourceModule.resourceResolveData?.path || sourceModule.resource
                    if (!modulePath) return
                    if (isVirtualPlanModulePath(modulePath)) return
                    if (context.isGeneratedCSSModulePath(modulePath)) return
                    const moduleContent = sourceModule._source?.source?.()
                    if (moduleContent === undefined || moduleContent === null) return
                    context.setModuleContent(modulePath, moduleContent)
                    pendingByPath.set(modulePath, String(moduleContent))
                })

                compilation.hooks.finishModules.tapPromise(context.name, async () => {
                    if (!pendingByPath.size) return
                    const entries = Array.from(pendingByPath.entries())
                    pendingByPath.clear()
                    await context.processModuleContents(entries, context.isGeneratedCSSModulePath)
                    await context.writeGeneratedCSSModule()
                })
            })
        }
    }
}
