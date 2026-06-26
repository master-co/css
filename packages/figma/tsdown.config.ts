import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: {
        'plugin.min': 'src/plugin.min.ts'
    },
    platform: 'browser',
    tsconfig: './tsconfig.prod.json',
    dts: false,
    deps: {
        onlyBundle: false
    },
    minify: true,
    outputOptions: {
        entryFileNames: '[name].mjs',
        codeSplitting: false,
        comments: false
    }
})
