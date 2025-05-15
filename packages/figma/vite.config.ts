import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
    root: 'src',
    plugins: [
        react(),
        viteSingleFile()
    ],
    build: {
        outDir: '../out',
        rollupOptions: {
            input: {
                main: `src/${mode}.html`
            }
        },
    },
    resolve: {
        alias: {
            react: 'preact/compat',
            'react-dom/test-utils': 'preact/test-utils',
            'react-dom': 'preact/compat',
            'react/jsx-runtime': 'preact/jsx-runtime'
        }
    }
}))