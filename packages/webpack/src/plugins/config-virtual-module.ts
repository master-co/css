import { VIRTUAL_PLAN_ID } from '@master/css-integration/plan-module'
import { VIRTUAL_PRELOADED_ID } from '@master/css-integration/preloaded-module'
import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'

export default function ConfigVirtualModulePlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
    return {
        apply(compiler: Compiler) {
            compiler.hooks.normalModuleFactory.tap(context.name, (normalModuleFactory) => {
                normalModuleFactory.hooks.beforeResolve.tapAsync(context.name, (resolveData, callback) => {
                    if (resolveData.request === VIRTUAL_PRELOADED_ID) {
                        context.createPreloadedModule()
                            .then((moduleContent) => {
                                context.virtualModule?.writeModule(context.virtualPreloadedModuleId, moduleContent)
                                resolveData.request = context.virtualPreloadedModuleId
                                callback()
                            })
                            .catch((error: Error) => callback(error))
                        return
                    }

                    if (resolveData.request === VIRTUAL_PLAN_ID) {
                        context.createDefaultPlanModule()
                            .then((moduleContent) => {
                                context.virtualModule?.writeModule(context.virtualPlanModuleId, moduleContent)
                                for (const dependency of context.getDefaultPlanDependencyPaths()) {
                                    resolveData.fileDependencies.add(dependency)
                                }
                                resolveData.request = context.virtualPlanModuleId
                                callback()
                            })
                            .catch((error: Error) => callback(error))
                        return
                    }

                    callback()
                })
            })
        }
    }
}
