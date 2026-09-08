import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

assert(process.cwd().includes('master-css-bh-isolated-'))
const repo = fileURLToPath(new URL('../../../../', import.meta.url))
const cwd = resolve('.results/audit-startup-bin-control')
mkdirSync(cwd, { recursive: true })
writeFileSync(resolve(cwd, 'index.html'), '<p class="fg:red">control</p>')
writeFileSync(resolve(cwd, 'input.css'), '@import "master.css";\n@source "./index.html";\n')
const bin = resolve(repo, 'packages/cli/dist/bin/index.js')
const core = resolve(repo, 'packages/cli/dist/core.js')
const rows = []
function run(label, args) {
  const result = spawnSync(process.execPath, args, { cwd, encoding: 'utf8', timeout: 30000 })
  rows.push({ label, status: result.status, stdout: result.stdout, stderr: result.stderr, error: result.error?.message })
  return result
}
const generate = run('published bin with valid generate args', [bin, 'generate', 'index.html', '-o', 'output.css', '-v', '0'])
assert.equal(generate.status, 0)
const css = readFileSync(resolve(cwd, 'output.css'), 'utf8')
assert(css.includes('.fg\\:red') && css.includes('color:'))
for (const [label, file] of [['bin passive import', bin], ['core passive import', core]]) {
  const probe = resolve(cwd, `${label.replaceAll(' ', '-')}.mjs`)
  writeFileSync(probe, `await import(${JSON.stringify(pathToFileURL(file).href)}); console.log("AUDIT_IMPORT_RETURNED")\n`)
  const result = run(label, [probe])
  if (file === bin) {
    assert.equal(result.status, 1)
    assert.match(result.stderr, /Usage: master-css/)
    assert(!result.stdout.includes('AUDIT_IMPORT_RETURNED'))
  } else {
    assert.equal(result.status, 0)
    assert(result.stdout.includes('AUDIT_IMPORT_RETURNED'))
  }
}
writeFileSync(fileURLToPath(new URL('../evidence/0066-bin-controls.json', import.meta.url)), JSON.stringify({ rows, cssMarkerPassed: true, cssBytes: Buffer.byteLength(css) }, null, 2))
console.log(JSON.stringify({ controls: 3, passed: true, results: rows.map(({label, status}) => ({label,status})) }))
