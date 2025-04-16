import type { Plugin } from 'vite'
import { PluginContext, PluginOptions } from '../core'
import PreRenderPlugin from '../plugins/pre-render'

export default function PreRenderMode(options: PluginOptions, context: PluginContext): Plugin[] {
    const plugins: Plugin[] = [
        PreRenderPlugin(options, context),
    ]
    return plugins
}
