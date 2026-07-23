import {
  MASTER_CSS_MANIFEST_QUERY,
  stripMasterCSSManifestQuery
} from '@master/css-build-internal/manifest-module'
import {
  toBrowserManifestFacadeModule,
  toInlineManifestModule
} from '@master/css-build-internal/manifest-facade'
import {
  toHashedManifestAssetFileName,
  toVirtualCSSManifestModulePath
} from '@master/css-build-internal/node'
import { compileProjectManifest } from '@master/css-compiler/project'
import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'
import {
  defaultBuildManifest,
  isManifestStylesheetRequest
} from '@master/css-build-internal/project'
import { serializeMasterCSSManifest } from '@master/css-schema/manifest'
import { collectStylesheetDependencies } from '@master/css-compiler/stylesheet'
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
                if (!isManifestStylesheetRequest(resolvedPath)) {
                  callback(new TypeError('Master CSS manifest queries only support CSS entry files.'))
                  return
                }
                const dependencies = new Set(collectStylesheetDependencies(resolvedPath, undefined, context.cwd))
                for (const dependency of dependencies) {
                  addFileDependency(resolveData.fileDependencies, dependency)
                }
                const result = await compileProjectManifest({
                  root: context.cwd,
                  entries: [resolvedPath],
                  baseManifest: defaultBuildManifest
                })
                for (const dependency of result.dependencies) {
                  addFileDependency(resolveData.fileDependencies, dependency)
                }
                const virtualModuleId = toVirtualCSSManifestModulePath(context.compilerContext, resolvedPath)
                const json = serializeMasterCSSManifest(result.manifest)
                let moduleContent: string
                if (compiler.options.mode === 'development') {
                  moduleContent = toInlineManifestModule(json)
                } else {
                  const assetFileName = toHashedManifestAssetFileName(json)
                  context.setManifestJSONAsset(assetFileName, json)
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
