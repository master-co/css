import type { Plugin } from 'vite'
import type { PluginContext } from '../core'
import type { PluginOptions } from '../options'
import { getExtractor } from '../utils/extractor-context'

export default function UsageGraphPlugin(_options: PluginOptions, context: PluginContext): Plugin {
    return {
        name: 'master-css:usage-graph',
        enforce: 'pre',
        apply(_, env) {
            return !env.isSsrBuild
        },
        async buildStart() {
            await getExtractor(context).prepare()
        },
        async transform(code, id) {
            if (id.startsWith('\0')) return
            await getExtractor(context).insert(id, code)
        },
        transformIndexHtml: {
            order: 'pre',
            handler: async (html, { filename, server }) => {
                if (server) return
                await getExtractor(context).insert(filename, html)
            }
        },
        async configureServer(server) {
            await server.waitForRequestsIdle()
        }
    }
}
