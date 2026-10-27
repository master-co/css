import { expect, test } from 'vitest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createCompilerBindingSession } from '../src/compiler-binding'
import { createEngineBindingSession } from '../src/engine-binding'

test('native and Wasm agree on entry replacement, theme-only isolation and removed sizes', async () => {
  const manifest: MasterCSSManifest = { version: 6, languageVersion: 16,
    variables: { 'font-size': [{ key: 'brand', values: [{ path: [':root'], value: 'red' }] }], 'font-family': [{ key: 'brand', values: [{ path: [':root'], value: 'red' }] }] },
    utilities: [
      ...['size', 'box'].map(name => ({ kind: 'function' as const, name, parameters: [{ name: '--value' }], body: [{ type: 'declaration' as const, property: 'width', value: [{ type: 'function' as const, name: 'var', value: [{ type: 'text' as const, value: '--value' }] }] }] })),
      { kind: 'function', name: 'size', parameters: [{ name: '--value' }], body: [{ type: 'declaration', property: 'height', value: [{ type: 'function', name: 'var', value: [{ type: 'text', value: '--value' }] }] }] }
    ]
  }
  using native = await createEngineBindingSession({ manifest }, { binding: 'native' })
  using wasm = await createEngineBindingSession({ manifest }, { binding: 'wasm' })
  for (const session of [native, wasm]) {
    expect(session.inspect('font-brand').matchStatus).toBe('unmatched')
    session.ensureClassRules(['size(20px)', 'box(30px)', 'max-size:40px'])
    expect(session.snapshot().text).toContain('.size\\(20px\\){height:20px}')
    expect(session.snapshot().text).toContain('.box\\(30px\\){width:30px}')
    expect(session.snapshot().text).toContain('{max-size:40px}')
  }
  expect(wasm.snapshot()).toEqual(native.snapshot())
})
