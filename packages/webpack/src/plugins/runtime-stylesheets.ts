import { createCompilerSync } from '@master/css-compiler/node'
import { createRuntimeStylesheetAsset } from '@master/css-compiler/stylesheet'
import { MASTER_CSS_STYLESHEET_ASSET_SUFFIX } from '@master/css-schema/runtime-style'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'

export default function RuntimeStylesheetsPlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
  return {
    apply(compiler) {
      if (!context.shouldInjectRuntime()) return
      compiler.hooks.thisCompilation.tap('master-css:runtime-stylesheets', compilation => {
        compilation.hooks.processAssets.tap({ name: 'master-css:runtime-stylesheets', stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT }, assets => {
          using session = createCompilerSync()
          const stylesheets = Object.entries(assets).filter(([name]) => name.endsWith('.css'))
          const urls = stylesheets.map(([name]) => '/' + name)
          for (const [name, asset] of stylesheets) {
            const descriptor = createRuntimeStylesheetAsset(session, String(asset.source()), '/' + name, urls)
            compilation.emitAsset(name + MASTER_CSS_STYLESHEET_ASSET_SUFFIX, new compiler.webpack.sources.RawSource(JSON.stringify(descriptor)))
          }
        })
      })
    }
  }
}
