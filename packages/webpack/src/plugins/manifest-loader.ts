import {
    MASTER_CSS_MANIFEST_QUERY,
    stripMasterCSSManifestQuery
} from '@master/css-integration/manifest-module'
import {
    toBrowserManifestFacadeModule,
    toInlineManifestModule
} from '@master/css-integration/manifest-facade'
import {
    toHashedManifestAssetFileName,
    toVirtualCSSManifestModulePath
} from '@master/css-integration/node'
import { loadManifestJSON } from '@master/css-project/manifest'
import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'
import { isCSSManifestRequest } from '@master/css-project/entries'
import { collectStyleCSSDependencies } from '@master/css-stylesheet'
import { addFileDependency } from '../utils/file-dependencies'

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
                                const dependencies = new Set(collectStyleCSSDependencies(resolvedPath, undefined, context.cwd))
                                for (const dependency of dependencies) {
                                    addFileDependency(resolveData.fileDependencies, dependency)
                                }
                                const result = await loadManifestJSON(resolvedPath)
                                for (const dependency of result.dependencies) {
                                    addFileDependency(resolveData.fileDependencies, dependency)
                                }
                                const virtualModuleId = toVirtualCSSManifestModulePath(context.compilerContext, resolvedPath)
                                let moduleContent: string
                                if (compiler.options.mode === 'development') {
                                    moduleContent = toInlineManifestModule(result.json)
                                } else {
                                    const assetFileName = toHashedManifestAssetFileName(result.json)
                                    context.setManifestJSONAsset(assetFileName, result.json)
                                    moduleContent = toBrowserManifestFacadeModule(`__webpack_public_path__ + ${JSON.stringify(assetFileName)}`)
                                }
                                context.writeVirtualModule(
                                    virtualModuleId,
                                    moduleContent
                                )
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
