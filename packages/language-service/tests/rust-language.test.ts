import { beforeAll, expect, test } from 'vitest'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { createRustLanguageAnalyzer } from '@master/css-language/node'
import CSSLanguageService from '../src'
import { createPresetManifest } from './helpers/create-preset-manifest'

beforeAll(() => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = new URL(
    '../../native/artifacts/mastercss.node',
    import.meta.url
  ).pathname
})

test('uses one Rust analyzer for class positions and semantic token encoding', async () => {
  const nativeAnalyzer = await createRustLanguageAnalyzer()
  let analyzeCalls = 0
  let classifyCalls = 0
  const analyzer = {
    analyze: (...parameters: Parameters<typeof nativeAnalyzer.analyze>) => {
      analyzeCalls++
      return nativeAnalyzer.analyze(...parameters)
    },
    createSession: (...parameters: Parameters<NonNullable<typeof nativeAnalyzer.createSession>>) => {
      const session = nativeAnalyzer.createSession?.(...parameters)
      if (!session) throw new Error('Expected the Rust language backend to create a session.')
      return {
        ...session,
        analyze: (...analyzeParameters: Parameters<typeof session.analyze>) => {
          analyzeCalls++
          return session.analyze(...analyzeParameters)
        },
        classifyClassNames: (...classNames: Parameters<NonNullable<typeof session.classifyClassNames>>) => {
          classifyCalls++
          return session.classifyClassNames?.(...classNames) as ReturnType<NonNullable<typeof session.classifyClassNames>>
        }
      }
    }
  }
  const settings = {
    classDeclarations: ['classes'],
    embeddedSyntaxHighlighting: 'always' as const
  }
  const source = 'const emoji = "😀"\nconst classes = `fg:red content:\\`\\``'
  const document = TextDocument.create('file:///rust-language.ts', 'typescript', 1, source)
  const oracle = new CSSLanguageService(settings)
  const service = new CSSLanguageService(settings, { analyzer })

  expect(service.getClassPositions(document)).toEqual(oracle.getClassPositions(document))
  expect(service.renderSemanticTokens(document)).toEqual(oracle.renderSemanticTokens(document))
  expect(analyzeCalls).toBeGreaterThanOrEqual(2)
  expect(classifyCalls).toBe(1)
  service.dispose()
})

test('matches TS semantic classification for grouped, component, state, and value classes', async () => {
  const analyzer = await createRustLanguageAnalyzer()
  const manifest = createPresetManifest({
    variables: [{ namespace: 'color', key: 'brand', value: '#123456' }],
    utilities: [{ name: 'rust-card', layer: 'components', declarations: { display: 'block' } }]
  })
  const source = '😀 <div class="fg:brand:hover@sm block {fg:red;w:10px!}>li:hover@sm rust-card rust-card:hover -webkit-text-size-adjust:none made-up:nope"></div>'
  const document = TextDocument.create('file:///rust-language.html', 'html', 1, source)
  const settings = { manifest, embeddedSyntaxHighlighting: 'always' as const }
  const oracle = new CSSLanguageService(settings)
  const service = new CSSLanguageService(settings, { analyzer })
  try {
    expect(service.renderSemanticTokens(document)).toEqual(oracle.renderSemanticTokens(document))
    const completionDocument = TextDocument.create(
      'file:///rust-language-completion.html',
      'html',
      1,
      '<div class=""></div>'
    )
    const completionPosition = completionDocument.positionAt('<div class="'.length)
    expect(service.suggestSyntax(completionDocument, completionPosition, { triggerKind: 1 }))
      .toEqual(oracle.suggestSyntax(completionDocument, completionPosition, { triggerKind: 1 }))
    for (const token of ['fg:brand:hover@sm', 'rust-card', '-webkit-text-size-adjust:none', 'made-up:nope']) {
      const position = document.positionAt(source.indexOf(token) + 1)
      expect(service.inspectSyntax(document, position)).toEqual(oracle.inspectSyntax(document, position))
    }
  } finally {
    service.dispose()
    oracle.dispose()
  }
})
