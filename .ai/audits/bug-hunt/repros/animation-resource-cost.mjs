import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { platform, arch, cpus } from 'node:os'
import { createRenderBindingSession } from '../../../../packages/binding/src/engine-binding.ts'

assert(process.env.OUTPUT?.startsWith('/tmp/'), 'Keep benchmark history outside the repository')
const wasmPath = process.env.WASM_PATH || new URL('../../../../packages/binding-wasm-engine/artifacts/mastercss_binding_wasm_engine_bg.wasm', import.meta.url)
const input = readFileSync(wasmPath)
const manifest = { version: 1, utilities: [], animations: { fade: { to: { opacity: '1' } } } }
const results = []
for (const count of [1000, 10000]) {
  for (const workload of ['ordinary-styles', 'animation-styles']) {
    const css = Array.from({ length: count }, (_, index) => `.x${index}{color:red;${workload === 'animation-styles' ? 'animation:fade 1s;' : 'padding:1px;'}}`).join('')
    const samples = []
    for (let round = -2; round < 9; round++) {
      const session = await createRenderBindingSession({ manifest }, { binding: 'wasm', wasm: { input } })
      try {
        const start = performance.now()
        session.ensureStylesheetResources(css)
        const elapsed = performance.now() - start
        const text = session.snapshot().snapshot.text
        assert.equal(text, workload === 'animation-styles' ? '@keyframes fade{to{opacity:1}}' : '')
        if (round >= 0) samples.push(elapsed)
      } finally { session.dispose() }
    }
    const sorted = [...samples].sort((a, b) => a - b)
    results.push({ workload, count, inputBytes: Buffer.byteLength(css), samples, median: sorted[4], min: sorted[0], max: sorted.at(-1) })
  }
}
const result = {
  tool: 'animation-resource-cost', node: process.version, platform: platform(), arch: arch(), cpu: cpus()[0]?.model,
  wasmSha256: createHash('sha256').update(input).digest('hex'),
  warmup: 2, rounds: 9, unit: 'ms', boundary: 'Wasm ensureStylesheetResources call including FFI; session creation and snapshot outside timing', results
}
writeFileSync(process.env.OUTPUT, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result))
