import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { cpus, platform, arch } from 'node:os'
import { createRenderBindingSession } from '../../../../packages/binding/src/engine-binding.ts'
assert(process.env.OUTPUT?.startsWith('/tmp/'), 'Keep benchmark history outside the repository')
const input = readFileSync(process.env.WASM_PATH || new URL('../../../../packages/binding-wasm-engine/artifacts/mastercss_binding_wasm_engine_bg.wasm', import.meta.url))
const baseline = process.env.BASELINE === '1'
if (baseline) assert.equal(createHash('sha256').update(input).digest('hex'), '9ab7eaefa665c90ffd2cadbcbda351d15697019b732f144d19cf5641ad7677ad')
const results = []
for (const workload of ['independent', 'shared-base', 'chain']) {
  const count = 1000
  const variables = Array.from({ length: count }, (_, index) => ({ key: `v${index}`, value: 'red', static: workload !== 'chain' || index === 0 }))
  if (workload === 'shared-base') {
    for (const variable of variables) Object.assign(variable, { value: 'var(--color-base)', dependencies: ['color-base'] })
    variables.push({ key: 'base', value: 'red', static: false })
  }
  if (workload === 'chain') for (let index = 0; index < count - 1; index++) Object.assign(variables[index], { value: `var(--color-v${index + 1})`, dependencies: [`color-v${index + 1}`] })
  const manifest = { version: 1, utilities: [], variables: { color: variables } }
  const samples = []
  const expectedCount = baseline ? (workload === 'chain' ? 1 : count) : variables.length
  for (let round = -2; round < 9; round++) {
    const start = performance.now()
    const session = await createRenderBindingSession({ manifest }, { binding: 'wasm', wasm: { input } })
    const elapsed = performance.now() - start
    try {
      const actualCount = Object.keys(session.emittedGlobals().variables).length
      assert.equal(actualCount, expectedCount)
      if (round >= 0) samples.push(elapsed)
    } finally { session.dispose() }
  }
  const sorted = [...samples].sort((a, b) => a - b)
  results.push({ workload, count, expectedCount, baselineMissingDependencies: baseline && workload !== 'independent', median: sorted[4], samples })
}
const result = { node: process.version, platform: platform(), arch: arch(), cpu: cpus()[0]?.model, wasmSha256: createHash('sha256').update(input).digest('hex'), baseline, warmup: 2, rounds: 9, unit: 'ms', boundary: 'Wasm render session creation including manifest compilation and static initialization; warm binding module, snapshot and disposal outside timing', results }
writeFileSync(process.env.OUTPUT, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result))
