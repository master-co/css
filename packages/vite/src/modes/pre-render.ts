import type { Plugin } from 'vite'
import { PluginContext } from '../core'
import PreRenderPlugin from '../plugins/pre-render'
import { PluginOptions } from '../options'

export default function PreRenderMode(options: PluginOptions, context: PluginContext): Plugin[] {
    const plugins: Plugin[] = [
        PreRenderPlugin(options, context),
    ]
    return plugins
}
