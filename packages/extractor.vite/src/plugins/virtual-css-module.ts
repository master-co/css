import CSSExtractor from '@master/css-extractor'
import type { Plugin } from 'vite'

/**
 * Pre-insert code for all modules
 */
export default function VirtualCSSModulePlugin(
    extractor: CSSExtractor,
): Plugin {
    return {
        name: 'master-css-extractor:virtual-css-module',
        enforce: 'post',
        async resolveId(id) {
            if (id === extractor.options.module) {
                return extractor.resolvedVirtualModuleId
            }
        },
        load(id) {
            if (id === extractor.resolvedVirtualModuleId) {
                console.log('🔺')
                return extractor.css.text
            }
        },
    } as Plugin
}