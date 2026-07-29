import { expect, test } from 'vitest'
import { createMasterCSSToolingWasmProvider } from '../src/provider-node'

test('loads an explicit tooling artifact file URL in Node', async () => {
  const provider = await createMasterCSSToolingWasmProvider({
    input: new URL(
      '../artifacts/mastercss_binding_wasm_tooling_bg.wasm',
      import.meta.url
    )
  }) as {
    extractOxcClasses(source: string, content: string): readonly string[]
  }

  expect(provider.extractOxcClasses(
    'component.tsx',
    'const classes = "block mx:auto"'
  )).toEqual(['block', 'mx:auto'])
})
