import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createToolingSessionSync } from '@master/css-tooling/node'
import { CompletionTriggerKind } from 'vscode-languageserver-protocol'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { afterEach, describe, expect, test } from 'vitest'
import { MasterCSSLanguageService } from '../src/core'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest
const sessions: ReturnType<typeof createToolingSessionSync>[] = []

afterEach(() => {
  for (const session of sessions.splice(0)) session.dispose()
})

function createService() {
  const session = createToolingSessionSync({ manifest: defaultManifest })
  sessions.push(session)
  return new MasterCSSLanguageService(undefined, { session })
}

describe('Rust-backed language service', () => {
  test('uses Rust for document contexts and hover inspection', () => {
    const service = createService()
    const document = TextDocument.create('file:///index.html', 'html', 1, '<div class="fg:red:hover"></div>')
    const position = document.positionAt(18)

    expect(service.getClassPosition(document, position)?.token).toBe('fg:red:hover')
    expect(service.inspectSyntax(document, position)?.contents).toBeTruthy()
  })

  test('uses the Rust completion index', () => {
    const service = createService()
    const document = TextDocument.create('file:///index.html', 'html', 1, '<div class="fg:"></div>')
    const items = service.suggestSyntax(document, document.positionAt(15), {
      triggerKind: CompletionTriggerKind.Invoked
    })

    expect(items?.some(({ label }) => label.startsWith('fg:'))).toBe(true)
  })
})
