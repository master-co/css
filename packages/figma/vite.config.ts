import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig(({ mode }) => ({
    root: 'app',
    plugins: [
        viteSingleFile()
    ],
    build: {
        rollupOptions: {
            input: {
                main: `app/${mode}.html`
            }
        },
        outDir: '../out'
    },
}))