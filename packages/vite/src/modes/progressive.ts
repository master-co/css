import type { Plugin } from 'vite'
import InjectRuntimePlugin from '../plugins/inject-runtime'
import { PluginContext } from '../core'
import PreRenderPlugin from '../plugins/pre-render'
import { PluginOptions } from '../options'

export default function ProgressiveMode(options: PluginOptions, context: PluginContext): Plugin[] {
    const plugins: Plugin[] = [
        PreRenderPlugin(options, context),
    ]
    if (options.injectRuntime) {
        plugins.push(InjectRuntimePlugin(options, context))
    }
    return plugins
}
