import { VIRTUAL_CSS_ID } from '@master/css-integration/style-module'
import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'

export default function VirtualCSSImportPlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
  return {
    apply(compiler: Compiler) {
      compiler.hooks.normalModuleFactory.tap(context.name, (normalModuleFactory) => {
        normalModuleFactory.hooks.beforeResolve.tapAsync(context.name, (resolveData, callback) => {
          if (resolveData.request !== VIRTUAL_CSS_ID) {
            callback()
            return
          }

          resolveData.request = context.virtualCSSImportModuleId
          callback()
        })
      })
    }
  }
}
