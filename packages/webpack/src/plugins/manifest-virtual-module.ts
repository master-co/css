import { VIRTUAL_MANIFEST_ID } from '@master/css-internal/manifest-module'
import { VIRTUAL_EMITTED_GLOBALS_ID } from '@master/css-internal/emitted-globals-module'
import { VIRTUAL_PROGRAM_ID } from '@master/css-internal/program-module'
import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'
import { addFileDependency } from '../utils/file-dependencies'

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

          // Browsers import the program and server code the manifest; both
          // compile the same project manifest and share its dependencies.
          const virtualModule = resolveData.request === VIRTUAL_MANIFEST_ID
            ? { id: context.virtualManifestModuleId, create: () => context.createDefaultManifestModule() }
            : resolveData.request === VIRTUAL_PROGRAM_ID
              ? { id: context.virtualProgramModuleId, create: () => context.createDefaultProgramModule() }
              : undefined
          if (virtualModule) {
            const addDependencies = () => {
              for (const dependency of context.getDefaultManifestDependencyPaths()) {
                addFileDependency(resolveData.fileDependencies, dependency)
              }
            }
            virtualModule.create()
              .then((moduleContent) => {
                context.writeVirtualModule(virtualModule.id, moduleContent)
                addDependencies()
                resolveData.request = virtualModule.id
                callback()
              })
              .catch((error: Error) => {
                addDependencies()
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
