import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
    root: 'src',
    plugins: [
        viteSingleFile()
    ],
    build: {
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: 'src/ui.html'
            }
        },
        outDir: '../out'
    },
})