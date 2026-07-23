import { beforeAll, describe, expect, it } from 'vitest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { MasterCSSError } from '@master/css-schema'
import defaultManifest from '@master/css-preset/default-manifest.json'
import createEngine from '../../src/engine/create-engine'
import { createEngineSync } from '../../src/node'

const typedDefaultManifest = defaultManifest as unknown as MasterCSSManifest
const selectorVariantClassName = '{flex;rel}_:is(h4,.app-nav)@default'
const selectorVariantSelector = '.\\{flex\\;rel\\}_\\:is\\(h4\\,\\.app-nav\\)\\@default :is(h4,.app-nav)'
const selectorVariantRuleText = `${selectorVariantSelector}{display:flex;position:relative}`
const inlineThemeManifest = {
  version: 1,
  settings: {
    defaultMode: 'light',
    modeTrigger: 'class',
    modes: ['light', 'dark']
  },
  variables: {
    color: [
      {
        name: 'color-white',
        key: 'white',
        value: 'oklch(100% 0 none)',
        inline: true
      },
      {
        name: 'color-gray-90',
        key: 'gray-90',
        value: 'oklch(23.5% 0 none)'
      }
    ],
    'color-surface': [
      {
        name: 'color-surface-raised',
        key: 'raised',
        dependencies: ['color-white', 'color-gray-90'],
        modes: {
          light: { value: 'var(--color-white)' },
          dark: { value: 'var(--color-gray-90)' }
        }
      }
    ]
  },
  utilities: [{
    id: 'surface',
    type: 0,
    variableAliasRefs: ['color-surface'],
    emit: { type: 'property', property: 'background-color' },
    matchers: [{ type: 'variable', keys: ['surface'] }]
  }]
} as unknown as MasterCSSManifest
const inlineThemeCSS = [
  '@layer theme{',
  '.light,:root{color-scheme:light;--color-surface-raised:oklch(100% 0 none)}',
  ':root{--color-gray-90:oklch(23.5% 0 none)}',
  '.dark{color-scheme:dark;--color-surface-raised:var(--color-gray-90)}',
  '}',
  '@layer utilities{.surface\\:raised{background-color:var(--color-surface-raised)}}'
].join('')

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
        expect(engine.snapshot().text).toBe('@layer utilities{.block{display:block}}')
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
        name: 'MasterCSSError',
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
    expect(engine.snapshot().text).toBe('@layer utilities{.block{display:block}.w\\:10px{width:10px}}')
    expect(engine.ensureClassRules(['block']).mutations).toEqual([])
    expect(engine.deleteClassRules(['block']).mutations).toHaveLength(1)
    expect(engine.snapshot().text).toBe('@layer utilities{.w\\:10px{width:10px}}')
    engine.dispose()
  })

  it('inspects without mutating state and rejects use after disposal', () => {
    const engine = createEngineSync({ manifest })
    expect(engine.inspect('block:hover')).toMatchObject({
      version: 1,
      className: 'block:hover',
      valid: true
    })
    expect(engine.snapshot().text).toBe('')
    engine.dispose()
    expect(() => engine.snapshot()).toThrow('has been disposed')
  })

  it('preserves structured Rust errors', () => {
    expect(() => createEngineSync({
      manifest: { version: 2 } as unknown as MasterCSSManifest
    })).toThrowError(expect.objectContaining({
      name: 'MasterCSSError',
      code: 'UNSUPPORTED_MANIFEST_VERSION'
    }))

    const engine = createEngineSync({ manifest })
    engine.ensureClassRules(['block'])
    const before = engine.snapshot().text
    expect(() => engine.refresh({ version: 2 } as unknown as MasterCSSManifest))
      .toThrow(MasterCSSError)
    expect(engine.snapshot().text).toBe(before)
    engine.dispose()
  })

  it('serializes manifests when refreshing a Wasm engine', async () => {
    const engine = await createEngine({ manifest, backend: 'wasm' })
    try {
      engine.ensureClassRules(['block'])
      expect(engine.refresh(manifest)).toMatchObject({
        version: 1,
        mutations: [
          { op: 'delete', key: 'block' },
          { op: 'insert', key: 'block' }
        ]
      })
      expect(engine.snapshot().text).toBe('@layer utilities{.block{display:block}}')
    } finally {
      engine.dispose()
    }
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

  it('preserves descendant selectors across condition-only variants in native and Wasm', async () => {
    const native = createEngineSync({ manifest: typedDefaultManifest })
    const wasm = await createEngine({ manifest: typedDefaultManifest, backend: 'wasm' })

    try {
      const nativeInspection = native.inspect(selectorVariantClassName)
      const wasmInspection = wasm.inspect(selectorVariantClassName)

      expect(nativeInspection.rules).toHaveLength(1)
      expect(nativeInspection.rules[0]).toMatchObject({
        layer: 'defaults',
        priority: { selector: 0 },
        selectorText: selectorVariantSelector,
        sortTier: 1,
        text: selectorVariantRuleText
      })
      expect(wasmInspection).toEqual(nativeInspection)
      expect(native.snapshot().text).toBe('')
      expect(wasm.snapshot().text).toBe('')

      const nativeTransition = native.ensureClassRules([selectorVariantClassName])
      const wasmTransition = wasm.ensureClassRules([selectorVariantClassName])

      expect(wasmTransition).toEqual(nativeTransition)
      expect(native.snapshot().text).toBe(`@layer defaults{${selectorVariantRuleText}}`)
      expect(wasm.snapshot().text).toBe(native.snapshot().text)
      expect(wasm.snapshot()).toEqual(native.snapshot())
    } finally {
      native.dispose()
      wasm.dispose()
    }
  })

  it('resolves inline dependencies in emitted mode variables in native and Wasm', async () => {
    const native = createEngineSync({ manifest: inlineThemeManifest })
    const wasm = await createEngine({ manifest: inlineThemeManifest, backend: 'wasm' })

    try {
      const nativeTransition = native.ensureClassRules(['surface:raised'])
      const wasmTransition = wasm.ensureClassRules(['surface:raised'])

      expect(wasmTransition).toEqual(nativeTransition)
      expect(native.snapshot().text).toBe(inlineThemeCSS)
      expect(wasm.snapshot().text).toBe(native.snapshot().text)
      expect(wasm.snapshot()).toEqual(native.snapshot())
      expect(native.snapshot().resources.variables.map(({ name }) => name)).toEqual([
        'color-surface-raised',
        'color-gray-90'
      ])
    } finally {
      native.dispose()
      wasm.dispose()
    }
  })
})
