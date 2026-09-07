import { expect, test } from 'vitest'
import { createMasterCSSEngineWasmProvider } from '../src/provider-node'

test('loads an explicit engine artifact file URL in Node', async () => {
  const provider = await createMasterCSSEngineWasmProvider({
    input: new URL(
      '../artifacts/mastercss_binding_wasm_engine_bg.wasm',
      import.meta.url
    )
  }) as {
    createEngineSession(manifestJSON: string): Promise<{
      inspect(className: string): unknown
      dispose(): void
    }>
  }
  const engine = await provider.createEngineSession(JSON.stringify({
    version: 1,
    utilities: []
  }))

  expect(engine.inspect('block')).toMatchObject({
    className: 'block'
  })
  engine.dispose()
})
