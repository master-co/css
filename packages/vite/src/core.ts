import type CSSExtractor from '@master/css-extractor'
import type { StyleCSSSources } from '@master/css-extractor/style'
import type { Plugin, ResolvedConfig } from 'vite'
import ConfigLoaderPlugin from './plugins/config-loader'
import ConfigVirtualModulePlugin from './plugins/config-virtual-module'
import PreloadedVirtualModulePlugin from './plugins/preloaded-virtual-module'
import ExtractMode from './modes/extract'
import RuntimeMode from './modes/runtime'
import ProgressiveMode from './modes/progressive'
import PreRenderMode from './modes/pre-render'
import ContextPlugin from './plugins/context'
import ExtractorPlugin from './plugins/extractor'
import UsageGraphPlugin from './plugins/usage-graph'
import StyleEntryPlugin from './plugins/style-entry'
import StyleEntryHMRPlugin from './plugins/style-entry-hmr'
import StyleEntryBuildPlugin from './plugins/style-entry-build'
import defaultPluginOptions, { PluginOptions } from './options'

export interface PluginContext {
    config?: ResolvedConfig
    extractor?: CSSExtractor
    virtualCSSImporters?: Set<string>
    virtualCSSPlaceholderEmitted?: boolean
    styleCSSSources?: StyleCSSSources
    includeGeneratedCSS?: boolean
    preloaded?: import('shared/css-preloaded-module').MasterCSSPreloaded
}

export default function masterCSS(options?: PluginOptions): Plugin[] {
    options = { ...defaultPluginOptions, ...options }
    const context = {
        includeGeneratedCSS: options.mode === 'extract'
    } as PluginContext
    const plugins: Plugin[] = [
        ContextPlugin(options, context),
        ConfigVirtualModulePlugin(options, context),
        PreloadedVirtualModulePlugin(context),
        ConfigLoaderPlugin(context),
        ExtractorPlugin(options, context),
        UsageGraphPlugin(options, context),
        StyleEntryPlugin(options, context),
        StyleEntryHMRPlugin(options, context),
        StyleEntryBuildPlugin(options, context)
    ]
    switch (options.mode) {
        case 'runtime':
            plugins.push(...RuntimeMode(options, context))
            break
        case 'extract':
            plugins.push(...ExtractMode(options, context))
            break
        case 'progressive':
            plugins.push(...ProgressiveMode(options, context))
            break
        case 'pre-render':
            plugins.push(...PreRenderMode(options, context))
            break
    }

    return plugins
}
