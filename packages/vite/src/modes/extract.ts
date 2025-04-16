import { PluginContext, PluginOptions } from '../core'
import { type Plugin } from 'vite'
import CSSExtractor from '@master/css-extractor'
import VirtualCSSModulePlugin from '../plugins/virtual-css-module'
import VirtualCSSHMRPlugin from '../plugins/virtual-css-hmr'
import InjectVirtualCSSImportPlugin from '../plugins/inject-virtual-css-init'

export default function ExtractMode(options: PluginOptions, context: PluginContext): Plugin[] {
    const plugins: Plugin[] = [
        {
            name: 'master-css:extractor',
            enforce: 'pre',
            configResolved(config) {
                context.extractor = new CSSExtractor(options.extractor, config.root)
                context.extractor.init()
                context.extractor.options.verbose = 0
                context.extractor.options.include = []
            },
        },
        {
            name: 'master-css:static',
            enforce: 'pre',
            apply(_, env) {
                return !env.isSsrBuild
            },
            async buildStart() {
                await context.extractor.prepare()
            },
            async transform(code, id) {
                const resolvedVirtualModuleId = context.extractor.resolvedVirtualModuleId
                if (id !== resolvedVirtualModuleId && !id.endsWith('.css')) {
                    await context.extractor?.insert(id, code)
                }
            },
            async configureServer(server) {
                await server.waitForRequestsIdle()
            }
        },
        VirtualCSSHMRPlugin(options, context),
        VirtualCSSModulePlugin(options, context),
    ]

    if (options.injectInit) {
        plugins.push(InjectVirtualCSSImportPlugin(options, context))
    }

    return plugins
}