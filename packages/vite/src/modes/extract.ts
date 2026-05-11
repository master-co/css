import { PluginContext } from '../core'
import { type Plugin } from 'vite'
import InjectVirtualModulePlugin from '../plugins/inject-virtual-module'
import { PluginOptions } from '../options'

export default function ExtractMode(options: PluginOptions, context: PluginContext): Plugin[] {
    const plugins: Plugin[] = []

    if (options.injectVirtualModule) {
        plugins.push(InjectVirtualModulePlugin(options, context))
    }

    return plugins
}
