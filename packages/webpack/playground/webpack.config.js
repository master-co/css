import path from 'node:path'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import MasterCSSPlugin from '@master/css-webpack'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

class EmitHTMLPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('EmitHTMLPlugin', (compilation) => {
      compilation.hooks.processAssets.tap({
        name: 'EmitHTMLPlugin',
        stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
      }, () => {
        compilation.emitAsset(
          'index.html',
          new compiler.webpack.sources.RawSource(readFileSync(path.join(__dirname, 'index.html'), 'utf-8'))
        )
      })
    })
  }
}

export default {
  context: __dirname,
  entry: './src/main.js',
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'dist'),
    clean: true
  },
  plugins: [
    new MasterCSSPlugin({}, __dirname),
    new EmitHTMLPlugin()
  ],
  devServer: {
    static: {
      directory: __dirname,
      watch: {}
    },
    host: '127.0.0.1',
    port: 5175
  },
  module: {
    rules: [
      { test: /\.css$/, use: ['style-loader', 'css-loader'] }
    ]
  }
}
