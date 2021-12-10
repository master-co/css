const webpack = require('webpack');
const common = require('../webpack.common');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const master = require('../master.json');

module.exports = {
    mode: 'development',
    entry: {
        app: './index.ts'
    },
    resolve: {
        extensions: common.resolve.extensions,
        modules: [
            ...common.resolve.modules,
            './node_modules'
        ]
    },
    devtool: 'inline-source-map',
    devServer: {
        hot: true,
        // open: true
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
            favicon: './favicon.png',
            template: './index.html'
        })
    ]
}