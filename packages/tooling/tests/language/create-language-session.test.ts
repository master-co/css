import { describe, expect, it } from 'vitest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createLanguageSession } from '../../src/language'
import { createLanguageSessionSync } from '../../src/language/node'
import { createToolingSessionSync } from '../../src/node'
import { createPresetManifest } from './helpers/create-preset-manifest'

const manifest: MasterCSSManifest = {
  version: 1, languageVersion: 3,
  utilities: [{
    id: '.block',
    name: 'block',
    type: -2,
    emit: { type: 'static', rules: [{ declarations: { display: 'block' } }] },
    matchers: [{ type: 'static', name: 'block' }]
  }]
}

const factories = {
  'native sync': () => createLanguageSessionSync({ manifest }),
  'native async': () => createLanguageSession({ manifest, binding: 'native' }),
  wasm: () => createLanguageSession({ manifest, binding: 'wasm' })
}

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
        expect(session.inspectClassName('block')).toEqual(full.inspectClassName('block'))
        expect(session.formatDirectives({ source: '@utilities { box { @compose block; } }' })).toEqual(
          full.formatDirectives({ source: '@utilities { box { @compose block; } }' })
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
      expect(() => session.analyzeDocument({ source: '', languageId: 'html' })).toThrow(/disposed/)
      expect(() => session.classifyClassNames(['block'])).toThrow(/disposed/)
    })
  })
}

it('keeps native and Wasm v2 semantic token ranges identical', async () => {
  const tokenManifest = createPresetManifest({
    variables: [{ namespace: 'color', key: 'brand', value: '#123456' }]
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
