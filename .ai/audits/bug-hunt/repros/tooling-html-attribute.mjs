import assert from 'node:assert/strict'
import { createToolingSession } from '../../../../packages/tooling/dist/index.js'
import manifest from '../../../../packages/preset/src/default-manifest.json' with { type: 'json' }

for (const binding of ['native', 'wasm']) {
  const session = await createToolingSession({ manifest, binding })
  try {
    assert.deepEqual(session.extractSource({ files: [] }), { version: 1, files: [] })
    const result = session.decodeHTMLAttribute('&quot;é&amp;&#x1f600;\r\n&quot;')
    assert.equal(result.value, '"é&😀\n"')
    assert.deepEqual(result.spans.map(span => [span.range.start, span.range.end, span.sourceRange.start, span.sourceRange.end]),
      [[0, 1, 0, 6], [1, 2, 6, 7], [2, 3, 7, 12], [3, 5, 12, 21], [5, 6, 21, 23], [6, 7, 23, 29]])
    assert(Object.isFrozen(result.spans[0].sourceRange))
    console.log(JSON.stringify({ builtTooling: true, binding: session.binding, value: result.value, spans: result.spans, result: 'PASS' }))
  } finally { session.dispose() }
  assert.throws(() => session.decodeHTMLAttribute('x'), /disposed/)
}
