import { expect, test } from 'vitest'
import { createMasterCSSCompilerWasmProvider } from '../src/provider-node'

test('loads an explicit compiler artifact file URL in Node', async () => {
  const provider = await createMasterCSSCompilerWasmProvider({
    input: new URL(
      '../artifacts/mastercss_binding_wasm_compiler_bg.wasm',
      import.meta.url
    )
  }) as {
    createSession(): Promise<{
      inspectCSS(source: string): unknown
    }>
  }
  const compiler = await provider.createSession()

  expect(compiler.inspectCSS('@master entry;')).toMatchObject({
    hasMasterEntry: true
  })
})
