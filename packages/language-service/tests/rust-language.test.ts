import { beforeAll, expect, test } from 'vitest'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { createRustLanguageAnalyzer } from '@master/css-language/node'
import CSSLanguageService from '../src'

beforeAll(() => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = new URL(
    '../../native/artifacts/mastercss.node',
    import.meta.url
  ).pathname
})

test('uses one Rust analyzer for class positions and semantic token encoding', async () => {
  const nativeAnalyzer = await createRustLanguageAnalyzer()
  let analyzeCalls = 0
  const analyzer = {
    analyze: (...parameters: Parameters<typeof nativeAnalyzer.analyze>) => {
      analyzeCalls++
      return nativeAnalyzer.analyze(...parameters)
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
})
