const webpack = require('webpack');
const cssConfig = require('./webpack.common.css');
const jsConfig = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const master = require('./master.json');

module.exports = {
    mode: 'development',
    entry: './dev/src/index.ts',
    resolve: {
        extensions: jsConfig.resolve.extensions,
        modules: [
            ...jsConfig.resolve.modules,
            './dev/node_modules'
        ]
    },
    devtool: 'inline-source-map',
    devServer: {
        watchFiles: [
            './dev/src/**/*',
            '../src/**/*'
        ],
    },
    module: {
        rules: [
            ...jsConfig.module.rules,
            ...cssConfig.module.rules
        ]
    },
    plugins: [
        new webpack.ProgressPlugin(),
        new HtmlWebpackPlugin({
            title: master.name,
            favicon: './dev/src/favicon.png',
            template: './dev/src/index.html'
        }),
        ...jsConfig.plugins,
        ...cssConfig.plugins
    ]
}