const common = require('./webpack.common.js');
const path = require('path');
const webpack = require('webpack');
const glob = require('globby');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const src = path.resolve('./src');
const packagePath = path.join(src, 'package.json');
const package = require(packagePath);
const master = require('./master.json');
const entryGlob = [
    path.join(src, '**/index.{ts,js}')
];

module.exports = {
    entry: glob.sync(entryGlob).reduce((entrypoint, eachPath) => {
        const parsePath = path.parse(path.relative(src, eachPath));
        const filename = path.join(parsePath.dir, parsePath.name);
        if (entrypoint[filename]) {
            entrypoint[filename].push(path.resolve(eachPath))
        } else {
            entrypoint[filename] = [path.resolve(eachPath)];
        }
        return entrypoint;
    }, {}),
    resolve: common.resolve,
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
                },
                extractComments: false,
            }),
        ],
    },
    module: {
        rules: common.module.rules
    },
    output: {
        clean: true,
        libraryTarget: 'umd',
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
        ...common.plugins
    ]
}