import type { Plugin } from 'vite'
import { PluginContext } from '../core'
import { PluginOptions } from '../options'

export default function VirtualCSSModulePlugin(options: PluginOptions, context: PluginContext): Plugin {
    return {
        name: 'master-css:static:virtual-css-module:build',
        enforce: 'pre',
        apply: 'build',
        resolveId(id) {
            if (id === context.extractor.options.module) {
                return context.extractor.resolvedVirtualModuleId
            }
        },
        load(id, opt) {
            if (id === context.extractor.resolvedVirtualModuleId) {
                return context.extractor.slotCSSRule
            }
        },
        generateBundle(options, bundle) {
            const cssFileNames = Object.keys(bundle).filter(eachFileName => eachFileName.endsWith('.css'))
            for (const eachCssFileName of cssFileNames) {
                const chunk = bundle[eachCssFileName]
                if (chunk.type === 'asset') {
                    // @ts-expect-error
                    bundle[eachCssFileName]['source'] = bundle[eachCssFileName]['source'].replace(context.extractor.slotCSSRule, context.extractor.css.text)
                }
            }
            return
        }
    }
}