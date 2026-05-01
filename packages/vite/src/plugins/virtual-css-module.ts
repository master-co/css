import type { Plugin } from 'vite'
import { PluginContext } from '../core'
import { PluginOptions } from '../options'

export default function VirtualCSSModulePlugin(options: PluginOptions, context: PluginContext): Plugin {
    // Whether some module ever asked Vite to load the virtual master.css.
    // Without this we cannot tell "user did not import virtual:master.css"
    // (no replacement expected) apart from "user imported it but downstream
    // CSS pipeline ate the placeholder" (silent build failure).
    let placeholderEmitted = false
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
                placeholderEmitted = true
                return context.extractor.slotCSSRule
            }
        },
        generateBundle(options, bundle) {
            const slotCSSRule = context.extractor.slotCSSRule
            const realCSS = context.extractor.css.text
            const cssFileNames = Object.keys(bundle).filter(eachFileName => eachFileName.endsWith('.css'))
            let replacedAny = false
            for (const eachCssFileName of cssFileNames) {
                const chunk = bundle[eachCssFileName]
                if (chunk.type === 'asset') {
                    // @ts-expect-error rollup OutputAsset.source is string|Uint8Array
                    const oldSource = String(bundle[eachCssFileName]['source'])
                    const newSource = oldSource.replace(slotCSSRule, realCSS)
                    if (newSource !== oldSource) {
                        // @ts-expect-error see above
                        bundle[eachCssFileName]['source'] = newSource
                        replacedAny = true
                    }
                }
            }
            // The placeholder was emitted (user imported the virtual module)
            // but no CSS chunk in the final bundle still contained it. The
            // most common cause is a downstream PostCSS plugin or minifier
            // having rewritten / dropped the placeholder rule, in which case
            // the build silently ships CSS missing every extracted class.
            // Surface this loudly so the user sees it instead of debugging an
            // empty stylesheet at runtime.
            if (placeholderEmitted && !replacedAny && realCSS.length > 0) {
                this.warn(
                    `[master-css.vite] Could not splice extracted CSS into any bundle asset. ` +
                    `The placeholder "${slotCSSRule}" was emitted but no CSS chunk in the final ` +
                    `bundle still contained it — most likely a downstream PostCSS plugin or ` +
                    `minifier rewrote/dropped it. The output will be missing all extracted classes.`
                )
            }
        }
    }
}