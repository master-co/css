import { defaultManifest } from '@master/css-tooling/language'
import { createLanguageSessionSync } from '@master/css-tooling/language/node'
import { CompletionTriggerKind } from 'vscode-languageserver-protocol'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { afterEach, describe, expect, test } from 'vitest'
import CSSLanguageService from '../src/core'

const sessions: ReturnType<typeof createLanguageSessionSync>[] = []

afterEach(() => {
  for (const session of sessions.splice(0)) session.dispose()
})

function createService() {
  const session = createLanguageSessionSync(defaultManifest)
  sessions.push(session)
  return new CSSLanguageService(undefined, { session })
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
