import { PluginContext, PluginOptions } from '../core'
import type { Plugin } from 'vite'
import CSSBuilder, { Options as ExtractorOptions } from '@master/css-builder'
import VirtualCSSModulePlugin from '../plugins/virtual-css-module'
import VirtualCSSHMRPlugin from '../plugins/virtual-css-hmr'

export default function ExtractMode(options: PluginOptions, context: PluginContext): Plugin[] {
    const builder = new CSSBuilder(options.builder)
    builder.on('init', (opt: ExtractorOptions) => {
        opt.include = []
    })
    return [
        {
            name: 'master-css:static',
            enforce: 'pre',
            apply(_, env) {
                if (!env.isSsrBuild) {
                    builder.init()
                    return true
                } else {
                    return false
                }
            },
            async buildStart() {
                await builder.prepare()
            },
            async transform(code, id) {
                const resolvedVirtualModuleId = builder.resolvedVirtualModuleId
                if (id !== resolvedVirtualModuleId && !id.endsWith('.css')) {
                    await builder.insert(id, code)
                }
            }
        },
        VirtualCSSHMRPlugin(builder),
        VirtualCSSModulePlugin(builder),
    ]
}