import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MasterCSSPlugin from '@master/css-webpack'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default {
  entry: './src/index.js',
  experiments: { css: true },
  // Exercise package exports instead of the monorepo's TypeScript source aliases.
  resolve: { tsconfig: false },
  output: {
    filename: '[name].js',
    chunkFilename: '[name].js',
    path: join(__dirname, 'dist'),
    clean: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: join(__dirname, 'src/index.html')
    }),
    new MasterCSSPlugin()
  ],
  devServer: {
    watchFiles: ['src/**/*']
  },
  module: {
    rules: [
      { test: /\.svg/, type: 'asset/resource' },
      { test: /\.css$/i, type: 'css/auto' }
    ]
  }
}
