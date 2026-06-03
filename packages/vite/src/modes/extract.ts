import { type Plugin } from 'vite'
import type { PluginContext } from '../core'
import type { PluginOptions } from '../options'
import { ExtractorPlugin, UsageGraphPlugin } from '../plugins/extractor'
import ExtractCSSPlugin from '../plugins/virtual-css-import'
import VirtualCSSHMRPlugin from '../plugins/virtual-css-hmr'
import VirtualCSSModulePlugin from '../plugins/virtual-css-module'

export default function ExtractMode(options: PluginOptions, context: PluginContext): Plugin[] {
    return [
        ExtractorPlugin(options, context),
        ExtractCSSPlugin(options, context),
        UsageGraphPlugin(options, context),
        VirtualCSSHMRPlugin(options, context),
        VirtualCSSModulePlugin(options, context)
    ]
}
