
const path = require('path');
const Webpack = require('webpack');
const glob = require('globby');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const src = path.resolve('./src');
const packagePath = path.join(src, 'package.json');
const package = require(packagePath);
const assets = require('./assets.json');

module.exports = env => {
    const entryGlob = [
        path.join(src, '**/index.{ts,js}')
    ];

    return {
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
        externals: [
            ...Object.keys(package.peerDependencies || []),
            ...Object.keys(package.dependencies || [])
        ],
        mode: 'production',
        resolve: {
            extensions: ['.js', '.ts', '.mjs'],
            modules: [src, path.resolve('./node_modules')]
        },
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
                {
                    test: /\.ts$/,
                    loader: 'ts-loader',
                    options: {
                        configFile: path.resolve('./tsconfig.json')
                    }
                },
                {
                    test: /\.m?js$/,
                    exclude: /(node_modules|bower_components)/,
                    use: [
                        {
                            loader: 'babel-loader',
                            options: {
                                babelrc: true
                            }
                        }
                    ]
                }
            ]
        },
        output: {
            clean: true,
            libraryTarget: 'umd',
            globalObject: 'this'
        },
        devtool: 'source-map',
        plugins: [
            new Webpack.ProgressPlugin(),
            new CopyPlugin({
                patterns: [
                    {
                        from: packagePath,
                        transform(content) {
                            let package = JSON.parse(content.toString());
                            delete package.devDependencies;
                            delete package.publishConfig;
                            delete package.release;
                            delete package.files;
                            delete package.scripts;
                            return Buffer.from(JSON.stringify(package));;
                        },
                    },
                    ...assets.map((assets) => ({
                        from: assets,
                        noErrorOnMissing: true
                    }))
                ],
            }),
        ]
    }
}