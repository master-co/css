import { expect, test, vi } from 'vitest'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { createToolingSessionSync } from '@master/css-tooling/node'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { MasterCSSLanguageService } from '../src/core'

test('document features share analysis until the document or effective settings change', async () => {
  const session = createToolingSessionSync({ manifest: defaultManifestJSON as unknown as MasterCSSManifest })
  const service = new MasterCSSLanguageService({ embeddedSyntaxHighlighting: 'always', classAttributes: ['data-css'] }, { session })
  const analyze = vi.spyOn(session, 'analyzeDocument')
  const document = TextDocument.create('file:///cache.html', 'html', 1, '<div class="fg:red" data-next="block"/>')
  const position = document.positionAt(14)
  try {
    expect(service.getClassPosition(document, position)?.token).toBe('fg:red')
    service.getClassContextPositions(document, position)
    service.renderSemanticTokens(document)
    service.renderSemanticTokensAtPosition(document, position)
    service.inspectSyntax(document, position)
    await service.renderSyntaxColors(document)
    expect(analyze).toHaveBeenCalledTimes(1)

    service.settings.classAttributes?.push('data-next')
    expect(service.getClassPositions(document).map(({ token }) => token)).toContain('block')
    expect(analyze).toHaveBeenCalledTimes(2)
    TextDocument.update(document, [{ text: '<div class="flex"/>' }], 2)
    expect(service.getClassPositions(document).map(({ token }) => token)).toEqual(['flex'])
    expect(analyze).toHaveBeenCalledTimes(3)
    const replacement = TextDocument.create(document.uri, 'html', 2, '<div class="hidden"/>')
    expect(service.getClassPositions(replacement).map(({ token }) => token)).toEqual(['hidden'])
    expect(analyze).toHaveBeenCalledTimes(4)
  } finally {
    service.dispose()
  }
  expect(() => service.getClassPositions(document)).toThrow()
})
