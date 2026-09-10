import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createEngine } from '../../../../packages/css/dist/index.js'
const require = createRequire(new URL('../../../../packages/binding/package.json', import.meta.url))
console.log(JSON.stringify({ provider: require.resolve('@master/css-binding-wasm-engine'), cwd: process.cwd() }))
const manifest = {
  version: 1,
  utilities: [{ id: '.paint', name: 'paint', type: -2, order: 0, layer: 'utilities',
    emit: { type: 'static', rules: [{ declarations: { padding: '2rem' } }] },
    matchers: [{ type: 'static', name: 'paint' }] }]
}
for (let iteration = 0; iteration < 2; iteration++) {
  const engine = await createEngine({ manifest, binding: 'wasm' })
  try {
    assert.equal(engine.binding, 'wasm')
    engine.ensureClassRules(['paint'])
    const snapshot = engine.snapshot()
    assert.match(snapshot.text, /\.paint\{padding:2rem\}/)
    console.log(JSON.stringify({ iteration, binding: engine.binding, css: snapshot.text }))
  } finally { engine.dispose() }
}
