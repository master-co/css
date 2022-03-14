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
const entries = [
    ...glob.sync(path.join(src, '**/index.{ts,js}'))
];

module.exports = {
    entry: entries.reduce((entrypoint, eachPath) => {
        const parsePath = path.parse(path.relative(src, eachPath));
        const filename = path.join(parsePath.dir, parsePath.name);
        if (entrypoint[filename]) {
            entrypoint[filename].push(path.resolve(eachPath))
        } else {
            entrypoint[filename] = [path.resolve(eachPath)];
        }
        return entrypoint;
    }, {}),
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
                },
                extractComments: false,
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
            name: '@master/package',
            type: 'umd',
        },
        globalObject: 'self'
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