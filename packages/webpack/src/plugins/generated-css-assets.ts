import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'
import { posix } from 'node:path'
import { getBuildStylesheetDelivery, prepareBuildStylesheets } from '../utils/build-stylesheet-delivery'

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
          if (context.mode !== 'static' || compilation.errors.length) return
          let extracted: Awaited<ReturnType<typeof context.createGeneratedCSSResult>> | undefined
          let replacements: Awaited<ReturnType<typeof context.createStylesheetCSSResults>> = []
          const resourceContents = new Map<string, Buffer>()
          try {
            if (compiler.options.mode === 'development') extracted = await context.createGeneratedCSSResult()
            else replacements = await context.createStylesheetCSSResults(getBuildStylesheetDelivery(resourceContents))
          } catch (error) {
            compilation.errors.push(error instanceof Error ? error : new Error(String(error)))
            return
          }
          for (const dependency of [...(extracted?.dependencies ?? []), ...replacements.flatMap(({ result }) => result.dependencies ?? [])]) {
            compilation.fileDependencies.add(dependency)
          }
          try {
            const cssAssetNames = Object.keys(assets).filter((assetName) => assetName.endsWith('.css'))
            for (const assetName of cssAssetNames) {
              const asset = compilation.getAsset(assetName)
              const oldSource = String(asset?.source.source() ?? assets[assetName].source())
              if (compiler.options.mode !== 'development') {
                const result = prepareBuildStylesheets(oldSource, replacements)
                if (!result) continue
                const folder = posix.dirname(assetName)
                for (const stylesheet of result.assets) {
                  compilation.emitAsset(posix.join(folder, stylesheet.href), new compiler.webpack.sources.RawSource(stylesheet.css), { immutable: true })
                }
                for (const resource of result.resources) {
                  compilation.fileDependencies.add(resource.file)
                  const contents = resourceContents.get(resource.file)
                  if (!contents) throw new Error(`Missing captured stylesheet resource: ${resource.file}`)
                  compilation.emitAsset(posix.join(folder, resource.href), new compiler.webpack.sources.RawSource(contents), { immutable: true })
                }
                compilation.updateAsset(assetName, new compiler.webpack.sources.RawSource(result.source))
                continue
              }
              const result = replaceSlotCSSRule(oldSource, context.slotCSSRule, extracted!.css)
              if (!result.replaced || result.source === oldSource) continue
              compilation.updateAsset(
                assetName,
                new compiler.webpack.sources.RawSource(result.source)
              )
            }
          } catch (error) {
            compilation.errors.push(error instanceof Error ? error : new Error(String(error)))
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
