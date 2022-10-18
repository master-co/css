const { build } = require('esbuild')
const fs = require('fs')

fs.rmSync('./dist', { recursive: true, force: true });

const config = {
    minify: true,
    bundle: true,
    // treeShaking: true
}

/* @master/css */
build({
    ...config,
    entryPoints: ['./src/index.ts'],
    outfile: './dist/index.js',
    format: 'cjs'
})
    .catch(() => process.exit(1))

/* @master/css/compiler */
build({
    ...config,
    entryPoints: ['./src/compiler/index.ts'],
    outfile: './dist/compiler.js',
    format: 'cjs',
    platform: 'node',
    external: ['chalk', 'path']
})
    .catch(() => process.exit(1))
