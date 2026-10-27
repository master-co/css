import { readFile } from 'node:fs/promises'
import { expect, it } from 'vitest'
import { compileRuntimeProgram } from '../src/node'
import { createMasterCSSEngineWasmProvider } from '../src/provider'

// Hosts other than Node, such as edge workers, load the module with every feature
// from the provider entry. Browsers execute programs with the JavaScript engine.
const wasm = new URL('../artifacts/mastercss_binding_wasm_engine_bg.wasm', import.meta.url)

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

interface Provider {
  info: { features: string[] }
  createEngineSession(source: Uint8Array | string, emittedGlobals?: object): Promise<{
    ensureClassRules(classNames: string[]): { mutations: readonly unknown[] }
    replaceEmittedGlobals(emittedGlobals: object): { mutations: readonly unknown[] }
    snapshot(): { text: string }
    inspect(className: string): { className: string }
    dispose(): void
  }>
}

it('loads the module with every feature from the provider entry', async () => {
  const provider = await createMasterCSSEngineWasmProvider({ input: new Uint8Array(await readFile(wasm)) }) as Provider
  expect(provider.info.features).toEqual(['engine', 'render'])

  const session = await provider.createEngineSession(await compileRuntimeProgram(manifest), { variables: { unused: 1 } })
  expect(session.ensureClassRules(['block']).mutations).toHaveLength(1)
  expect(session.snapshot().text).toBe('@layer utilities{.block{display:block}}')
  expect(session.inspect('block')).toMatchObject({ className: 'block' })
  expect(() => session.replaceEmittedGlobals({ variables: { unused: -1 } })).toThrowError(expect.objectContaining({
    code: 'INVALID_INPUT'
  }))
  session.dispose()

  // The binding layer normalizes the diagnostic the module throws.
  await expect(provider.createEngineSession(new Uint8Array([1, 2, 3]))).rejects.toMatch('"code":"INVALID_PROGRAM"')
})
