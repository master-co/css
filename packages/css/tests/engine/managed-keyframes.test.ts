import { expect, test } from 'vitest'
import defaultManifest from '@master/css-preset/default-manifest.json'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import createEngine from '../../src/engine/create-engine'

const manifest = defaultManifest as unknown as MasterCSSManifest

test('native and Wasm retain identical managed resources through usage and HMR', async () => {
  const native = await createEngine({ manifest, binding: 'native' })
  const wasm = await createEngine({ manifest, binding: 'wasm' })
  const engines = [native, wasm]
  const equal = () => expect(wasm.snapshot()).toEqual(native.snapshot())
  try {
    expect(native.snapshot().resources.keyframes).toEqual([])
    expect(wasm.ensureClassRules(['animate-fade', 'animation-name:rotate'])).toEqual(native.ensureClassRules(['animate-fade', 'animation-name:rotate']))
    equal()
    expect(native.snapshot().resources.keyframes.map(frame => frame.name)).toEqual(['fade', 'rotate'])
    for (const engine of engines) {
      engine.ensureClassRules(['animation-name:var(--external)'])
      expect(engine.snapshot().resources.keyframes).toHaveLength(10)
      expect(engine.inspect('animation-name:var(--external)').diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'DYNAMIC_ANIMATION_NAMES', severity: 'info' })]))
      engine.replaceEmittedGlobals({ keyframes: { fade: 1 } })
      expect(engine.snapshot().resources.keyframes).toHaveLength(9)
      engine.deleteClassRules(['animation-name:var(--external)', 'animate-fade'])
      expect(engine.snapshot().resources.keyframes.map(frame => frame.name)).toEqual(['rotate'])
      engine.refresh({ ...manifest, keyframes: [{ name: 'rotate', text: '@keyframes rotate{to{opacity:.5}}' }] })
      engine.replaceEmittedGlobals({})
    }
    equal()
    expect(native.snapshot().text).toContain('@keyframes rotate{to{opacity:.5}}')
    expect(wasm.deleteClassRules(['animation-name:rotate'])).toEqual(native.deleteClassRules(['animation-name:rotate']))
    equal()
    expect(native.snapshot().text).toBe('')
  } finally { engines.forEach(engine => engine.dispose()) }
})
