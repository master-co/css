import type { Plugin } from 'vite'
import InjectCSSRuntimeInitPlugin from '../plugins/inject-runtime-init'
import { PluginContext, PluginOptions } from '../core'
import PreRenderPlugin from '../plugins/pre-render'

export default function ProgressiveMode(options: PluginOptions, context: PluginContext): Plugin[] {
    const plugins: Plugin[] = [
        PreRenderPlugin(options, context),
    ]
    if (options.injectInit) {
        plugins.push(InjectCSSRuntimeInitPlugin(options, context))
    }
    return plugins
}
