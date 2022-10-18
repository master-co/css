const { build } = require('esbuild')
const fs = require('fs')

fs.rmSync('./dist', { recursive: true, force: true });

build({
    entryPoints: ['./src/index.ts'],
    outfile: './dist/index.js',
    minify: true,
    bundle: true,
    format: 'cjs'
})
    .catch(() => process.exit(1))