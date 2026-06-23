import { mkdir, rm, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const siteDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))

export async function buildPlayCompiler(outputDir = join(siteDir, 'public/play-compiler')) {
    const compilerOutputPath = join(outputDir, 'compiler.mjs')

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

    const { size: compilerSize } = await stat(compilerOutputPath)

    console.log(`Built Play compiler at ${outputDir}: compiler.mjs ${(compilerSize / 1024).toFixed(1)} KiB`)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    const outdirIndex = process.argv.indexOf('--outdir')
    await buildPlayCompiler(outdirIndex === -1 ? undefined : process.argv[outdirIndex + 1])
}
