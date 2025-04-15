import type { Plugin } from 'vite'
import InjectCSSRuntimeInitPlugin from '../plugins/inject-runtime-init'
import AvoidFOUCPlugin from '../plugins/avoid-fouc'
import { PluginContext, PluginOptions } from '../core'

export default function RuntimeMode(options: PluginOptions, context: PluginContext): Plugin[] {
    return [
        InjectCSSRuntimeInitPlugin(options, context),
        AvoidFOUCPlugin(options, context)
    ]
}
