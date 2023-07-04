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
        moduleParsed({ id, importedIds }) {
            console.log(id)
        },
        transformIndexHtml: {
            order: 'pre',
            handler: async (html, { filename }) => {
                console.log('🟢 index.html')
                await extractor.insert(filename, html)
            }
        },
        async transform(code, id) {
            if (id !== extractor.resolvedVirtualModuleId) {
                console.log('🟢')
                await extractor.insert(id, code)
            }
        },
    } as Plugin
}