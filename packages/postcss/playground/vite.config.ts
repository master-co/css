import { defineConfig } from 'vite'
import masterCSS from '../src'

export default defineConfig({
    css: {
        postcss: {
            plugins: [
                masterCSS()
            ]
        }
    }
})
