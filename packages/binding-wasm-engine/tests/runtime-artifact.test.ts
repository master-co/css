import { readFile } from 'node:fs/promises'
import { expect, it } from 'vitest'
import { createWasmEngineSession, createWasmRenderSession, loadWasmEngine } from '../src'

// `cargo xtask build-wasm runtime` stages the browser runtime's engine module,
// built without the binding's `full` feature, beside the runtime package.
const runtimeArtifacts = new URL('../../runtime/artifacts/', import.meta.url)

async function loadRuntimeModule() {
  const module = await import(new URL('mastercss_binding_wasm_engine.js', runtimeArtifacts).href) as object
  const input = await readFile(new URL('mastercss_binding_wasm_engine_bg.wasm', runtimeArtifacts))
  return { module, input }
}

const manifest = JSON.stringify({
  version: 6,
  languageVersion: 16,
  utilities: [{
    kind: 'static',
    name: 'block',
    body: [{ type: 'declaration', property: 'display', value: [{ type: 'text', value: 'block' }] }]
  }]
})

it('executes engine sessions with the runtime-only artifact', async () => {
  const loadOptions = await loadRuntimeModule()
  const module = await loadWasmEngine(loadOptions) as { bindingInfo(): { features: string[] } }
  expect(module.bindingInfo().features).toEqual(['engine'])

  const session = await createWasmEngineSession(manifest, {}, loadOptions)
  expect(session.ensureClassRules(['block']).mutations).toHaveLength(1)
  expect(session.snapshot().text).toBe('@layer utilities{.block{display:block}}')
  expect(() => session.inspect('block')).toThrowError(expect.objectContaining({
    code: 'WASM_FEATURE_UNAVAILABLE',
    domain: 'binding'
  }))
  session.dispose()

  await expect(createWasmRenderSession(manifest, {}, loadOptions)).rejects.toMatchObject({
    code: 'WASM_FEATURE_UNAVAILABLE',
    domain: 'binding'
  })
})
