import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { expect, it } from 'vitest'
import webpack from 'webpack'

// BH-0017: root and nested HTML must both resolve injected runtime assets.
it('resolves relative runtime assets from each emitted HTML directory', async () => {
    const root = mkdtempSync(join(tmpdir(), 'master-css-webpack-bh-'))
    const dist = join(root, 'dist')
    const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
    const Plugin = (await import(pathToFileURL(join(packageDir, 'dist/index.js')).href)).default
    try {
        writeFileSync(join(root, 'entry.js'), 'console.log("fixture")')
        writeFileSync(join(root, 'app.css'), '@master entry;\n@import "@master/css";')
        await new Promise<void>((resolveBuild, reject) => {
            webpack({
                mode: 'production', context: root, entry: './entry.js',
                resolve: { tsconfig: false },
                output: { path: dist, filename: '[name].js', chunkFilename: '[name].js', publicPath: './' },
                plugins: [new Plugin({ mode: 'runtime' }, root), {
                    apply(compiler) {
                        compiler.hooks.thisCompilation.tap('Fixture', (compilation) => {
                            compilation.hooks.processAssets.tap({
                                name: 'Fixture', stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
                            }, () => {
                                for (const name of ['index.html', 'pages/nested.html']) {
                                    compilation.emitAsset(name, new compiler.webpack.sources.RawSource('<!doctype html><html><head></head><body class="block"></body></html>'))
                                }
                            })
                        })
                    }
                }]
            }, (error, stats) => {
                if (error || stats?.hasErrors()) reject(error || new Error(stats?.toString({ all: false, errors: true })))
                else resolveBuild()
            })
        })
        for (const name of ['index.html', 'pages/nested.html']) {
            const html = readFileSync(join(dist, name), 'utf8')
            const href = html.match(/<script[^>]+src=["']?([^\s"'>]*master-css-runtime\.js)/)?.[1]
            expect(href, html).toBeTruthy()
            expect(existsSync(resolve(dist, dirname(name), href!)), `${name}: ${href}`).toBe(true)
        }
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
}, 120000)
