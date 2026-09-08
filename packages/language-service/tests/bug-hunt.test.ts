import { expect, test } from 'vitest'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { createToolingSessionSync } from '@master/css-tooling/node'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { MasterCSSLanguageService } from '../src/core'

test('audit control: updated documents replace class and color ranges', async () => {
  using service = new MasterCSSLanguageService(undefined, {
    session: createToolingSessionSync({ manifest: defaultManifestJSON as unknown as MasterCSSManifest })
  })
  const document = TextDocument.create('file:///audit.html', 'html', 1, '😀\r\n<div class="fg:#fff"></div>')
  expect(service.getClassPositions(document).map(({ token }) => token)).toEqual(['fg:#fff'])
  expect(await service.renderSyntaxColors(document)).toHaveLength(1)
  TextDocument.update(document, [{ text: '<div class="block"></div>' }], 2)
  expect(service.getClassPositions(document).map(({ token }) => token)).toEqual(['block'])
  expect(await service.renderSyntaxColors(document)).toEqual([])
  TextDocument.update(document, [{ text: '' }], 3)
  expect(service.getClassPositions(document)).toEqual([])
  expect(service.inspectSyntax(document, { line: 0, character: 0 })).toBeUndefined()
})
