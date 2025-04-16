import type { Plugin } from 'vite'
import InjectRuntimePlugin from '../plugins/inject-runtime'
import AvoidFOUCPlugin from '../plugins/avoid-fouc'
import { PluginContext, PluginOptions } from '../core'

export default function RuntimeMode(options: PluginOptions, context: PluginContext): Plugin[] {
    const plugins: Plugin[] = []
    if (options.injectRuntime) {
        plugins.push(InjectRuntimePlugin(options, context))
    }
    if (options.avoidFOUC) {
        plugins.push(AvoidFOUCPlugin(options, context))
    }
    return plugins
}
