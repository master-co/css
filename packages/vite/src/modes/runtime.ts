import type { Plugin } from 'vite'
import InjectCSSRuntimeInitPlugin from '../plugins/inject-runtime-init'
import AvoidFOUCPlugin from '../plugins/avoid-fouc'
import { PluginContext, PluginOptions } from '../core'

export default function RuntimeMode(options: PluginOptions, context: PluginContext): Plugin[] {
    const plugins: Plugin[] = []
    if (options.inject) {
        plugins.push(InjectCSSRuntimeInitPlugin(options, context))
    }
    if (options.avoidFOUC) {
        plugins.push(AvoidFOUCPlugin(options, context))
    }
    return plugins
}
