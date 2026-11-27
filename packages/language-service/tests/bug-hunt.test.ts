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
  const document = TextDocument.create('file:///audit.html', 'html', 1, "😀\r\n<div class=\"(color:#fff)\"></div>")
  expect(service.getClassPositions(document).map(({ token }) => token)).toEqual(["(color:#fff)"])
  expect(await service.renderSyntaxColors(document)).toHaveLength(1)
  TextDocument.update(document, [{ text: "<div class=\"(display:block)\"></div>" }], 2)
  expect(service.getClassPositions(document).map(({ token }) => token)).toEqual(["(display:block)"])
  expect(await service.renderSyntaxColors(document)).toEqual([])
  TextDocument.update(document, [{ text: '' }], 3)
  expect(service.getClassPositions(document)).toEqual([])
  expect(service.inspectSyntax(document, { line: 0, character: 0 })).toBeUndefined()
})

test('exclude globs match the decoded path of a file document', () => {
  using service = new MasterCSSLanguageService({ exclude: ['**/my app/dist/**', '**/vendor/**', 'c:/legacy/**'] }, {
    session: createToolingSessionSync({ manifest: defaultManifestJSON as unknown as MasterCSSManifest })
  })
  const accepted = (uri: string) => service.isDocumentAccepted(TextDocument.create(uri, 'html', 1, ''))
  expect(accepted('file:///Users/me/my%20app/dist/a.html')).toBe(false)
  expect(accepted('file:///Users/me/.vitepress/vendor/a.html')).toBe(false)
  expect(accepted('file:///c%3A/legacy/a.html')).toBe(false)
  expect(accepted('file:///Users/me/node_modules/x/a.html')).toBe(false)
  expect(accepted('file:///Users/me/my%20app/src/a.html')).toBe(true)
  expect(accepted('untitled:Untitled-1')).toBe(true)
})
