import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

assert(process.cwd().includes('master-css-bh-isolated-'))
const result = spawnSync('pnpm', ['exec', 'vitest', 'bench', 'docs-page-css-size', '--run'], {
  env: { ...process.env, UPDATE_BENCHMARK_SNAPSHOT: 'false' }, stdio: 'inherit', timeout: 90000
})
const path = '.results/docs-page-css-size/snapshot.json'
if (existsSync(path)) {
  const snapshot = JSON.parse(readFileSync(path, 'utf8'))
  writeFileSync(fileURLToPath(new URL('../evidence/0071-docs-css-snapshot.json', import.meta.url)), JSON.stringify(snapshot, null, 2))
  console.log(JSON.stringify({ pages: snapshot.pages.length, assets: snapshot.pages.reduce((n, page) => n + page.assets.length, 0) }))
}
console.log(JSON.stringify({ suiteStatus: result.status, error: result.error?.message }))
process.exitCode = result.status ?? 1
