import { fileURLToPath } from 'node:url'
import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'

function resolveStylesheetLoaderPath() {
  return fileURLToPath(new URL('../stylesheet-loader.js', import.meta.url))
}

export default function StyleEntryPlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
  return {
    apply(compiler: Compiler) {
      compiler.options.module.rules.push({
        test: /\.(css|scss|sass)$/,
        enforce: 'pre',
        use: [
          {
            loader: resolveStylesheetLoaderPath(),
            options: {
              virtualCSSImportModuleId: context.virtualCSSImportModuleId
            }
          }
        ]
      })
    }
  }
}
