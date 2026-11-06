import type { Plugin } from 'vite'
import InjectRuntimePlugin, { InjectRuntimeServePlugin } from '../plugins/inject-runtime'
import { MasterCSSVitePluginContext } from '../core'
import PrerenderPlugin from '../plugins/prerender'
import { ResolvedMasterCSSVitePluginOptions } from '../options'

export default function ProgressiveMode(options: ResolvedMasterCSSVitePluginOptions, context: MasterCSSVitePluginContext): Plugin[] {
  const plugins: Plugin[] = [
    PrerenderPlugin(options, context),
  ]
  if (options.injectRuntime) {
    plugins.push(InjectRuntimePlugin(options))
    plugins.push(InjectRuntimeServePlugin(options))
  }
  return plugins
}
