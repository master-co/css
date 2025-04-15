import CSSBuilder from '@master/css-builder'
import type { Plugin } from 'vite'

export default function VirtualCSSModulePlugin(builder: CSSBuilder): Plugin {
    return {
        name: 'master-css:static:virtual-css-module:build',
        apply: 'build',
        enforce: 'pre',
        async resolveId(id) {
            if (id === builder.options.module) {
                return builder.resolvedVirtualModuleId
            }
        },
        load(id) {
            if (id === builder.resolvedVirtualModuleId) {
                return builder.slotCSSRule
            }
        },
        generateBundle(options, bundle) {
            const cssFileNames = Object.keys(bundle).filter(eachFileName => eachFileName.endsWith('.css'))
            for (const eachCssFileName of cssFileNames) {
                const chunk = bundle[eachCssFileName]
                if (chunk.type === 'asset') {
                    // @ts-expect-error
                    bundle[eachCssFileName]['source'] = bundle[eachCssFileName]['source'].replace(builder.slotCSSRule, builder.css.text)
                }
            }
            return
        }
    }
}