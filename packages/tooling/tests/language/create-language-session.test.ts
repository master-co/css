import { describe, expect, it } from 'vitest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createLanguageSession } from '../../src/language'
import { createLanguageSessionSync } from '../../src/language/node'
import { createToolingSessionSync } from '../../src/node'
import { createPresetManifest } from './helpers/create-preset-manifest'

const manifest: MasterCSSManifest = {
  "version": 5 as const,
  "languageVersion": 14 as const,
  "mixins": [
    {
      "name": "--block",
      "body": [
        {
          "type": "declaration" as const,
          "property": "display",
          "value": [
            {
              "type": "text" as const,
              "value": "block"
            }
          ]
        }
      ]
    }
  ]
}

const factories = {
  'native sync': () => createLanguageSessionSync({ manifest }),
  'native async': () => createLanguageSession({ manifest, binding: 'native' }),
  wasm: () => createLanguageSession({ manifest, binding: 'wasm' })
}

it('derives readonly family metadata from the effective manifest in both bindings', async () => {
  const preset = createPresetManifest()
  const manifest: MasterCSSManifest = {
    version: 5, languageVersion: 14,
    mixins: [
      ...(preset.mixins ?? []),
      { name: '--space', parameters: [{ name: '--custom-space' }], body: [
        { type: 'declaration', property: 'margin', value: [{ type: 'function', name: 'var', value: [{ type: 'text', value: '--custom-space' }] }] }
      ] },
      { name: '--p', body: [{ type: 'declaration', property: 'display', value: [{ type: 'text', value: 'block' }] }] }
    ]
  }
  using native = createLanguageSessionSync({ manifest })
  using wasm = await createLanguageSession({ manifest, binding: 'wasm' })
  using full = createToolingSessionSync({ manifest })
  const result = native.tokenFamilies()
  expect(wasm.tokenFamilies()).toEqual(result)
  expect(full.tokenFamilies()).toEqual(result)
  expect(result.families).toContainEqual({ mixin: '--space', prefix: 'space', namespace: 'custom-space', argument: 'value', properties: ['margin'] })
  expect(result.families).toContainEqual({ mixin: '--text', prefix: 'text', namespace: 'text', argument: 'key', properties: ['font-size', 'line-height', 'letter-spacing'] })
  expect(result.families.some(family => family.prefix === 'p')).toBe(false)
  expect(result.families.some(family => family.prefix === 'grid-row-span')).toBe(false)
  expect(Object.isFrozen(result)).toBe(true)
  expect(Object.isFrozen(result.families)).toBe(true)
  expect(result.families.every(family => Object.isFrozen(family) && Object.isFrozen(family.properties))).toBe(true)
  expect(native.inspectClassName('p-md').rules).toEqual([])
  using empty = createLanguageSessionSync({ manifest: { version: 5, languageVersion: 14 } })
  expect(empty.tokenFamilies().families).toEqual([])
})

it('inline tokens have identical native and Wasm language behavior', async () => {
  const manifest: MasterCSSManifest = {
    version: 5, languageVersion: 14,
    mixins: createPresetManifest().mixins,
    variables: { color: [{ name: 'color-brand', key: 'brand', values: [{ path: [':root,:host'], value: 'red', inline: true }] }] }
  }
  using native = createLanguageSessionSync({ manifest })
  using wasm = await createLanguageSession({ manifest, binding: 'wasm' })
  expect(wasm.completionIndex()).toEqual(native.completionIndex())
  expect(wasm.inspectClassName('bg-brand')).toEqual(native.inspectClassName('bg-brand'))
  expect(wasm.inspectClassName('bg-brand')).toMatchObject({ matchStatus: 'matched' })
})

for (const [name, create] of Object.entries(factories)) {
  describe(name, () => {
    it('matches the full tooling session and keeps earlier document results immutable', async () => {
      const session = await create()
      const full = createToolingSessionSync({ manifest })
      try {
        const request = { source: '😀 <div class="block block display:flex unknown"></div>', languageId: 'html' }
        const result = session.analyzeDocument(request)
        expect(result).toEqual(full.analyzeDocument(request))
        expect(Object.isFrozen(result)).toBe(true)
        expect(Object.isFrozen(result.classPositions)).toBe(true)
        const saved = JSON.stringify(result)
        const other = session.analyzeDocument({ source: '<div class="display:grid"></div>', languageId: 'html' })
        expect(other.classPositions.map(({ token }) => token)).toEqual(['display:grid'])
        expect(JSON.stringify(result)).toBe(saved)
        const classes = ['block', 'display:flex', 'unknown']
        expect(session.classifyClassNames(classes)).toEqual(full.classifyClassNames(classes))
        expect(session.tokenFamilies()).toEqual(full.tokenFamilies())
        expect(session.inspectClassName('block')).toEqual(full.inspectClassName('block'))
        expect(session.formatDirectives({ source: " @mixin --box { display:block; } " })).toEqual(
          full.formatDirectives({ source: " @mixin --box { display:block; } " })
        )
      } finally {
        session.dispose()
        full.dispose()
      }
    })

    it('disposes idempotently and rejects cached results after disposal', async () => {
      const session = await create()
      session.completionIndex()
      session[Symbol.dispose]()
      session.dispose()
      expect(() => session.completionIndex()).toThrow(/disposed/)
      expect(() => session.tokenFamilies()).toThrow(/disposed/)
      expect(() => session.analyzeDocument({ source: '', languageId: 'html' })).toThrow(/disposed/)
      expect(() => session.classifyClassNames(['block'])).toThrow(/disposed/)
    })
  })
}

it('keeps native and Wasm v2 semantic token ranges identical', async () => {
  const tokenManifest = createPresetManifest({
    variables: [{ namespace: 'color', key: 'brand', values: [{ path: [':root,:host'], value: '#123456' }] }]
  })
  const native = createLanguageSessionSync({ manifest: tokenManifest })
  const wasm = await createLanguageSession({ manifest: tokenManifest, binding: 'wasm' })
  const request = {
    source: '😀 <div class="fg-brand/0.5 -m-sm color:red block:hover@sm"></div>',
    languageId: 'html'
  }
  try {
    const nativeResult = native.analyzeDocument(request)
    const wasmResult = wasm.analyzeDocument(request)
    expect(wasmResult.semanticTokens).toEqual(nativeResult.semanticTokens)
    const semanticText = nativeResult.semanticTokens.map(({ start, end }) => request.source.slice(start, end))
    expect(semanticText).toContain('fg-brand')
    expect(semanticText).toContain('/')
    expect(semanticText).toContain('0.5')
    expect(semanticText).toContain('-m-sm')
    expect(semanticText).toContain('color')
    expect(semanticText).toContain(':')
    expect(semanticText).toContain('red')
  } finally {
    native.dispose()
    wasm.dispose()
  }
})
