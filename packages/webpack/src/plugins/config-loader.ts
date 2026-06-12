import {
    MASTER_CSS_CONFIG_QUERY,
    stripMasterCSSConfigQuery,
    toVirtualCSSConfigModulePath
} from '@master/css-integration/config-module'
import {
    MASTER_CSS_PLAN_QUERY,
    stripMasterCSSPlanQuery,
    toPlanModule,
    toVirtualCSSPlanModulePath
} from '@master/css-integration/plan-module'
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
                    const isConfigRequest = request.endsWith(MASTER_CSS_CONFIG_QUERY)
                    const isPlanRequest = request.endsWith(MASTER_CSS_PLAN_QUERY)
                    if (!isConfigRequest && !isPlanRequest) {
                        callback()
                        return
                    }

                    const sourceRequest = isPlanRequest
                        ? stripMasterCSSPlanQuery(request)
                        : stripMasterCSSConfigQuery(request)
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
                                const result = await loadConfigModule(resolvedPath)
                                const virtualModuleId = isPlanRequest
                                    ? toVirtualCSSPlanModulePath(context.compilerContext, resolvedPath)
                                    : toVirtualCSSConfigModulePath(context.compilerContext, resolvedPath)
                                context.virtualModule?.writeModule(
                                    virtualModuleId,
                                    isPlanRequest ? toPlanModule(result.plan) : result.code
                                )
                                for (const dependency of result.dependencies) {
                                    resolveData.fileDependencies.add(dependency)
                                }
                                resolveData.request = virtualModuleId
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
