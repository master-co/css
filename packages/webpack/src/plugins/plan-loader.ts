import {
    MASTER_CSS_PLAN_QUERY,
    stripMasterCSSPlanQuery
} from '@master/css-integration/plan-module'
import { toBrowserPlanFacadeModule } from '@master/css-integration/plan-facade'
import {
    toHashedPlanAssetFileName,
    toVirtualCSSPlanModulePath
} from '@master/css-integration/node'
import { loadPlanJSON } from '@master/css-plan/load'
import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'
import { isCSSPlanRequest } from '@master/css-plan/css'

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
                                const result = await loadPlanJSON(resolvedPath)
                                const assetFileName = toHashedPlanAssetFileName(result.json)
                                const virtualModuleId = toVirtualCSSPlanModulePath(context.compilerContext, resolvedPath)
                                context.setPlanJSONAsset(assetFileName, result.json)
                                context.virtualModule?.writeModule(
                                    virtualModuleId,
                                    toBrowserPlanFacadeModule(`__webpack_public_path__ + ${JSON.stringify(assetFileName)}`)
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
