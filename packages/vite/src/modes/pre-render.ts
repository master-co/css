import type { Plugin } from 'vite'
import { MasterCSSVitePluginContext } from '../core'
import PreRenderPlugin from '../plugins/pre-render'
import { ResolvedMasterCSSVitePluginOptions } from '../options'

export default function PreRenderMode(options: ResolvedMasterCSSVitePluginOptions, context: MasterCSSVitePluginContext): Plugin[] {
  const plugins: Plugin[] = [
    PreRenderPlugin(options, context),
  ]
  return plugins
}
