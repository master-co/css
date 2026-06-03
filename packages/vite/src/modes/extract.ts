import { type Plugin } from 'vite'
import type { PluginContext } from '../core'
import type { PluginOptions } from '../options'

export default function ExtractMode(_options: PluginOptions, _context: PluginContext): Plugin[] {
    return []
}
