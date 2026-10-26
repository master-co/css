import { expect, it } from 'vitest'
import { createEngine } from '../src'

it('@master/css exposes only the Rust-backed async engine facade', async () => {
  const engine = await createEngine({ manifest: {
  "version": 6 as const,
  "languageVersion": 16 as const
} })
  expect(engine.binding).toBe('native')
  expect(engine.snapshot().text).toBe('')
  engine.dispose()
})

it('@master/css re-exports the manifest-driven engine facade', async () => {
  const engine = await createEngine({ manifest: {
  "version": 6 as const,
  "languageVersion": 16 as const
} })
  expect(engine.binding).toBe('native')
  expect(engine.snapshot().text).toBe('')
  engine.dispose()
})

it('executes compiled runtime programs with native and Wasm bindings', async () => {
  const { compileRuntimeProgram, compileRuntimeProgramSync } = await import('../src/node')
  const manifest = {
    version: 6 as const,
    languageVersion: 16 as const,
    keyframes: [{ id: 'fade', name: 'fade', text: '@keyframes fade{to{opacity:0}}' }],
    utilities: [{
      kind: 'static' as const,
      name: 'block',
      body: [{ type: 'declaration' as const, property: 'display', value: [{ type: 'text' as const, value: 'block' }] }]
    }]
  }
  const program = await compileRuntimeProgram(manifest)
  expect(program).toBeInstanceOf(Uint8Array)
  expect(compileRuntimeProgramSync(manifest)).toEqual(program)
  expect(await compileRuntimeProgram(manifest, { binding: 'wasm' })).toEqual(program)

  for (const binding of ['native', 'wasm'] as const) {
    const engine = await createEngine({ program, binding })
    const fromManifest = await createEngine({ manifest, binding })
    expect(engine.ensureClassRules(['block'])).toEqual(fromManifest.ensureClassRules(['block']))
    expect(engine.keyframeDefinitions()).toEqual(fromManifest.keyframeDefinitions())
    expect(engine.keyframeDefinitions().map(definition => definition.id)).toEqual(['fade'])
    expect(engine.refresh(program, { variables: {} })).toEqual(fromManifest.refresh(manifest, { variables: {} }))
    expect(engine.snapshot()).toEqual(fromManifest.snapshot())
    expect(() => engine.refresh(new Uint8Array([1]))).toThrowError(expect.objectContaining({
      code: 'INVALID_PROGRAM'
    }))
    engine.dispose()
    fromManifest.dispose()
  }
})
