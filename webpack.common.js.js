const path = require('path');
const src = path.join('./src');

module.exports = {
    resolve: {
        extensions: ['.js', '.ts', '.mjs'],
        modules: [src, path.join('./node_modules')]
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                options: {
                    configFile: path.resolve(
                        process.env.WEBPACK_SERVE
                            ? './tsconfig.json'
                            : './tsconfig.prod.json'
                    )
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
        ]
    },
    plugins: []
}