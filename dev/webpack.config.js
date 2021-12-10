const webpack = require('webpack');
const common = require('../webpack.common');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const master = require('../master.json');

module.exports = {
    mode: 'development',
    entry: './src/index.ts',
    resolve: {
        extensions: common.resolve.extensions,
        modules: [
            ...common.resolve.modules,
            './node_modules'
        ]
    },
    devtool: 'inline-source-map',
    devServer: {
        hot: false,
        // open: true,
        watchFiles: [
            './src/**/*',
            '../src/**/*'
        ],
    },
    module: {
        rules: [
            ...common.module.rules,
            {
                test: /\.html$/,
                loader: 'raw-loader'
            }
        ]
    },
    plugins: [
        new webpack.ProgressPlugin(),
        new HtmlWebpackPlugin({
            title: master.name,
            favicon: './src/favicon.png',
            template: './src/index.html'
        })
    ]
}