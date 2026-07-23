import type { Plugin } from 'vite'
import InjectRuntimePlugin, { InjectRuntimeServePlugin } from '../plugins/inject-runtime'
import ManifestPreloadPlugin from '../plugins/manifest-preload'
import RuntimePreloadPlugin from '../plugins/runtime-preload'
import AvoidFOUCPlugin from '../plugins/avoid-fouc'
import { MasterCSSVitePluginContext } from '../core'
import { ResolvedMasterCSSVitePluginOptions } from '../options'

export default function RuntimeMode(options: ResolvedMasterCSSVitePluginOptions, context: MasterCSSVitePluginContext): Plugin[] {
  const plugins: Plugin[] = []
  if (options.injectRuntime) {
    plugins.push(InjectRuntimePlugin(options))
    plugins.push(InjectRuntimeServePlugin(options))
    plugins.push(RuntimePreloadPlugin(context))
    plugins.push(ManifestPreloadPlugin(context))
  }
  if (options.avoidFOUC) {
    plugins.push(AvoidFOUCPlugin(options, context))
  }
  return plugins
}
