const HtmlWebpackPlugin = require('html-webpack-plugin')
const MasterCSSWebpackPlugin = require('./src/plugins/webpack')

module.exports = {
    entry: './dev/index.js',
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    plugins: [
        new HtmlWebpackPlugin({ template: './dev/index.html' }),
        new MasterCSSWebpackPlugin()
    ],
    devServer: {
        host: 'localhost',
        watchFiles: ['./src/**/*']
    },
    stats: 'none',
    mode: 'development'
};