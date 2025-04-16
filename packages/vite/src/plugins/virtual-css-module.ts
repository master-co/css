import type { Plugin } from 'vite'
import { PluginContext, PluginOptions } from '../core'

export default function VirtualCSSModulePlugin(options: PluginOptions, context: PluginContext): Plugin {
    return {
        name: 'master-css:static:virtual-css-module:build',
        enforce: 'pre',
        apply: 'build',
        resolveId(id) {
            if (id === context.builder.options.module) {
                return context.builder.resolvedVirtualModuleId
            }
        },
        load(id, opt) {
            if (id === context.builder.resolvedVirtualModuleId) {
                return context.builder.slotCSSRule
            }
        },
        generateBundle(options, bundle) {
            const cssFileNames = Object.keys(bundle).filter(eachFileName => eachFileName.endsWith('.css'))
            for (const eachCssFileName of cssFileNames) {
                const chunk = bundle[eachCssFileName]
                if (chunk.type === 'asset') {
                    // @ts-expect-error
                    bundle[eachCssFileName]['source'] = bundle[eachCssFileName]['source'].replace(context.builder.slotCSSRule, context.builder.css.text)
                }
            }
            return
        }
    }
}