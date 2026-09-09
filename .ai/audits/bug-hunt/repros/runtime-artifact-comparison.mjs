import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, symlinkSync, rmSync, openSync, closeSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = fileURLToPath(new URL('../../../../', import.meta.url))
const prefix = process.env.OUTPUT_PREFIX
assert(prefix?.startsWith('/tmp/'), 'Benchmark history must stay outside the repository')
const previous = process.env.OLD_WASM
assert(previous, 'Provide the preserved baseline Wasm')
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex')
const baseline = JSON.parse(readFileSync(join(root, '.ai/audits/bug-hunt/evidence/0108-payload-before.json'), 'utf8'))
assert.equal(sha(previous), baseline['packages/binding-wasm-engine/artifacts/mastercss_binding_wasm_engine_bg.wasm'].sha256)
const scratch = mkdtempSync(join(tmpdir(), 'mastercss-runtime-artifact-control-'))
const metadata = { source: 'unmodified packages/runtime/scripts/benchmark-runtime.js', runs: [] }
try {
  for (const variant of ['old', 'new']) {
    const directory = join(scratch, variant)
    for (const child of ['scripts', 'dist', 'artifacts']) mkdirSync(join(directory, child), { recursive: true })
    writeFileSync(join(directory, 'package.json'), '{"type":"module"}\n')
    symlinkSync(join(root, 'packages/runtime/node_modules'), join(directory, 'node_modules'), 'dir')
    copyFileSync(join(root, 'packages/runtime/scripts/benchmark-runtime.js'), join(directory, 'scripts/benchmark-runtime.js'))
    for (const file of ['global.min.js', 'default-manifest.json']) {
      const source = join(root, 'packages/runtime/dist', file)
      assert.equal(sha(source), baseline[`packages/runtime/dist/${file}`].sha256)
      copyFileSync(source, join(directory, 'dist', file))
    }
    copyFileSync(variant === 'old' ? previous : join(root, 'packages/runtime/artifacts/mastercss_binding_wasm_engine_bg.wasm'), join(directory, 'artifacts/mastercss_binding_wasm_engine_bg.wasm'))
  }
  for (const [index, variant] of ['old', 'new', 'new', 'old'].entries()) {
    const directory = join(scratch, variant)
    const output = `${prefix}-${index}-${variant}.json`
    const log = `${prefix}-${index}-${variant}.log`
    const descriptor = openSync(log, 'w')
    const result = spawnSync(process.execPath, [join(directory, 'scripts/benchmark-runtime.js'), '--output', output], { cwd: directory, stdio: ['ignore', descriptor, descriptor] })
    closeSync(descriptor)
    assert.equal(result.status, 0, `${variant} control failed; see ${log}`)
    const run = { index, variant, output, log, scriptSha256: sha(join(directory, 'scripts/benchmark-runtime.js')), wasmSha256: sha(join(directory, 'artifacts/mastercss_binding_wasm_engine_bg.wasm')) }
    metadata.runs.push(run)
    console.log(JSON.stringify(run))
  }
  writeFileSync(`${prefix}-metadata.json`, JSON.stringify(metadata, null, 2) + '\n')
} finally { rmSync(scratch, { recursive: true, force: true }) }
