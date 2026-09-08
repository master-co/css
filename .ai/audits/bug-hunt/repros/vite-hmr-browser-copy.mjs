import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

assert(process.cwd().includes('master-css-bh-isolated-'))
const engine = process.env.BH_BROWSER
assert(['firefox', 'webkit'].includes(engine))
let source = readFileSync('tests/dev-hmr.test.ts', 'utf8')
assert.equal(source.split('import { chromium, type Browser }').length, 2)
assert.equal(source.split('await chromium.launch()').length, 3)
source = source.replace('import { chromium, type Browser }', 'import { firefox, webkit, type Browser }')
source = source.replaceAll('await chromium.launch()', `await ${engine}.launch()`)
const target = 'tests/bug-hunt-browser-hmr.test.ts'
writeFileSync(target, source)
const result = spawnSync('pnpm', ['exec', 'vitest', 'run', target], {
  env: process.env,
  stdio: 'inherit',
  timeout: 180000
})
process.exitCode = result.status ?? 1
