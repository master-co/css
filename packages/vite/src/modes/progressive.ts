import type { Plugin } from 'vite'
import InjectRuntimePlugin, { InjectRuntimeServePlugin } from '../plugins/inject-runtime'
import { MasterCSSVitePluginContext } from '../core'
import PreRenderPlugin from '../plugins/pre-render'
import { ResolvedMasterCSSVitePluginOptions } from '../options'

export default function ProgressiveMode(options: ResolvedMasterCSSVitePluginOptions, context: MasterCSSVitePluginContext): Plugin[] {
  const plugins: Plugin[] = [
    PreRenderPlugin(options, context),
  ]
  if (options.injectRuntime) {
    plugins.push(InjectRuntimePlugin(options))
    plugins.push(InjectRuntimeServePlugin(options))
  }
  return plugins
}
