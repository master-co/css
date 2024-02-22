const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CSSExtractorPlugin = require('@master/css-extractor.webpack')

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.join(__dirname, 'dist')
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, 'src/index.html')
        }),
        new CSSExtractorPlugin({ sources: ['./src/index.html'] })
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