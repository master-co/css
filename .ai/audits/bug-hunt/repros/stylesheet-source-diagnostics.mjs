import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const { createCompiler } = await import(process.env.BH_DIAGNOSTICS_BUILT ? '../../../../packages/compiler/dist/index.js' : '../../../../packages/compiler/src/index.ts')
const records = []
const baseManifest = { version: 1, utilities: [] }
const sources = [
  '/*😀*/.image{background:url(a.png)}\r\n.x{@compose unknown-utility;}',
  '/*😀*/.image{background:url(a.png)} @utilities invalid {paint{color:red}}'
]
for (const binding of ['native', 'wasm']) {
  using compiler = await createCompiler({ binding, ...(binding === 'wasm' ? { wasm: { input: readFileSync(new URL('../../../../packages/binding-wasm-compiler/artifacts/mastercss_binding_wasm_compiler_bg.wasm', import.meta.url)) } } : {}) })
  for (const source of sources) {
    const operations = {
      original: () => compiler.compileManifest(source, { from: 'child.css', baseManifest }),
      graph: () => compiler.compileStylesheets({ graph: { entry: 'entry.css', files: {
        'entry.css': "@import './child.css';", 'child.css': source
      }, edges: [{ from: 'entry.css', specifier: './child.css', resolved: 'child.css' }] },
      urls: { 'entry.css': '/out/entry.css', 'child.css': '/out/child.css' },
      resourceURLs: { 'child.css': { 'a.png': '/output/a-much-longer-resource-name.png' } }, baseManifest })
    }
    for (const [operation, run] of Object.entries(operations)) {
      try { run(); console.log(JSON.stringify({ binding, operation, source, unexpectedSuccess: true })) }
      catch (error) { const record = { binding, operation, source, expectedStart: source.indexOf(source.includes('unknown-utility') ? 'unknown-utility' : '@utilities'), error: error.toJSON?.() ?? String(error), cause: String(error.cause) }; records.push(record); console.log(JSON.stringify(record)) }
    }
  }
}

assert.equal(records.length, 8)
let failures = 0
for (let i = 0; i < records.length; i += 2) {
  if (JSON.stringify(records[i].error) !== JSON.stringify(records[i + 1].error)) failures++
}
console.log(JSON.stringify({ comparisons: 4, failures, built: Boolean(process.env.BH_DIAGNOSTICS_BUILT), wasmInput: 'explicit artifact bytes; default file-URL loading remains unclassified' }))
assert.equal(failures, 0)
