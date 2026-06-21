import type CSSExtractor from '@master/css-extractor'
import type { MasterCSSPreloaded } from '@master/css'
import type { StyleCSSSources } from '@master/css-stylesheet'
import type { Plugin, ResolvedConfig } from 'vite'
import PlanLoaderPlugin from './plugins/plan-loader'
import PlanVirtualModulePlugin from './plugins/plan-virtual-module'
import PreloadedVirtualModulePlugin from './plugins/preloaded-virtual-module'
import StaticMode from './modes/static'
import RuntimeMode from './modes/runtime'
import ProgressiveMode from './modes/progressive'
import PreRenderMode from './modes/pre-render'
import ContextPlugin from './plugins/context'
import ExtractorPlugin from './plugins/extractor'
import UsageGraphPlugin from './plugins/usage-graph'
import LocalComposePlugin from './plugins/local-compose'
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
    preloaded?: MasterCSSPreloaded
}

export default function masterCSS(options?: PluginOptions): Plugin[] {
    options = { ...defaultPluginOptions, ...options }
    const context = {
        includeGeneratedCSS: options.mode === 'static'
    } as PluginContext
    const plugins: Plugin[] = [
        ContextPlugin(options, context),
        PlanVirtualModulePlugin(options, context),
        PreloadedVirtualModulePlugin(context),
        PlanLoaderPlugin(context),
        ExtractorPlugin(options, context),
        UsageGraphPlugin(options, context),
        LocalComposePlugin(options, context),
        StyleEntryPlugin(options, context),
        StyleEntryHMRPlugin(options, context),
        StyleEntryBuildPlugin(options, context)
    ]
    switch (options.mode) {
        case 'runtime':
            plugins.push(...RuntimeMode(options, context))
            break
        case 'static':
            plugins.push(...StaticMode(options, context))
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
