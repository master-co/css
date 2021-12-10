const path = require('path');
const root = path.resolve(process.env.WEBPACK_SERVE ? '../' : './');
const src = path.join(root, './src');

module.exports = {
    resolve: {
        extensions: ['.js', '.ts', '.mjs'],
        modules: [src, path.join(root, './node_modules')]
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                options: {
                    configFile: path.join(root, './tsconfig.json')
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
            },
            {
                test: /\.(sass|scss|css)$/,
                use: [
                    { loader: 'css-loader' },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                config: path.join(root, './postcss.config.js'),
                            },
                        }
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sassOptions: {
                                includePaths: [path.join(root, './node_modules')]
                            }
                        }
                    }]
            }
        ]
    }
}