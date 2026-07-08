import { type Plugin } from 'vite'
import type { PluginContext } from '../core'
import type { PluginOptions } from '../options'

export default function StaticMode(_options: PluginOptions, _context: PluginContext): Plugin[] {
  return []
}
