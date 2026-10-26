import {
  MASTER_CSS_MANIFEST_QUERY,
  stripMasterCSSManifestQuery,
  toProductionManifestJSON
} from '@master/css-internal/manifest-module'
import {
  toBrowserManifestFacadeModule,
  toInlineManifestModule
} from '@master/css-internal/manifest-facade'
import {
  isMasterCSSProgramRequest,
  stripMasterCSSProgramQuery
} from '@master/css-internal/program-module'
import {
  toHashedManifestAssetFileName,
  toVirtualCSSManifestModulePath,
  toVirtualCSSProgramModulePath
} from '@master/css-internal/node'
import { compileProjectManifest } from '@master/css-compiler/project'
import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'
import {
  defaultBuildManifest,
  isManifestStylesheetRequest
} from '@master/css-internal/project'
import { serializeMasterCSSManifest } from '@master/css-schema/manifest'
import { collectStylesheetDependenciesSync } from '@master/css-compiler/node'
import { addFileDependency } from '../utils/file-dependencies'

export default function ManifestLoaderPlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
  return {
    apply(compiler: Compiler) {
      compiler.hooks.normalModuleFactory.tap(context.name, (normalModuleFactory) => {
        normalModuleFactory.hooks.beforeResolve.tapAsync(context.name, (resolveData, callback) => {
          const request = resolveData.request
          // `?master-css-program` compiles the entry's manifest for browsers.
          const program = isMasterCSSProgramRequest(request)
          if (!program && !request.endsWith(MASTER_CSS_MANIFEST_QUERY)) {
            callback()
            return
          }

          const sourceRequest = program ? stripMasterCSSProgramQuery(request) : stripMasterCSSManifestQuery(request)
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
                  callback(new TypeError(`Master CSS ${program ? 'program' : 'manifest'} queries only support CSS entry files.`))
                  return
                }
                const dependencies = new Set(collectStylesheetDependenciesSync(resolvedPath, undefined, {
                  projectDir: context.cwd
                }))
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
                const virtualModuleId = program
                  ? toVirtualCSSProgramModulePath(context.compilerContext, resolvedPath)
                  : toVirtualCSSManifestModulePath(context.compilerContext, resolvedPath)
                let moduleContent: string
                if (program) {
                  moduleContent = await context.createProgramModule(result.manifest)
                } else if (compiler.options.mode === 'development') {
                  moduleContent = toInlineManifestModule(serializeMasterCSSManifest(result.manifest))
                } else {
                  const json = toProductionManifestJSON(result.manifest)
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
