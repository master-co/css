import { copyFile, mkdir, rm, stat } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const require = createRequire(import.meta.url)
const siteDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const wasmSourcePath = require.resolve('lightningcss-wasm/lightningcss_node.wasm')

export async function buildPlayCompiler(outputDir = join(siteDir, 'public/play-compiler')) {
    const compilerOutputPath = join(outputDir, 'compiler.mjs')
    const wasmOutputPath = join(outputDir, 'lightningcss_node.wasm')

    await rm(outputDir, { recursive: true, force: true })
    await mkdir(outputDir, { recursive: true })

    await build({
        entryPoints: [fileURLToPath(new URL('../play-compiler/compile-play-css.ts', import.meta.url))],
        outfile: compilerOutputPath,
        bundle: true,
        format: 'esm',
        platform: 'browser',
        target: 'es2022',
        conditions: ['browser', 'default', 'import'],
        external: ['fs'],
        loader: {
            '.json': 'json'
        },
        minify: true,
        legalComments: 'none',
        logLevel: 'silent'
    })

    await copyFile(wasmSourcePath, wasmOutputPath)

    const [{ size: compilerSize }, { size: wasmSize }] = await Promise.all([
        stat(compilerOutputPath),
        stat(wasmOutputPath)
    ])

    console.log(`Built Play compiler at ${outputDir}: compiler.mjs ${(compilerSize / 1024).toFixed(1)} KiB, lightningcss_node.wasm ${(wasmSize / 1024).toFixed(1)} KiB`)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    const outdirIndex = process.argv.indexOf('--outdir')
    await buildPlayCompiler(outdirIndex === -1 ? undefined : process.argv[outdirIndex + 1])
}
