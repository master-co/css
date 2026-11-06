import type { Plugin } from 'vite'
import { MasterCSSVitePluginContext } from '../core'
import PrerenderPlugin from '../plugins/prerender'
import { ResolvedMasterCSSVitePluginOptions } from '../options'

export default function PrerenderMode(options: ResolvedMasterCSSVitePluginOptions, context: MasterCSSVitePluginContext): Plugin[] {
  const plugins: Plugin[] = [
    PrerenderPlugin(options, context),
  ]
  return plugins
}
