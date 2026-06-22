import type { Plugin } from 'vite'
import InjectRuntimePlugin from '../plugins/inject-runtime'
import ManifestPreloadPlugin from '../plugins/manifest-preload'
import AvoidFOUCPlugin from '../plugins/avoid-fouc'
import { PluginContext } from '../core'
import { PluginOptions } from '../options'

export default function RuntimeMode(options: PluginOptions, context: PluginContext): Plugin[] {
    const plugins: Plugin[] = []
    if (options.injectRuntime) {
        plugins.push(InjectRuntimePlugin(options))
        plugins.push(ManifestPreloadPlugin(context))
    }
    if (options.avoidFOUC) {
        plugins.push(AvoidFOUCPlugin(options, context))
    }
    return plugins
}
