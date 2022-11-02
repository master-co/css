const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    entry: './src/index.ts',
    plugins: [
        new HtmlWebpackPlugin({ template: './src/index.html', scriptLoading: 'blocking' }),
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