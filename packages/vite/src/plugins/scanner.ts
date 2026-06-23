import CSSScanner from '@master/css-scanner'
import type { Plugin } from 'vite'
import type { PluginContext } from '../core'
import type { PluginOptions } from '../options'

export default function ScannerPlugin(options: PluginOptions, context: PluginContext): Plugin {
    return {
        name: 'master-css:scanner',
        enforce: 'pre',
        async configResolved(config) {
            const scanner = new CSSScanner(options.scanner, config.root)
            context.scanner = scanner
            await scanner.init()
            scanner.options.verbose = 0
            // Vite's `transform` hook below feeds the scanner module-by-
            // module, so the scanner itself does NOT need to glob the
            // workspace at startup — clearing `include` prevents the
            // scanner's own `prepare()` from double-walking source.
            //
            // BUT: a user who passes `scanner: { include: [...] }`
            // explicitly is asking us to seed extra paths Vite would not
            // otherwise transform (e.g. `node_modules/some-lib/dist`).
            // Respect that — only blank `include` when the user did not
            // customise it.
            const userInclude = options.scanner
                && Array.isArray(options.scanner.include)
                ? options.scanner.include
                : null
            if (!userInclude || userInclude.length === 0) {
                scanner.options.include = []
            }
        },
    }
}
