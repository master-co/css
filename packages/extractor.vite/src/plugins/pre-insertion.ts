import CSSExtractor from '@master/css-extractor'
import type { Plugin } from 'vite'

/**
 * Pre-insert code for all modules
 */
export default function PreInsertionPlugin(
    extractor: CSSExtractor,
): Plugin {
    return {
        name: 'master-css-extractor:pre-insertion',
        enforce: 'pre',
        apply(config, env) {
            return !env.ssrBuild
        },
        async buildStart() {
            await extractor.prepare()
        },
        transformIndexHtml: {
            order: 'pre',
            handler: async (html, { filename }) => {
                await extractor.insert(filename, html)
            }
        },
        async transform(code, id) {
            if (id !== extractor.resolvedVirtualModuleId) {
                await extractor.insert(id, code)
            }
        },
    } as Plugin
}