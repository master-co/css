const HtmlWebpackPlugin = require('html-webpack-plugin')
const MasterCSSWebpackPlugin = require('@master/css.webpack').default

module.exports = {
    entry: './src/index.ts',
    plugins: [
        new HtmlWebpackPlugin({ template: './src/index.html' }),
        new MasterCSSWebpackPlugin()
    ],
    devServer: {
        static: './src'
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ],
    },
    resolve: {
        extensions: ['.ts', '.js']
    }
}