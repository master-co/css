import {
    MASTER_CSS_CONFIG_QUERY,
    stripMasterCSSConfigQuery,
    toVirtualCSSConfigModulePath
} from '@master/css-integration/config-module'
import { loadConfigModule } from '@master/css-configer/load'
import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'
import { isCSSConfigRequest } from '@master/css-configer/css'

export default function ConfigLoaderPlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
    return {
        apply(compiler: Compiler) {
            compiler.hooks.normalModuleFactory.tap(context.name, (normalModuleFactory) => {
                normalModuleFactory.hooks.beforeResolve.tapAsync(context.name, (resolveData, callback) => {
                    const request = resolveData.request
                    if (!request.endsWith(MASTER_CSS_CONFIG_QUERY)) {
                        callback()
                        return
                    }

                    const sourceRequest = stripMasterCSSConfigQuery(request)
                    const resolver = normalModuleFactory.getResolver('normal')
                    resolver.resolve(
                        resolveData.contextInfo,
                        resolveData.context,
                        sourceRequest,
                        {},
                        async (error, resolvedPath) => {
                            if (error) {
                                callback(error)
                                return
                            }
                            if (!resolvedPath) {
                                callback()
                                return
                            }
                            try {
                                if (!isCSSConfigRequest(resolvedPath)) {
                                    callback(new TypeError('Master CSS config queries only support CSS entry files.'))
                                    return
                                }
                                const virtualCSSConfigModuleId = toVirtualCSSConfigModulePath(context.compilerContext, resolvedPath)
                                const result = await loadConfigModule(resolvedPath)
                                context.virtualModule?.writeModule(virtualCSSConfigModuleId, result.code)
                                for (const dependency of result.dependencies) {
                                    resolveData.fileDependencies.add(dependency)
                                }
                                resolveData.request = virtualCSSConfigModuleId
                                callback()
                            } catch (error) {
                                callback(error as Error)
                            }
                        }
                    )
                })
            })
        }
    }
}
