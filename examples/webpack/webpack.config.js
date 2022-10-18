const HtmlWebpackPlugin = require('html-webpack-plugin')
const { MasterCSSWebpackPlugin } = require('../../dist/compiler')

module.exports = {
    entry: './src/index.ts',
    plugins: [
        new HtmlWebpackPlugin({ template: './src/index.html' }),
        new MasterCSSWebpackPlugin({
            config: '../../master.css.js',
            // debug: ['accepts']
        })
    ],
    devServer: {
        host: 'localhost',
        watchFiles: ['./src/**/*']
    },
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
    stats: 'none',
    mode: 'development'
};