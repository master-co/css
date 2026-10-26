import { readFile } from 'node:fs/promises'
import { expect, it } from 'vitest'
import { createMasterCSSEngineWasmProvider } from '../src/provider'

// `cargo xtask build-wasm runtime` builds the browser artifact without the binding's
// `full` feature into `artifacts/runtime/` and stages the same Wasm for the CDN bundle.
const runtimeWasm = new URL('../artifacts/runtime/mastercss_binding_wasm_engine_bg.wasm', import.meta.url)
const stagedRuntimeWasm = new URL('../../runtime/artifacts/mastercss_binding_wasm_engine_bg.wasm', import.meta.url)

const manifest = JSON.stringify({
  version: 6,
  languageVersion: 16,
  utilities: [{
    kind: 'static',
    name: 'block',
    body: [{ type: 'declaration', property: 'display', value: [{ type: 'text', value: 'block' }] }]
  }]
})

interface RuntimeProvider {
  info: { features: string[] }
  createEngineSession(manifestJSON: string): Promise<{
    ensureClassRules(classNames: string[]): { mutations: readonly unknown[] }
    snapshot(): { text: string }
    inspect(className: string): unknown
    dispose(): void
  }>
  createRenderSession(manifestJSON: string): Promise<unknown>
}

it('stages the browser runtime Wasm unchanged for the CDN bundle', async () => {
  expect(Buffer.compare(await readFile(runtimeWasm), await readFile(stagedRuntimeWasm))).toBe(0)
})

it('loads the runtime-only artifact from the browser provider', async () => {
  const provider = await createMasterCSSEngineWasmProvider({
    input: await readFile(runtimeWasm)
  }) as RuntimeProvider
  expect(provider.info.features).toEqual(['engine'])

  const session = await provider.createEngineSession(manifest)
  expect(session.ensureClassRules(['block']).mutations).toHaveLength(1)
  expect(session.snapshot().text).toBe('@layer utilities{.block{display:block}}')
  expect(() => session.inspect('block')).toThrowError(expect.objectContaining({
    code: 'WASM_FEATURE_UNAVAILABLE',
    domain: 'binding'
  }))
  session.dispose()

  await expect(provider.createRenderSession(manifest)).rejects.toMatchObject({
    code: 'WASM_FEATURE_UNAVAILABLE',
    domain: 'binding'
  })
})
