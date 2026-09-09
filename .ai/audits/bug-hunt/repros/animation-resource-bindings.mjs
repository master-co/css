import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRenderBindingSession } from '../../../../packages/binding/src/engine-binding.ts'
import { compileRenderedStylesheet } from '../../../../packages/compiler/src/stylesheet/index.ts'

const expectations = []
for (const line of readFileSync(new URL('../evidence/0107-browser-syntax.log', import.meta.url), 'utf8').split('\n')) {
  if (!line.startsWith('{')) continue
  const value = JSON.parse(line)
  if (value.browser === 'chromium') expectations.push(value)
}
assert.equal(expectations.length, 22)
const manifest = { version: 1, animations: { fade: { to: { opacity: '1' } } }, utilities: [] }
const input = readFileSync(new URL('../../../../packages/binding-wasm-engine/artifacts/mastercss_binding_wasm_engine_bg.wasm', import.meta.url))
for (const test of expectations) {
  const results = {}
  for (const binding of ['native', 'wasm']) {
    const session = await createRenderBindingSession({ manifest }, { binding, wasm: { input } })
    try {
      session.ensureStylesheetResources(test.css)
      const text = session.snapshot().snapshot.text
      const globals = session.emittedGlobals()
      assert.equal(text.includes('@keyframes fade'), test.expected, `${binding}: ${test.id}`)
      assert.equal(globals.animations.fade ?? 0, test.expected || test.definitions.includes('fade') ? 1 : 0, `${binding} emitted globals: ${test.id}`)
      results[binding] = { text, globals }
    } finally { session.dispose() }
  }
  assert.deepEqual(results.native, results.wasm)
  let compiler = 'invalid syntax intentionally limited to raw renderer'
  if (test.id !== 'missing_definition_block') {
    const result = await compileRenderedStylesheet('/audit.css', test.css, { baseManifest: manifest })
    assert.equal(result.generatedCSS.includes('@keyframes fade'), test.expected, `compiler: ${test.id}`)
    compiler = 'PASS'
  }
  console.log(JSON.stringify({ id: test.id, native: 'PASS', wasm: 'PASS', compiler, text: results.native.text, globals: results.native.globals }))
}
