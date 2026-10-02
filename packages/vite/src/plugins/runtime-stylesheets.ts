import type { Plugin } from 'vite'
import { createCompilerSync } from '@master/css-compiler/node'
import { createRuntimeStylesheetAsset } from '@master/css-compiler/stylesheet'
import { MASTER_CSS_STYLESHEET_ASSET_SUFFIX } from '@master/css-schema/runtime-style'
import type { ResolvedMasterCSSVitePluginOptions } from '../options'

export default function RuntimeStylesheetsPlugin(options: ResolvedMasterCSSVitePluginOptions): Plugin {
  return {
    name: 'master-css:runtime-stylesheets', apply: 'build', enforce: 'post',
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        if (options.mode !== 'runtime' && options.mode !== 'progressive') return
        using compiler = createCompilerSync()
        const assets = Object.values(bundle).filter(asset => asset.type === 'asset' && asset.fileName.endsWith('.css'))
        const urls = assets.map(asset => '/' + asset.fileName)
        for (const asset of assets) {
          if (asset.type !== 'asset') continue
          const css = typeof asset.source === 'string' ? asset.source : new TextDecoder().decode(asset.source)
          const descriptor = createRuntimeStylesheetAsset(compiler, css, '/' + asset.fileName, urls)
          this.emitFile({ type: 'asset', fileName: asset.fileName + MASTER_CSS_STYLESHEET_ASSET_SUFFIX, source: JSON.stringify(descriptor) })
        }
      }
    }
  }
}
