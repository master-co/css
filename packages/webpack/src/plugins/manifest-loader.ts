import {
    MASTER_CSS_MANIFEST_QUERY,
    stripMasterCSSManifestQuery
} from '@master/css-integration/manifest-module'
import { toBrowserManifestFacadeModule } from '@master/css-integration/manifest-facade'
import {
    toHashedManifestAssetFileName,
    toVirtualCSSManifestModulePath
} from '@master/css-integration/node'
import { loadManifestJSON } from '@master/css-manifest/load'
import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'
import { isCSSManifestRequest } from '@master/css-manifest/css'

export default function ManifestLoaderPlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
    return {
        apply(compiler: Compiler) {
            compiler.hooks.normalModuleFactory.tap(context.name, (normalModuleFactory) => {
                normalModuleFactory.hooks.beforeResolve.tapAsync(context.name, (resolveData, callback) => {
                    const request = resolveData.request
                    const isPlanRequest = request.endsWith(MASTER_CSS_MANIFEST_QUERY)
                    if (!isPlanRequest) {
                        callback()
                        return
                    }

                    const sourceRequest = stripMasterCSSManifestQuery(request)
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
                                if (!isCSSManifestRequest(resolvedPath)) {
                                    callback(new TypeError('Master CSS manifest queries only support CSS entry files.'))
                                    return
                                }
                                const result = await loadManifestJSON(resolvedPath)
                                const assetFileName = toHashedManifestAssetFileName(result.json)
                                const virtualModuleId = toVirtualCSSManifestModulePath(context.compilerContext, resolvedPath)
                                context.setManifestJSONAsset(assetFileName, result.json)
                                context.virtualModule?.writeModule(
                                    virtualModuleId,
                                    toBrowserManifestFacadeModule(`__webpack_public_path__ + ${JSON.stringify(assetFileName)}`)
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
