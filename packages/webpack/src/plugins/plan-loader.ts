import {
    MASTER_CSS_PLAN_QUERY,
    stripMasterCSSPlanQuery,
    toPlanModule,
    toVirtualCSSPlanModulePath
} from '@master/css-integration/plan-module'
import { loadPlanModule } from '@master/css-configer/load'
import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'
import { isCSSPlanRequest } from '@master/css-configer/css'

export default function PlanLoaderPlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
    return {
        apply(compiler: Compiler) {
            compiler.hooks.normalModuleFactory.tap(context.name, (normalModuleFactory) => {
                normalModuleFactory.hooks.beforeResolve.tapAsync(context.name, (resolveData, callback) => {
                    const request = resolveData.request
                    const isPlanRequest = request.endsWith(MASTER_CSS_PLAN_QUERY)
                    if (!isPlanRequest) {
                        callback()
                        return
                    }

                    const sourceRequest = stripMasterCSSPlanQuery(request)
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
                                if (!isCSSPlanRequest(resolvedPath)) {
                                    callback(new TypeError('Master CSS plan queries only support CSS entry files.'))
                                    return
                                }
                                const result = await loadPlanModule(resolvedPath)
                                const virtualModuleId = toVirtualCSSPlanModulePath(context.compilerContext, resolvedPath)
                                context.virtualModule?.writeModule(
                                    virtualModuleId,
                                    toPlanModule(result.plan)
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
