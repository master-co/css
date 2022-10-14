const { build } = require('esbuild')
const fs = require('fs')

fs.rmSync('./dist', { recursive: true, force: true });

const config = {
    entryPoints: ['./src/index.ts'],
    minify: true,
    bundle: true,
    treeShaking: true
}

/* commonjs */
build({
    ...config,
    outfile: './dist/index.js',
    format: 'cjs'
})
    .catch(() => process.exit(1))

/* esm */
build({
    ...config,
    outfile: './dist/index.esm.js',
    format: 'esm'
})
    .catch(() => process.exit(1))