import type { Plugin } from 'vite'
import InjectCSSRuntimeInitPlugin from '../plugins/inject-runtime-init'
import { PluginContext, PluginOptions } from '../core'

export default function ProgressiveMode(options: PluginOptions, context: PluginContext): Plugin[] {
    const plugins: Plugin[] = []
    if (options.inject) {
        plugins.push(InjectCSSRuntimeInitPlugin(options, context))
    }
    return plugins
}
