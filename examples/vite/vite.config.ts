import { defineConfig } from 'vite'
import masterCSS from '@master/css.vite'

export default defineConfig({
    plugins: [
        masterCSS()
    ]
})