import CSSExtractor from '@master/css-extractor'
import type { Plugin } from 'vite'

/**
 * Pre-insert code for all modules
 */
export default function VirtualCSSModulePlugins(
    extractor: CSSExtractor,
): Plugin[] {
    return [
        {
            name: 'master-css-extractor:virtual-css-module:serve',
            apply: 'serve',
            enforce: 'post',
            async resolveId(id) {
                if (id === extractor.options.module) {
                    return extractor.resolvedVirtualModuleId
                }
            },
            load(id) {
                if (id === extractor.resolvedVirtualModuleId) {
                    return extractor.css.text
                }
            }
        } as Plugin,
        {
            name: 'master-css-extractor:virtual-css-module:build',
            apply: 'build',
            enforce: 'post',
            async resolveId(id) {
                if (id === extractor.options.module) {
                    return extractor.resolvedVirtualModuleId
                }
            },
            load(id) {
                if (id === extractor.resolvedVirtualModuleId) {
                    return extractor.slotCSSRule
                }
            },
            generateBundle(options, bundle) {
                const cssFileNames = Object.keys(bundle).filter(eachFileName => eachFileName.endsWith('.css'))
                for (const eachCssFileName of cssFileNames) {
                    const chunk = bundle[eachCssFileName]
                    if (chunk.type === 'asset') {
                        bundle[eachCssFileName]['source'] = bundle[eachCssFileName]['source'].replace(extractor.slotCSSRule, extractor.css.text)
                    }
                }
                return null
            }
        } as Plugin
    ]
}