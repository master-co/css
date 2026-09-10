import assert from 'node:assert/strict'
import { createCompiler } from '../../../../packages/compiler/dist/index.js'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
const require = createRequire(new URL('../../../../packages/binding/package.json', import.meta.url))
console.log(JSON.stringify({ provider: require.resolve('@master/css-binding-wasm-compiler'), conditions: process.execArgv, nodeOptions: process.env.NODE_OPTIONS ?? '' }))
const artifact = new URL('../../../../packages/binding-wasm-compiler/artifacts/mastercss_binding_wasm_compiler_bg.wasm', import.meta.url)
const input = process.env.BH_WASM_INPUT
const wasm = input === 'file-url' ? { input: artifact } : input === 'file-string' ? { input: artifact.href } : input === 'bytes' ? { input: readFileSync(artifact) } : undefined
const compiler = await createCompiler({ binding: 'wasm', ...(wasm ? { wasm } : {}) })
try {
  assert.equal(compiler.binding, 'wasm')
  const result = compiler.compileManifest('@utilities{paint{padding:2rem}}.target{@compose paint;}', { baseManifest: { version: 1, utilities: [] } })
  console.log(JSON.stringify({ binding: compiler.binding, result }))
  assert.match(result.css, /\.target\{padding:2rem\}/)
  assert.equal(result.diagnostics.length, 0)
} finally { compiler.dispose() }
