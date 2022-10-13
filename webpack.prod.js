const jsConfig = require('./webpack.common.js');
const path = require('path');
const webpack = require('webpack');
const glob = require('glob');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const src = path.resolve('./src');
const packagePath = path.join(src, 'package.json');
const package = require(packagePath);
const master = require('./master.json');

module.exports = {
    entry: './src/index.ts',
    devtool: 'source-map',
    resolve: jsConfig.resolve,
    externals: [
        ...Object.keys(package.peerDependencies || []),
        ...Object.keys(package.dependencies || [])
    ],
    mode: 'production',
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    format: {
                        comments: false,
                    },
                    compress: {
                        drop_console: true
                    }
                },
                extractComments: false
            }),
        ],
    },
    module: {
        rules: [
            ...jsConfig.module.rules
        ]
    },
    output: {
        clean: true,
        library: {
            name: '@master/css',
            type: 'umd',
        },
        globalObject: 'this'
    },
    plugins: [
        new webpack.ProgressPlugin(),
        new CopyPlugin({
            patterns: [
                ...master.assets.map((glob) => ({
                    from: glob,
                    noErrorOnMissing: true
                }))
            ],
        }),
        ...jsConfig.plugins
    ]
}