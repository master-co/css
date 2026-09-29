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

test.each(['fade', 'flash', 'float', 'heart', 'jump', 'ping', 'pulse', 'rotate', 'shake', 'zoom'])('animate-%s emits independent settings with native/Wasm parity', async (name) => {
  const native = await createEngine({ manifest, binding: 'native' })
  const wasm = await createEngine({ manifest, binding: 'wasm' })
  try {
    for (const engine of [native, wasm]) {
      engine.ensureClassRules([`animate-${name}`])
      const text = engine.snapshot().text
      expect(text).toContain(`animation-name:var(--animate-${name})`)
      expect(text).toContain(`animation-duration:var(--animate-${name}--duration, 1s)`)
      expect(text).toContain(`animation-timing-function:var(--animate-${name}--timing-function, ease)`)
      expect(text).toContain(`animation-iteration-count:var(--animate-${name}--iteration-count, infinite)`)
      expect(text).not.toContain('{animation:')
      expect(engine.snapshot().resources.keyframes.map(frame => frame.name)).toEqual([name])
    }
    expect(wasm.snapshot()).toEqual(native.snapshot())
    for (const engine of [native, wasm]) {
      engine.deleteClassRules([`animate-${name}`])
      expect(engine.snapshot().text).toBe('')
    }
  } finally { native.dispose(); wasm.dispose() }
})

test('animation companion tokens override timing without creating additional recipes', async () => {
  const custom: MasterCSSManifest = {
    ...manifest,
    theme: [...manifest.theme!, { type: 'rule', prelude: ':root,:host', children: [
      { type: 'declaration', name: 'animate-fade--duration', value: '2s' },
      { type: 'declaration', name: 'animate-fade--timing-function', value: 'linear' },
      { type: 'declaration', name: 'animate-fade--iteration-count', value: '3' },
      { type: 'declaration', name: 'animate-orphan--duration', value: '4s' }
    ] }],
    variables: {
      ...manifest.variables,
      animate: [...manifest.variables!.animate,
        ...[
          ['fade--duration', '2s'], ['fade--timing-function', 'linear'],
          ['fade--iteration-count', '3'], ['orphan--duration', '4s']
        ].map(([key, value]) => ({ key, values: [{ path: [':root,:host'], value }], dependencies: [] }))
      ]
    }
  }
  const native = await createEngine({ manifest: custom, binding: 'native' })
  const wasm = await createEngine({ manifest: custom, binding: 'wasm' })
  try {
    for (const engine of [native, wasm]) {
      expect(engine.inspect('animate-orphan').matchStatus).not.toBe('matched')
      engine.ensureClassRules(['animate-fade', 'animation-duration:5s'])
      const text = engine.snapshot().text
      expect(text).toContain('--animate-fade--duration:2s')
      expect(text).toContain('--animate-fade--timing-function:linear')
      expect(text).toContain('--animate-fade--iteration-count:3')
      expect(text.indexOf('animation-duration:var(')).toBeLessThan(text.indexOf('animation-duration:5s'))
    }
    expect(wasm.snapshot()).toEqual(native.snapshot())
  } finally { native.dispose(); wasm.dispose() }
})
