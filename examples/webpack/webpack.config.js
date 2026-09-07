import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MasterCSSPlugin from '@master/css-webpack'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default {
  entry: './src/index.js',
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
    new MasterCSSPlugin({ sources: ['./src/index.html'] })
  ],
  devServer: {
    watchFiles: ['src/**/*']
  },
  module: {
    rules: [
      { test: /\.svg/, type: 'asset/resource' },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] }
    ]
  }
}
