import { expect, test } from 'vitest'
import preset from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createToolingSession } from '../src/tooling-session'
import { suggestClasses } from '../src/lint'

test('native and Wasm suggestions agree and returned snapshots are immutable', async () => {
  const manifest = preset as MasterCSSManifest
  using native = await createToolingSession({ manifest, binding: 'native' })
  using wasm = await createToolingSession({ manifest, binding: 'wasm' })
  for (const declarations of [
    'display:flex; padding:16px; gap:1rem;',
    'padding:var(--spacing-md);color:var(--color-red);',
    'padding:1rem;padding-left:0;',
    'display:grid!important; width:calc(100% - 2rem);',
    'content:"a b";',
    '--custom:red;color:var(--custom);'
  ]) {
    const result = native.suggestClasses(declarations)
    expect(wasm.suggestClasses(declarations)).toEqual(result)
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.classes)).toBe(true)
  }
  expect((await suggestClasses('display:flex', { manifest })).classes).toEqual(['flex'])
  native.dispose()
  expect(() => native.suggestClasses('display:flex')).toThrow('disposed')
})
