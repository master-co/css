const webpack = require('webpack');
const common = require('./webpack.common');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const master = require('./master.json');

module.exports = {
    mode: 'development',
    entry: './dev/src/index.ts',
    resolve: {
        extensions: common.resolve.extensions,
        modules: [
            ...common.resolve.modules,
            './dev/node_modules'
        ]
    },
    devtool: 'inline-source-map',
    devServer: {
        hot: false,
        open: true,
        watchFiles: [
            './dev/src/**/*',
            '../src/**/*'
        ],
    },
    module: common.module,
    plugins: [
        new webpack.ProgressPlugin(),
        new HtmlWebpackPlugin({
            title: master.name,
            favicon: './dev/src/favicon.png',
            template: './dev/src/index.html'
        }),
        ...common.plugins
    ]
}