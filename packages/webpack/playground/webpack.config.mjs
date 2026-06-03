import path from 'node:path'
import { fileURLToPath } from 'node:url'
import MasterCSSPlugin from '@master/css.webpack'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default {
    context: __dirname,
    entry: './src/main.js',
    output: {
        filename: 'bundle.js',
        path: path.join(__dirname, 'dist'),
        clean: true
    },
    plugins: [
        new MasterCSSPlugin({
            sources: [
                './index.html',
                './src/**/*.{js,html}'
            ]
        }, __dirname)
    ],
    devServer: {
        static: {
            directory: __dirname,
            watch: {}
        },
        host: '127.0.0.1',
        port: 5175
    },
    module: {
        rules: [
            { test: /\.css$/, use: ['style-loader', 'css-loader'] }
        ]
    }
}
