import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'

export const EMITTED_GLOBALS_PLACEHOLDER = '__MASTER_CSS_FINAL_EMITTED_GLOBALS__'
export const finalEmittedGlobalsModule = `export default JSON.parse(${JSON.stringify(EMITTED_GLOBALS_PLACEHOLDER)});`

/** Resolve ownership after module traversal, before minification and content hashing. */
export default function RuntimeMetadataPlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
  return {
    apply(compiler) {
      if (!context.shouldInjectRuntime() || compiler.options.mode === 'development') return
      compiler.hooks.thisCompilation.tap('master-css:runtime-metadata', compilation => {
        if (!compilation.hooks.processAssets?.tapPromise || !compiler.webpack?.sources?.ReplaceSource) return
        compilation.hooks.processAssets.tapPromise({ name: 'master-css:runtime-metadata', stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE }, async assets => {
          const result = await context.createGeneratedCSSResult()
          for (const [name, asset] of Object.entries(assets)) {
            if (!/\.[cm]?js$/.test(name)) continue
            const source = String(asset.source())
            if (!source.includes(EMITTED_GLOBALS_PLACEHOLDER)) continue
            const replacement = new compiler.webpack.sources.ReplaceSource(asset)
            for (const match of source.matchAll(new RegExp(`(["'])${EMITTED_GLOBALS_PLACEHOLDER}\\1`, 'g'))) {
              replacement.replace(match.index, match.index + match[0].length - 1, JSON.stringify(JSON.stringify(result.emittedGlobals)))
            }
            compilation.updateAsset(name, replacement)
          }
        })
      })
    }
  }
}
