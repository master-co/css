import { PluginContext, PluginOptions } from '../core'
import { type Plugin } from 'vite'
import CSSBuilder, { Options } from '@master/css-builder'
import VirtualCSSModulePlugin from '../plugins/virtual-css-module'
import VirtualCSSHMRPlugin from '../plugins/virtual-css-hmr'
import InjectVirtualCSSImportPlugin from '../plugins/inject-virtual-css-init'

export default function ExtractMode(options: PluginOptions, context: PluginContext): Plugin[] {
    const builder: CSSBuilder = new CSSBuilder(options.builder)
    return [
        {
            name: 'master-css:static',
            enforce: 'pre',
            apply(_, env) {
                return !env.isSsrBuild
            },
            async buildStart() {
                builder.init()
                builder.options.verbose = 0
                builder.options.include = []
                await builder.prepare()
            },
            async transform(code, id) {
                const resolvedVirtualModuleId = builder.resolvedVirtualModuleId
                if (id !== resolvedVirtualModuleId && !id.endsWith('.css')) {
                    await builder.insert(id, code)
                }
            },
            async configureServer(server) {
                await server.waitForRequestsIdle()
            }
        },
        InjectVirtualCSSImportPlugin(options, context, builder),
        VirtualCSSHMRPlugin(builder),
        VirtualCSSModulePlugin(builder),
    ]
}