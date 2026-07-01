import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: {
        index: 'src/index.ts'
    },
    platform: 'node',
    tsconfig: './tsconfig.prod.json',
    dts: true,
    deps: {
        onlyBundle: ['@sveltejs/sv-utils']
    },
    outputOptions: {
        entryFileNames: '[name].js',
        codeSplitting: false
    }
})
