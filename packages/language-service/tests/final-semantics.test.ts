import { expect, test } from 'vitest'
import workflows from '../../../parity/v2-tooling-workflows.json' with { type: 'json' }
import { compileManifestSync } from '@master/css-compiler/node'
import preset from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import CSSLanguageService from './helpers/rc87-language-service'
import createDoc from '../src/utils/create-doc'

test('editor inspection shares the CLI and AI workflow conclusions and keeps CSS in diagnostic hovers', () => {
  const manifest = compileManifestSync(workflows.source, { baseManifest: preset as unknown as MasterCSSManifest }).manifest
  const service = new CSSLanguageService({ manifest })
  try {
    for (const expected of workflows.cases) {
      const actual = service.session.inspectClassName(expected.className)
      expect(actual).toMatchObject({ matchStatus: expected.matchStatus, cssSyntaxStatus: expected.cssSyntaxStatus, cssValueStatus: expected.cssValueStatus, browserSupport: 'not-checked' })
      if (expected.code) expect(actual.diagnostics?.map(item => item.code)).toContain(expected.code)
      const doc = createDoc('html', `<div class="${expected.className}"></div>`)
      const hover = service.inspectSyntax(doc, doc.positionAt(13))
      if (expected.cssValueStatus === 'invalid') {
        expect(JSON.stringify(hover)).toContain('CSS_VALUE_INVALID')
        expect(JSON.stringify(hover)).toContain('```css')
      }
    }
  } finally { service.dispose() }
})
