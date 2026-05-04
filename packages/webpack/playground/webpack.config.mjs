import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MasterCSSExtractorPlugin } from '@master/css.webpack'

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
        new MasterCSSExtractorPlugin({
            config: 'master.css',
            sources: [
                './index.html',
                './src/**/*.{js,html}'
            ]
        }, __dirname)
    ],
    devServer: {
        static: __dirname,
        host: '127.0.0.1',
        port: 5175
    }
}
