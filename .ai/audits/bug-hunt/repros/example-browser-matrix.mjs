import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

assert(process.cwd().includes('master-css-bh-isolated-'))
const kind = process.argv[2] || 'runtime'
const built = spawnSync('pnpm', ['run', 'build'], { env: process.env, stdio: 'inherit', timeout: 120000 })
assert.equal(built.status, 0, 'isolated original example build')
const smoke = fileURLToPath(new URL('./browser-smoke.mjs', import.meta.url))
const results = []
for (const browser of ['firefox', 'webkit']) {
  const result = spawnSync(process.execPath, [smoke, 'dist', kind], {
    env: { ...process.env, BH_BROWSER: browser }, stdio: 'inherit', timeout: 90000
  })
  results.push({ browser, exit: result.status, error: result.error?.message })
}
console.log(JSON.stringify({ kind, results }))
assert(results.every(result => result.exit === 0), 'both browser controls pass')
