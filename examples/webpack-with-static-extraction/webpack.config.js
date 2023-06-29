const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CSSExtractorPlugin } = require('@master/css-extractor.webpack')

module.exports = {
    entry: './src/index.ts',
    plugins: [
        new HtmlWebpackPlugin({ template: './src/index.html', filename: 'index.html' }),
        new CSSExtractorPlugin()
    ],
    devtool: 'inline-source-map',
    devServer: {
        watchFiles: ['./src/index.html']
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
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    stats: 'minimal'
}