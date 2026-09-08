import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { expect, test } from 'vitest'
import { createLanguageSession } from '../../src/language'

for (const binding of ['native', 'wasm'] as const) {
  test(`${binding}: BH-0013/0014 Unicode boundaries and escaped semantic ranges`, async () => {
    const session = await createLanguageSession({
      manifest: defaultManifestJSON as MasterCSSManifest,
      binding
    })
    try {
      for (const prefix of ['é', '中', '😀', 'e\u0301']) {
        const source = `${prefix.repeat(300)}clsx("block")`
        const result = session.analyzeDocument({ source, languageId: 'typescript' })
        expect(result.classPositions.map(position => position.token)).toEqual(['block'])
        expect(result.classPositions[0].range.start).toBe(source.indexOf('block'))
      }
      for (const source of [
        String.raw`clsx("content:\"x\":hover")`,
        String.raw`clsx('content:\'x\':hover')`,
        String.raw`/* 😀 */ clsx("content:\"😀\":hover")`
      ]) {
        const result = session.analyzeDocument({ source, languageId: 'typescript' })
        const start = source.indexOf('hover')
        expect(result.semanticTokens.map(({ start, end }) => ({ start, end })))
          .toContainEqual({ start, end: start + 5 })
      }
    } finally {
      session.dispose()
    }
  })
}
