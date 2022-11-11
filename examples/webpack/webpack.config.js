const HtmlWebpackPlugin = require('html-webpack-plugin')
const { MasterCSSWebpackPlugin } = require('@master/css-compiler')

module.exports = {
    entry: './src/index.ts',
    plugins: [
        new HtmlWebpackPlugin({ template: './src/index.html' }),
        new MasterCSSWebpackPlugin()
    ],
    devServer: {
        static: './src',
        host: 'localhost',
        hot: true
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
}