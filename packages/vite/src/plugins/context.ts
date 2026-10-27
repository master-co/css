import type { Plugin } from 'vite'
import type { MasterCSSVitePluginContext } from '../core'
import type { ResolvedMasterCSSVitePluginOptions } from '../options'

export default function ContextPlugin(options: ResolvedMasterCSSVitePluginOptions, context: MasterCSSVitePluginContext): Plugin {
  return {
    name: 'master-css:context',
    enforce: 'pre',
    configResolved(config) {
      context.config = config
      if (process.env.DEBUG) {
        console.log(`[@master/css-vite] mode: ${options.mode}`)
      }
    }
  }
}
