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

test.each(['fade', 'flash', 'float', 'heart', 'jump', 'ping', 'pulse', 'rotate', 'shake', 'zoom'])('animate-%s emits one shorthand with native/Wasm parity', async (name) => {
  const native = await createEngine({ manifest, binding: 'native' })
  const wasm = await createEngine({ manifest, binding: 'wasm' })
  try {
    for (const engine of [native, wasm]) {
      engine.ensureClassRules([`animate-${name}`])
      const text = engine.snapshot().text
      expect(text).toContain(`.animate-${name}{animation:var(--animate-${name})}`)
      expect(text).not.toContain('animation-duration:var(--animate-')
      expect(engine.inspect(`animate-${name}`).rules[0].text).toBe(`.animate-${name}{animation:var(--animate-${name})}`)
      expect(engine.snapshot().resources.keyframes.map(frame => frame.name)).toEqual([name])
    }
    expect(wasm.snapshot()).toEqual(native.snapshot())
    for (const engine of [native, wasm]) {
      engine.deleteClassRules([`animate-${name}`])
      expect(engine.snapshot().text).toBe('')
    }
  } finally { native.dispose(); wasm.dispose() }
})

test('animation tokens use general ordering and direct longhands override the shorthand', async () => {
  const native = await createEngine({ manifest, binding: 'native' })
  const wasm = await createEngine({ manifest, binding: 'wasm' })
  const classes = ['animate-fade', 'animation-duration-fast', 'animation-duration:var(--duration-slow)', 'animation-iteration-count:1']
  try {
    native.ensureClassRules(classes)
    wasm.ensureClassRules(classes)
    expect(wasm.snapshot()).toEqual(native.snapshot())
    wasm.deleteClassRules(classes)
    wasm.ensureClassRules([...classes].reverse())
    expect(wasm.snapshot().text).toBe(native.snapshot().text)
    const text = native.snapshot().text
    expect(text.indexOf('animation-duration:var(--duration-fast)')).toBeLessThan(text.indexOf('animation:var(--animate-fade)'))
    expect(text.indexOf('animation:var(--animate-fade)')).toBeLessThan(text.indexOf('animation-duration:var(--duration-slow)'))
    for (const engine of [native, wasm]) {
      expect(engine.inspect('animate("fade")').matchStatus).not.toBe('matched')
      expect(engine.inspect('animation-fade').matchStatus).not.toBe('matched')
      expect(engine.inspect('animate:fade').matchStatus).not.toBe('matched')
      expect(engine.inspect('animation:fade|2s').rules[0].text).toContain('animation:fade 2s')
    }
  } finally { native.dispose(); wasm.dispose() }
})
