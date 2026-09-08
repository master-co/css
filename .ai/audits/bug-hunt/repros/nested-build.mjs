import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { resolve, dirname } from 'node:path'
import { lstatSync, unlinkSync } from 'node:fs'
const packageCwd = process.cwd()
const repo = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(resolve(repo,'package.json'))
process.chdir('playground')
const kind = process.argv[2]
if (process.env.BH_EXISTING_TOOLS) {
 try { if (lstatSync('node_modules').isSymbolicLink()) unlinkSync('node_modules') } catch {}
 // Only unlink the disposable copy's stale dependency symlink; use installed owning-package tools.
 const bin = kind === 'runtime' ? resolve(repo,'examples/webpack/node_modules/webpack-cli/bin/cli.js') : kind === 'nuxt' ? resolve(repo,'packages/nuxt/node_modules/nuxt/bin/nuxt.mjs') : resolve(dirname(require.resolve('vite/package.json')),'bin/vite.js')
 const args = kind === 'runtime' ? ['--mode','production','--config','webpack.config.js'] : ['build']
 const build = spawnSync(process.execPath,[bin,...args],{stdio:'inherit'}); if (build.status) process.exit(build.status)
 if (kind === 'nuxt') { const script = fileURLToPath(new URL('./ssr-example.mjs', import.meta.url)); const result = spawnSync(process.execPath,[script,'nuxt'],{stdio:'inherit',env:{...process.env,BH_SKIP_BUILD:'1',BH_BROWSER_KIND:'nuxtstatic'}}); process.exit(result.status ?? 1) }
} else {
 const build = spawnSync('pnpm',['run','build'],{stdio:'inherit'}); if (build.status) process.exit(build.status)
}
const script = fileURLToPath(new URL('./browser-smoke.mjs',import.meta.url))
const result = spawnSync(process.execPath,[script,'dist',kind],{stdio:'inherit'})
process.exitCode = result.status ?? 1
