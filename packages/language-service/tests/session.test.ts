import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createToolingSessionSync } from '@master/css-tooling/node'
import { CompletionTriggerKind } from 'vscode-languageserver-protocol'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { afterEach, describe, expect, test } from 'vitest'
import { MasterCSSLanguageService } from '../src/core'
import { createPresetManifest } from './helpers/create-preset-manifest'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest
const sessions: ReturnType<typeof createToolingSessionSync>[] = []

afterEach(() => {
  for (const session of sessions.splice(0)) session.dispose()
})

function createService(manifest: MasterCSSManifest = defaultManifest) {
  const session = createToolingSessionSync({ manifest })
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

  test('does not render static theme modifier semantic tokens', () => {
    const service = createService()
    const document = TextDocument.create(
      'file:///index.css',
      'css',
      1,
      '@theme static { --color-primary: #123; }'
    )

    expect(service.renderSemanticTokens(document)).toBeUndefined()
  })

  test('uses the injected runtime default manifest for completions', () => {
    const service = createService(createPresetManifest({
      utilities: [{ name: 'runtime-card', layer: 'components', declarations: { display: 'block' } }]
    }))
    const document = TextDocument.create('file:///index.html', 'html', 1, '<div class="runtime-"></div>')
    const items = service.suggestSyntax(document, document.positionAt('<div class="runtime-'.length), {
      triggerKind: CompletionTriggerKind.Invoked
    })

    expect(items?.map(({ label }) => label)).toContain('runtime-card')
  })

  test('uses the injected runtime for hover CSS previews', () => {
    const service = createService(createPresetManifest({
      utilities: [{ name: 'runtime-card', layer: 'components', declarations: { display: 'block' } }]
    }))
    const document = TextDocument.create(
      'file:///index.html',
      'html',
      1,
      '<div class="runtime-card"></div>'
    )
    const hover = service.inspectSyntax(document, document.positionAt('<div class="runtime'.length))

    expect(JSON.stringify(hover?.contents)).toContain('display')
    expect(JSON.stringify(hover?.contents)).toContain('block')
  })

  test('uses the injected runtime variables for document colors', async () => {
    const service = createService(createPresetManifest({
      variables: [{ namespace: 'color', key: 'runtime-brand', value: '#123456' }]
    }))
    const document = TextDocument.create(
      'file:///index.html',
      'html',
      1,
      '<div class="fg:runtime-brand"></div>'
    )

    expect(await service.renderSyntaxColors(document)).toHaveLength(1)
  })
})
