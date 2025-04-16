import { PluginContext, PluginOptions } from '../core'
import { type Plugin } from 'vite'
import CSSBuilder from '@master/css-builder'
import VirtualCSSModulePlugin from '../plugins/virtual-css-module'
import VirtualCSSHMRPlugin from '../plugins/virtual-css-hmr'
import InjectVirtualCSSImportPlugin from '../plugins/inject-virtual-css-init'

export default function ExtractMode(options: PluginOptions, context: PluginContext): Plugin[] {
    const plugins: Plugin[] = [
        {
            name: 'master-css:builder',
            enforce: 'pre',
            configResolved(config) {
                context.builder = new CSSBuilder(options.builder, config.root)
                context.builder.init()
                context.builder.options.verbose = 0
                context.builder.options.include = []
            },
        },
        {
            name: 'master-css:static',
            enforce: 'pre',
            apply(_, env) {
                return !env.isSsrBuild
            },
            async buildStart() {
                await context.builder.prepare()
            },
            async transform(code, id) {
                const resolvedVirtualModuleId = context.builder.resolvedVirtualModuleId
                if (id !== resolvedVirtualModuleId && !id.endsWith('.css')) {
                    await context.builder?.insert(id, code)
                }
            },
            async configureServer(server) {
                await server.waitForRequestsIdle()
            }
        },
        VirtualCSSHMRPlugin(options, context),
        VirtualCSSModulePlugin(options, context),
    ]

    if (options.inject) {
        plugins.push(InjectVirtualCSSImportPlugin(options, context))
    }

    return plugins
}