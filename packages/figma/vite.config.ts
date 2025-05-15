import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import react from '@vitejs/plugin-react'

console.log(process.env.NODE_ENV)

export default defineConfig(({ mode }) => ({
    root: 'src',
    plugins: [
        react(),
        viteSingleFile()
    ],
    build: {
        emptyOutDir: true,
        outDir: '../out',
        rollupOptions: {
            input: {
                main: `src/${mode}.html`
            }
        },
    },
}))