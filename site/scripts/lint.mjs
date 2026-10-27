import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const site = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const eslint = resolve(dirname(require.resolve('eslint/package.json')), 'bin/eslint.js')
const args = process.argv.slice(2)
let cacheArgs = []
if (!args.includes('--no-cache')) {
  try {
    const { lintCacheFingerprint } = await import('./lint-cache.mjs')
    const key = lintCacheFingerprint()
    const directory = resolve(site, '.cache/eslint')
    mkdirSync(directory, { recursive: true })
    cacheArgs = ['--cache', '--cache-strategy', 'content', '--cache-location', resolve(directory, `${key}.json`)]
  } catch (error) {
    // A failed discovery must never allow stale cached diagnostics. Let the
    // ordinary full lint report any errors using its own rules and scope.
    console.warn(`ESLint cache unavailable; running a full check: ${error.message}`)
  }
}
const result = spawnSync(process.execPath, [eslint, '.', ...cacheArgs, ...args], { cwd: site, stdio: 'inherit' })
if (result.error) throw result.error
if (result.signal) process.kill(process.pid, result.signal)
else process.exitCode = result.status ?? 1
