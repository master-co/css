const webpack = require('webpack');
const jsConfig = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const master = require('./master.json');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: './dev/src/index.ts',
    resolve: {
        extensions: jsConfig.resolve.extensions,
        modules: [
            ...jsConfig.resolve.modules,
            './dev/node_modules'
        ],
        plugins: [new TsconfigPathsPlugin()]
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
            ...jsConfig.module.rules
        ]
    },
    plugins: [
        new webpack.ProgressPlugin(),
        new HtmlWebpackPlugin({
            title: master.name,
            favicon: './dev/src/favicon.png',
            template: './dev/src/index.html'
        }),
        ...jsConfig.plugins
    ]
}