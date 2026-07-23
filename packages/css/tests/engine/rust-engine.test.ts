import { beforeAll, describe, expect, it } from 'vitest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import defaultManifest from '@master/css-preset/default-manifest.json'
import createEngine from '../../src/engine/create-engine'
import { createEngineSync } from '../../src/node'
import { MasterCSSEngineError } from '../../src/engine/backend'

const typedDefaultManifest = defaultManifest as unknown as MasterCSSManifest

const manifest: MasterCSSManifest = {
  version: 1,
  conditions: {
    sm: { id: 'media', nodes: [{ type: 'number', value: 52.125, unit: 'rem' }] }
  },
  variants: [{ token: '@base', branches: [{ layer: 'base' }] }],
  utilities: [
    {
      id: 'display-block',
      name: 'block',
      type: -2,
      emit: { type: 'static', rules: [{ declarations: { display: 'block' } }] },
      matchers: [{ type: 'static', name: 'block' }]
    },
    {
      id: 'width',
      name: 'width',
      type: 0,
      emit: { type: 'property', property: 'width' },
      matchers: [{ type: 'key', keys: ['w'] }]
    }
  ]
}

beforeAll(() => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = new URL(
    '../../../native/artifacts/mastercss.node',
    import.meta.url
  ).pathname
})

describe('Rust engine session', () => {
  it('uses Wasm for auto backend when native addons are disabled', async () => {
    process.execArgv.push('--no-addons')
    try {
      const engine = await createEngine({ manifest, backend: 'auto' })
      try {
        expect(engine.backend).toBe('wasm')
        engine.ensureClassRules(['block'])
        expect(engine.text).toBe('@layer utilities{.block{display:block}}')
      } finally {
        engine.dispose()
      }
    } finally {
      process.execArgv.splice(process.execArgv.lastIndexOf('--no-addons'), 1)
    }
  })

  it('does not hide an invalid native binding behind Wasm fallback', async () => {
    const bindingPath = process.env.MASTER_CSS_NATIVE_BINDING_PATH
    process.env.MASTER_CSS_NATIVE_BINDING_PATH = '/missing/master-css/mastercss.node'
    try {
      await expect(createEngine({ manifest, backend: 'auto' })).rejects.toMatchObject({
        name: 'MasterCSSEngineError',
        code: 'NATIVE_LOAD_FAILED'
      })
    } finally {
      if (bindingPath === undefined) delete process.env.MASTER_CSS_NATIVE_BINDING_PATH
      else process.env.MASTER_CSS_NATIVE_BINDING_PATH = bindingPath
    }
  })

  it('keeps transitions synchronous after session creation', () => {
    const engine = createEngineSync({ manifest })
    expect(engine.ensureClassRules(['block', 'w:10px']).mutations).toHaveLength(2)
    expect(engine.text).toBe('@layer utilities{.block{display:block}.w\\:10px{width:10px}}')
    expect(engine.ensureClassRules(['block']).mutations).toEqual([])
    expect(engine.deleteClassRules(['block']).mutations).toHaveLength(1)
    expect(engine.text).toBe('@layer utilities{.w\\:10px{width:10px}}')
    engine.dispose()
  })

  it('inspects without mutating state and rejects use after disposal', () => {
    const engine = createEngineSync({ manifest })
    expect(engine.inspect('block:hover')).toMatchObject({
      version: 1,
      className: 'block:hover',
      valid: true
    })
    expect(engine.text).toBe('')
    engine.dispose()
    expect(() => engine.snapshot()).toThrow('has been disposed')
  })

  it('preserves structured Rust errors', () => {
    expect(() => createEngineSync({
      manifest: { version: 2 } as unknown as MasterCSSManifest
    })).toThrowError(expect.objectContaining({
      name: 'MasterCSSEngineError',
      code: 'UNSUPPORTED_MANIFEST_VERSION'
    }))

    const engine = createEngineSync({ manifest })
    engine.ensureClassRules(['block'])
    const before = engine.text
    expect(() => engine.refresh({ version: 2 } as unknown as MasterCSSManifest))
      .toThrow(MasterCSSEngineError)
    expect(engine.text).toBe(before)
    engine.dispose()
  })

  it('renders representative default-manifest classes without a TypeScript oracle', () => {
    const engine = createEngineSync({ manifest: typedDefaultManifest })
    const transition = engine.ensureClassRules([
      'block',
      'fg:red-60',
      'w:calc(100%-2rem)',
      'bg:blue-20:hover@sm',
      '{color:black!;bb:2px|solid}'
    ])
    expect(transition.mutations.length).toBeGreaterThanOrEqual(5)
    expect(engine.snapshot().rules.map((rule) => rule.className)).toEqual(expect.arrayContaining([
      'block',
      'fg:red-60',
      'w:calc(100%-2rem)',
      'bg:blue-20:hover@sm',
      '{color:black!;bb:2px|solid}'
    ]))
    engine.dispose()
  })
})
