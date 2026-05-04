import { defineConfig } from 'vite'
import { compileCSS } from '../src'

export default defineConfig({
    plugins: [
        {
            name: 'master-css-compiler',
            enforce: 'pre',
            transform(code, id) {
                if (!id.endsWith('.css')) return
                return {
                    code: compileCSS(code, { from: id }).css,
                    map: null
                }
            }
        }
    ]
})
