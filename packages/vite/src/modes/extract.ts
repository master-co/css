import { PluginContext } from '../core'
import { type Plugin } from 'vite'
import CSSExtractor from '@master/css-extractor'
import VirtualCSSModulePlugin from '../plugins/virtual-css-module'
import VirtualCSSHMRPlugin from '../plugins/virtual-css-hmr'
import InjectVirtualModulePlugin from '../plugins/inject-virtual-module'
import { PluginOptions } from '../options'

// File extensions Vite is expected to feed through `transform`. Mirrors the
// extractor's default `include` glob and is the universe of files that can
// realistically contain Master CSS class strings. Limiting the transform
// hook to this allow-list avoids pumping every .json / image-as-module /
// virtual chunk through the regex-heavy `extractLatentClasses`. The trailing
// `(?:\?|$)` lets through Vite's `?import` / `?url` / `?raw` suffixes.
const EXTRACTABLE_EXT = /\.(html|js|jsx|ts|tsx|svelte|astro|vue|md|mdx|pug|php)(?:\?|$)/

export default function ExtractMode(options: PluginOptions, context: PluginContext): Plugin[] {
    const plugins: Plugin[] = [
        {
            name: 'master-css:extractor',
            enforce: 'pre',
            async configResolved(config) {
                context.extractor = new CSSExtractor(options.extractorOptions, config.root)
                await context.extractor.init()
                context.extractor.options.verbose = 0
                // Vite's `transform` hook below feeds the extractor module-by-
                // module, so the extractor itself does NOT need to glob the
                // workspace at startup — clearing `include` prevents the
                // extractor's own `prepare()` from double-walking source.
                //
                // BUT: a user who passes `extractorOptions: { include: [...] }`
                // explicitly is asking us to seed extra paths Vite would not
                // otherwise transform (e.g. `node_modules/some-lib/dist`).
                // Respect that — only blank `include` when the user did not
                // customise it.
                const userInclude = options.extractorOptions
                    && Array.isArray(options.extractorOptions.include)
                    ? options.extractorOptions.include
                    : null
                if (!userInclude || userInclude.length === 0) {
                    context.extractor.options.include = []
                }
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
                if (id.startsWith('\0')) return
                if (id === context.extractor.resolvedVirtualModuleId) return
                // Only feed Master-CSS-bearing source extensions to the
                // extractor. The previous version accepted every non-`.css`
                // module — including `.json`, `?import` / `?url` query
                // requests, and binary-asset shim modules — pumping noise
                // through `extractLatentClasses` and the validator.
                if (!EXTRACTABLE_EXT.test(id)) return
                await context.extractor?.insert(id, code)
            },
            async configureServer(server) {
                await server.waitForRequestsIdle()
            }
        },
        VirtualCSSHMRPlugin(options, context),
        VirtualCSSModulePlugin(options, context),
    ]

    if (options.injectVirtualModule) {
        plugins.push(InjectVirtualModulePlugin(options, context))
    }

    return plugins
}
