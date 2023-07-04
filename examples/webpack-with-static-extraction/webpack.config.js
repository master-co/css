const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CSSExtractorPlugin } = require('@master/css-extractor.webpack')
const path = require('path')

/** @type {import('webpack').Configuration} */
module.exports = {
    plugins: [
        new HtmlWebpackPlugin({ template: './src/index.html' }),
        new CSSExtractorPlugin({ sources: ['./src/index.html'] })
    ],
    devServer: {
        webSocketServer: 'ws',
        watchFiles: {
            paths: ['src/**/*.html'],
            options: {
                usePolling: false,
            }
        }
    },
    module: {
        rules: [
            { test: /\.css$/, use: ['style-loader', 'css-loader'] }
        ]
    },
    stats: 'minimal'
}