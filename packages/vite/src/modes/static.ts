import { type Plugin } from 'vite'
import type { MasterCSSVitePluginContext } from '../core'
import type { ResolvedMasterCSSVitePluginOptions } from '../options'

export default function StaticMode(_options: ResolvedMasterCSSVitePluginOptions, _context: MasterCSSVitePluginContext): Plugin[] {
  return []
}
