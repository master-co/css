import { readFile } from 'node:fs/promises'
import { expect, it } from 'vitest'
import { compileRuntimeProgram } from '../src/node'
import { createMasterCSSEngineWasmProvider } from '../src/provider'

// `cargo xtask build-wasm runtime` builds the browser artifact without the binding's
// `full` feature into `artifacts/runtime/` and stages the same Wasm for the CDN bundle.
const runtimeWasm = new URL('../artifacts/runtime/mastercss_binding_wasm_engine_bg.wasm', import.meta.url)
const stagedRuntimeWasm = new URL('../../runtime/artifacts/mastercss_binding_wasm_engine_bg.wasm', import.meta.url)

const manifest = JSON.stringify({
  version: 6,
  languageVersion: 16,
  keyframes: [{ id: 'fade', name: 'fade', text: '@keyframes fade{to{opacity:0}}' }],
  utilities: [{
    kind: 'static',
    name: 'block',
    body: [{ type: 'declaration', property: 'display', value: [{ type: 'text', value: 'block' }] }]
  }]
})

interface RuntimeProvider {
  info: { features: string[] }
  createEngineSession(source: Uint8Array | string, emittedGlobals?: object): Promise<{
    ensureClassRules(classNames: string[]): { mutations: readonly unknown[] }
    replaceEmittedGlobals(emittedGlobals: object): { mutations: readonly unknown[] }
    refresh(source: Uint8Array | string, emittedGlobals?: object): { mutations: readonly unknown[] }
    keyframeDefinitions(): readonly { id: string }[]
    snapshot(): { text: string }
    inspect(className: string): unknown
    dispose(): void
  }>
  createRenderSession(manifestJSON: string): Promise<unknown>
  compileRuntimeProgram(manifestJSON: string): Promise<Uint8Array>
}

it('stages the browser runtime Wasm unchanged for the CDN bundle', async () => {
  expect(Buffer.compare(await readFile(runtimeWasm), await readFile(stagedRuntimeWasm))).toBe(0)
})

it('loads the runtime-only artifact from the browser provider', async () => {
  const provider = await createMasterCSSEngineWasmProvider({
    input: await readFile(runtimeWasm)
  }) as RuntimeProvider
  expect(provider.info.features).toEqual(['engine'])

  const program = await compileRuntimeProgram(manifest)
  const session = await provider.createEngineSession(program, { variables: { unused: 1 } })
  expect(session.ensureClassRules(['block']).mutations).toHaveLength(1)
  expect(session.snapshot().text).toBe('@layer utilities{.block{display:block}}')
  expect(session.keyframeDefinitions().map(definition => definition.id)).toEqual(['fade'])
  expect(session.replaceEmittedGlobals({ keyframes: { fade: 2 } }).mutations).toHaveLength(2)
  expect(session.refresh(program).mutations).toHaveLength(2)
  expect(() => session.inspect('block')).toThrowError(expect.objectContaining({
    code: 'WASM_FEATURE_UNAVAILABLE',
    domain: 'binding'
  }))
  expect(() => session.replaceEmittedGlobals({ variables: { unused: -1 } })).toThrowError(expect.objectContaining({
    code: 'INVALID_INPUT'
  }))
  expect(() => session.replaceEmittedGlobals({ animations: {} })).toThrowError(expect.objectContaining({
    code: 'INVALID_INPUT'
  }))
  expect(() => session.refresh(manifest)).toThrowError(expect.objectContaining({
    code: 'WASM_FEATURE_UNAVAILABLE'
  }))
  session.dispose()

  await expect(provider.createEngineSession(manifest)).rejects.toMatchObject({
    code: 'WASM_FEATURE_UNAVAILABLE',
    domain: 'binding'
  })
  await expect(provider.compileRuntimeProgram(manifest)).rejects.toMatchObject({
    code: 'WASM_FEATURE_UNAVAILABLE',
    domain: 'binding'
  })
  // The binding layer normalizes the diagnostic the module throws.
  await expect(provider.createEngineSession(new Uint8Array([1, 2, 3]))).rejects.toMatch('"code":"INVALID_PROGRAM"')

  await expect(provider.createRenderSession(manifest)).rejects.toMatchObject({
    code: 'WASM_FEATURE_UNAVAILABLE',
    domain: 'binding'
  })
})
