import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'

function replaceSlotCSSRule(source: string, slotCSSRule: string, realCSS: string) {
  let replaced = false
  const slotPattern = source.includes(slotCSSRule)
    ? slotCSSRule
    : /#master-css-slot\s*\{\s*--slot\s*:\s*0\s*;?\s*\}/g
  const nextSource = source.split(slotPattern).map((part, index) => {
    if (index === 0) return part
    if (replaced) return part
    replaced = true
    return realCSS + part
  }).join('')
  return { source: nextSource, replaced }
}

export default function GeneratedCSSAssetsPlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
  return {
    apply(compiler: Compiler) {
      compiler.hooks.thisCompilation.tap(context.name, (compilation) => {
        if (!compiler.webpack?.Compilation || !compiler.webpack?.sources?.RawSource) return
        const options = {
          name: context.name,
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE
        }
        const replaceGeneratedCSS = async (assets: Parameters<typeof compilation.hooks.processAssets.tap>[1] extends (...args: infer Args) => unknown ? Args[0] : Record<string, { source: () => unknown }>) => {
          if (context.mode !== 'static') return
          const css = await context.createGeneratedCSSModule()
          const cssAssetNames = Object.keys(assets).filter((assetName) => assetName.endsWith('.css'))
          for (const assetName of cssAssetNames) {
            const asset = compilation.getAsset(assetName)
            const oldSource = String(asset?.source.source() ?? assets[assetName].source())
            const result = replaceSlotCSSRule(oldSource, context.slotCSSRule, css)
            if (!result.replaced || result.source === oldSource) continue
            compilation.updateAsset(
              assetName,
              new compiler.webpack.sources.RawSource(result.source)
            )
          }
        }

        if (compilation.hooks.processAssets.constructor.name.includes('Async')) {
          compilation.hooks.processAssets.tapPromise(options, replaceGeneratedCSS)
        } else {
          compilation.hooks.processAssets.tap(options, (assets) => {
            void replaceGeneratedCSS(assets)
          })
        }
      })
    }
  }
}
