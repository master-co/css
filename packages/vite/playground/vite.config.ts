import { defineConfig } from 'vite'
import masterCSS from '../src'

export default defineConfig({
    plugins: [
        masterCSS({ mode: 'static' })
    ]
})
