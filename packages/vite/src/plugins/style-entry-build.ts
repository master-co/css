import type { Plugin } from 'vite'
import type { PluginContext } from '../core'
import type { PluginOptions } from '../options'
import getExtractedCSS from '../utils/extracted-css'
import { getScanner } from '../utils/scanner-context'

function replaceSlotCSSRule(source: string, slotCSSRule: string, realCSS: string): { source: string, replaced: boolean } {
  let replaced = false
  const nextSource = source.split(slotCSSRule).map((part, index) => {
    if (index === 0) return part
    if (replaced) return part
    replaced = true
    return realCSS + part
  }).join('')
  return { source: nextSource, replaced }
}

export default function StyleEntryBuildPlugin(_options: PluginOptions, context: PluginContext): Plugin {
  return {
    name: 'master-css:style-entry:build',
    enforce: 'pre',
    apply: 'build',
    async generateBundle(_options, bundle) {
      const slotCSSRule = getScanner(context).slotCSSRule
      const realCSS = await getExtractedCSS(context)
      const cssFileNames = Object.keys(bundle).filter(eachFileName => eachFileName.endsWith('.css'))
      let replacedAny = false
      for (const eachCssFileName of cssFileNames) {
        const chunk = bundle[eachCssFileName]
        if (chunk.type === 'asset') {
          // @ts-expect-error rollup OutputAsset.source is string|Uint8Array
          const oldSource = String(bundle[eachCssFileName]['source'])
          const result = replaceSlotCSSRule(oldSource, slotCSSRule, realCSS)
          if (result.source !== oldSource) {
            // @ts-expect-error see above
            bundle[eachCssFileName]['source'] = result.source
          }
          if (result.replaced) {
            replacedAny = true
          }
        }
      }
      // The placeholder was emitted by a managed CSS import but no CSS
      // chunk in the final bundle still contained it. A downstream CSS
      // plugin or minifier likely rewrote or dropped the internal slot.
      if (context.virtualCSSPlaceholderEmitted && !replacedAny && realCSS.length > 0) {
        this.warn(
          `[master-css.vite] Could not splice managed style CSS into any bundle asset. ` +
          `The placeholder "${slotCSSRule}" was emitted but no CSS chunk in the final ` +
          `bundle still contained it — Vite's downstream CSS pipeline (a PostCSS ` +
          `plugin in your vite config, the bundler's CSS minifier, etc.) most likely ` +
          `rewrote or dropped it. The output will be missing Master CSS output.`
        )
      }
    }
  }
}
