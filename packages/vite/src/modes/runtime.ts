import type { Plugin } from 'vite'
import InjectCSSRuntimePlugin from '../plugins/inject-runtime'
import AvoidFOUCPlugin from '../plugins/avoid-fouc'
import { PluginContext, PluginOptions } from '../core'

export default function RuntimeMode(options: PluginOptions, context: PluginContext): Plugin[] {
    return [
        InjectCSSRuntimePlugin(options, context),
        AvoidFOUCPlugin(options, context)
    ]
}
