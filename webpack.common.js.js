const path = require('path');
const src = path.join('./src');
const CreateColorTest = require('./src/plugins/create-color-scss');

module.exports = {
    resolve: {
        extensions: ['.js', '.ts', '.mjs'],
        modules: [src, path.join('./node_modules')]
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'esbuild-loader',
                options: {
                    loader: 'ts',
                    target: 'es2015',
                    tsconfigRaw: require(path.resolve(
                            process.env.WEBPACK_SERVE
                                ? './tsconfig.json'
                                : './tsconfig.prod.json'
                        )
                    )
                }
            },
            {
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'esbuild-loader',
                options: {
                    target: 'es2015'
                }
            },
        ]
    },
    plugins: [new CreateColorTest()]
}