import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createCompiler } from '../../../../packages/compiler/dist/index.js'
import { createCompilerBindingSession } from '../../../../packages/compiler/src/session.ts'
import { compileRenderedStylesheet } from '../../../../packages/compiler/dist/stylesheet/index-public.js'
const wasm = { input: readFileSync(new URL('../../../../packages/binding-wasm-compiler/artifacts/mastercss_binding_wasm_compiler_bg.wasm', import.meta.url)) }
const baseManifest = { version: 1, utilities: [] }
const root = mkdtempSync(join(tmpdir(), 'master-qualified-matrix-'))
const entry = join(root, 'entry.css'), child = join(root, 'child.css')
const compilers = {}, sessions = {}, results = []
try {
  for (const binding of ['native', 'wasm']) {
    compilers[binding] = await createCompiler({ binding, ...(binding === 'wasm' ? { wasm } : {}) })
    sessions[binding] = await createCompilerBindingSession({ binding, ...(binding === 'wasm' ? { wasm } : {}) })
  }
  for (const qualifier of ['', ' layer', ' layer(cards)', ' supports(display:grid)', ' screen', ' layer(cards) supports(display:grid) screen']) {
    for (const compose of [false, true]) {
      const childSource = '@utilities{paint{padding:2rem}}\n' + (compose ? '.card{@compose paint;}' : '.card{padding:2rem}') + '\n.card{padding:3rem}'
      const source = `@import "./child.css"${qualifier};\n.after{margin:1px}`
      writeFileSync(child, childSource)
      const graph = { entry, files: { [entry]: source, [child]: childSource }, edges: [{ from: entry, specifier: './child.css', resolved: child }] }
      const run = async (path, fn) => {
        let record
        try {
          const value = await fn()
          record = { qualifier, compose, path, pass: true, ...value }
        } catch (error) { record = { qualifier, compose, path, pass: false, code: error.code, error: String(error), diagnostics: error.diagnostics } }
        results.push(record); console.log(JSON.stringify(record)); return record
      }
      const flattened = {}
      for (const binding of ['native', 'wasm']) {
        await run(`direct-${binding}`, () => {
          const resolved = sessions[binding].resolveCSSImportGraph(graph)
          flattened[binding] = resolved.source
          const result = compilers[binding].compileManifest(resolved.source, { from: entry, baseManifest, preserveNativeCSS: true })
          return { css: result.css, utilityNames: result.manifest.utilities.map(item => item.name) }
        })
        await run(`prepared-${binding}`, () => {
          const result = compilers[binding].compileStylesheets({ graph, urls: { [entry]: '/entry.css', [child]: '/child.css' }, baseManifest })
          assert(result.manifest.utilities.some(item => item.name === 'paint'), 'imported utility retained')
          assert(result.stylesheets.find(item => item.id === child).css.includes('.card'), 'child style retained')
          return { stylesheets: result.stylesheets, utilityNames: result.manifest.utilities.map(item => item.name) }
        })
      }
      assert.deepEqual(flattened.native, flattened.wasm)
      await run('rendered-node', async () => {
        const result = await compileRenderedStylesheet(entry, source, { baseManifest, projectDir: root, preserveNativeCSS: true })
        return { css: result.css, sourceMap: result.sourceMap }
      })
      console.log(JSON.stringify({ qualifier, compose, source, childSource, flattened: flattened.native }))
    }
  }
} finally {
  Object.values(compilers).forEach(compiler => compiler.dispose())
  Object.values(sessions).forEach(session => session.dispose())
  rmSync(root, { recursive: true, force: true })
}
const failures = results.filter(item => !item.pass).length
console.log(JSON.stringify({ observations: results.length, failures, byPath: Object.fromEntries([...new Set(results.map(item => item.path))].map(path => [path, { pass: results.filter(item => item.path === path && item.pass).length, fail: results.filter(item => item.path === path && !item.pass).length }])) }))
process.exitCode = failures ? 1 : 0
