import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createCompiler } from '../../../../packages/compiler/dist/index.js'
import { compileRenderedStylesheet } from '../../../../packages/compiler/dist/stylesheet/index-public.js'
const baseManifest = { version: 1, utilities: [] }
const root = mkdtempSync(join(tmpdir(), 'master-qualified-managed-'))
const entry = join(root, 'entry.css'), child = join(root, 'child.css')
const source = '@import "./child.css" layer;\n.after{margin:1px}'
let failures = 0
const compilers = { native: await createCompiler({ binding: 'native' }), wasm: await createCompiler({ binding: 'wasm' }) }
try {
  for (const compose of [false, true]) {
    const childSource = '@utilities{paint{padding:2rem}}\n' + (compose ? '.card{@compose paint;}' : '.card{padding:2rem}') + '\n.card{padding:3rem}'
    writeFileSync(child, childSource)
    try {
      const result = await compileRenderedStylesheet(entry, source, { baseManifest, projectDir: root, preserveNativeCSS: true })
      console.log(JSON.stringify({ compose, path: 'direct', pass: true, css: result.css }))
    } catch (error) {
      failures++
      console.log(JSON.stringify({ compose, path: 'direct', pass: false, error: String(error), code: error.code, diagnostics: error.diagnostics, source, childSource }))
    }
    for (const [binding, compiler] of Object.entries(compilers)) {
      const result = compiler.compileStylesheets({ graph: { entry, files: { [entry]: source, [child]: childSource }, edges: [{ from: entry, specifier: './child.css', resolved: child }] }, urls: { [entry]: '/entry.css', [child]: '/child.css' }, baseManifest })
      console.log(JSON.stringify({ compose, path: binding, pass: true, stylesheets: result.stylesheets }))
    }
  }
} finally { Object.values(compilers).forEach(compiler => compiler.dispose()); rmSync(root, { recursive: true, force: true }) }
console.log(JSON.stringify({ observations: 6, failures }))
process.exitCode = failures ? 1 : 0
