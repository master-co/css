import { describe, expect, it } from 'vitest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createLanguageSession } from '../../src/language'
import { createLanguageSessionSync } from '../../src/language/node'
import { createToolingSessionSync } from '../../src/node'

const manifest: MasterCSSManifest = {
  version: 1,
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
        expect(session.formatDirectives({ source: '@components { box { @compose block; } }' })).toEqual(
          full.formatDirectives({ source: '@components { box { @compose block; } }' })
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
