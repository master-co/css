const { build } = require('esbuild')
const fs = require('fs')

fs.rmSync('./dist', { recursive: true, force: true });

const config = {
    minify: true,
    bundle: true,
    format: 'cjs'
}

const cssBuildConfig = {
    ...config,
    entryPoints: ['./src/index.ts'],
    outfile: './dist/index.js',
}

const compilerBuildConfig = {
    ...config,
    entryPoints: ['./src/compiler/index.ts'],
    outfile: './dist/compiler.js',
    platform: 'node',
    external: ['chalk', 'path']
}

/* @master/css */
build(cssBuildConfig)
    .catch(() => process.exit(1))

/* @master/css/compiler */
build(compilerBuildConfig)
    .catch(() => process.exit(1))

module.exports = {
    cssBuildConfig,
    compilerBuildConfig
}