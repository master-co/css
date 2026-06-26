import { rm, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { buildPlayCompiler } from './build-play-compiler'

const siteDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const publicPlayCompilerDir = join(siteDir, 'public/play-compiler')
const publicMonacoEditorDir = join(siteDir, 'public/monaco-editor')

await Promise.all([
    rm(publicPlayCompilerDir, { recursive: true, force: true }),
    rm(publicMonacoEditorDir, { recursive: true, force: true })
])

await buildPlayCompiler(publicPlayCompilerDir)
await stat(join(publicPlayCompilerDir, 'compiler.js'))

const buildResult = spawnSync('opennextjs-cloudflare', ['build', '--skipWranglerConfigCheck'], {
    cwd: siteDir,
    stdio: 'inherit',
    shell: process.platform === 'win32'
})

if (buildResult.error) {
    throw buildResult.error
}

if (buildResult.status !== 0) {
    process.exit(buildResult.status ?? 1)
}

const openNextDir = join(siteDir, '.open-next')
const assetsDir = join(openNextDir, 'assets/play-compiler')

await stat(join(assetsDir, 'compiler.js'))

const serverBundleCopies = [
    join(openNextDir, 'server-functions/default/site/public/play-compiler'),
    join(openNextDir, 'server-functions/default/public/play-compiler')
]

let prunedCopies = 0
for (const serverBundleCopy of serverBundleCopies) {
    try {
        await rm(serverBundleCopy, { recursive: true })
        prunedCopies += 1
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw error
        }
    }
}

console.log(`Pruned Play compiler public copy from ${prunedCopies} Worker server bundle path(s)`)

await rm(publicPlayCompilerDir, { recursive: true, force: true })
