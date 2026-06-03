import { VIRTUAL_CONFIG_ID } from '@master/css-configer/module'
import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'

export function ConfigVirtualModulePlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
    return {
        apply(compiler: Compiler) {
            compiler.hooks.normalModuleFactory.tap(context.name, (normalModuleFactory) => {
                normalModuleFactory.hooks.beforeResolve.tapAsync(context.name, (resolveData, callback) => {
                    if (resolveData.request !== VIRTUAL_CONFIG_ID) {
                        callback()
                        return
                    }

                    context.createDefaultConfigModule()
                        .then((moduleContent) => {
                            context.virtualModule?.writeModule(context.virtualConfigModuleId, moduleContent)
                            for (const dependency of context.getDefaultConfigDependencyPaths()) {
                                resolveData.fileDependencies.add(dependency)
                            }
                            resolveData.request = context.virtualConfigModuleId
                            callback()
                        })
                        .catch((error: Error) => callback(error))
                })
            })
        }
    }
}
