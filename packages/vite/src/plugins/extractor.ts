import CSSExtractor from '@master/css-extractor'
import type { Plugin } from 'vite'
import type { PluginContext } from '../core'
import type { PluginOptions } from '../options'

export default function ExtractorPlugin(options: PluginOptions, context: PluginContext): Plugin {
    return {
        name: 'master-css:extractor',
        enforce: 'pre',
        async configResolved(config) {
            const extractor = new CSSExtractor(options.extractor, config.root)
            context.extractor = extractor
            await extractor.init()
            extractor.options.verbose = 0
            // Vite's `transform` hook below feeds the extractor module-by-
            // module, so the extractor itself does NOT need to glob the
            // workspace at startup — clearing `include` prevents the
            // extractor's own `prepare()` from double-walking source.
            //
            // BUT: a user who passes `extractor: { include: [...] }`
            // explicitly is asking us to seed extra paths Vite would not
            // otherwise transform (e.g. `node_modules/some-lib/dist`).
            // Respect that — only blank `include` when the user did not
            // customise it.
            const userInclude = options.extractor
                && Array.isArray(options.extractor.include)
                ? options.extractor.include
                : null
            const cssInclude = extractor.extractorDirectives?.include
            if ((!userInclude || userInclude.length === 0) && (!cssInclude || cssInclude.length === 0)) {
                extractor.options.include = []
            }
        },
    }
}
