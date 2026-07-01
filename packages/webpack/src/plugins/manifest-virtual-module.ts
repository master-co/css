import { VIRTUAL_MANIFEST_ID } from '@master/css-integration/manifest-module'
import { VIRTUAL_EMITTED_GLOBALS_ID } from '@master/css-integration/emitted-globals-module'
import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'

export default function ManifestVirtualModulePlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
    return {
        apply(compiler: Compiler) {
            compiler.hooks.normalModuleFactory.tap(context.name, (normalModuleFactory) => {
                normalModuleFactory.hooks.beforeResolve.tapAsync(context.name, (resolveData, callback) => {
                    if (resolveData.request === VIRTUAL_EMITTED_GLOBALS_ID) {
                        context.createEmittedGlobalsModule()
                            .then((moduleContent) => {
                                context.writeVirtualModule(context.virtualEmittedGlobalsModuleId, moduleContent)
                                resolveData.request = context.virtualEmittedGlobalsModuleId
                                callback()
                            })
                            .catch((error: Error) => callback(error))
                        return
                    }

                    if (resolveData.request === VIRTUAL_MANIFEST_ID) {
                        context.createDefaultManifestModule()
                            .then((moduleContent) => {
                                context.writeVirtualModule(context.virtualManifestModuleId, moduleContent)
                                for (const dependency of context.getDefaultManifestDependencyPaths()) {
                                    resolveData.fileDependencies.add(dependency)
                                }
                                resolveData.request = context.virtualManifestModuleId
                                callback()
                            })
                            .catch((error: Error) => {
                                for (const dependency of context.getDefaultManifestDependencyPaths()) {
                                    resolveData.fileDependencies.add(dependency)
                                }
                                callback(error)
                            })
                        return
                    }

                    callback()
                })
            })
        }
    }
}
