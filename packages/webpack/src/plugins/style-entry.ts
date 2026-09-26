import { fileURLToPath } from 'node:url'
import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'

function resolveStylesheetLoaderPath() {
  return fileURLToPath(new URL('../stylesheet-loader.js', import.meta.url))
}

export default function StyleEntryPlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
  return {
    apply(compiler: Compiler) {
      if (compiler.options.experiments?.css) {
        compiler.options.module.rules.push({ test: /[/\\]node_modules[/\\]\.master-css[/\\]stylesheets[/\\][a-f0-9]{64}\.css$/, type: 'css/global' })
      }
      compiler.options.module.rules.push({
        test: /\.(css|scss|sass)$/,
        enforce: 'pre',
        use: [
          {
            loader: resolveStylesheetLoaderPath(),
            options: {
              virtualCSSImportModuleId: context.virtualCSSImportModuleId,
              nativeCSS: Boolean(compiler.options.experiments?.css),
              preserveImports: context.mode === 'static' && compiler.options.mode !== 'development'
            }
          }
        ]
      })
    }
  }
}
