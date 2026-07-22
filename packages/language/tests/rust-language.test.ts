import { beforeAll, expect, test } from 'vitest'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { encodeSemanticTokens } from '../src/semantic/encode'
import { createRustLanguageAnalyzer } from '../src/rust-session'
import type { SemanticTokenItem } from '../src/semantic/types'

beforeAll(() => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = new URL(
    '../../native/artifacts/mastercss.node',
    import.meta.url
  ).pathname
})

test('matches UTF-16 class ranges and semantic token encoding', async () => {
  const source = '😀 <div class="fg:red  content:\\`\\`">\r\n<span></span>'
  const classList = 'fg:red  content:\\`\\`'
  const start = source.indexOf(classList)
  const end = start + classList.length
  const tokens: SemanticTokenItem[] = [
    { start, end: start + 2, type: 'property', modifiers: ['declaration'] },
    { start: start + 3, end: start + 6, type: 'keyword' },
    { start: start + 8, end, type: 'string', modifiers: ['quoted'] }
  ]
  const analyzer = await createRustLanguageAnalyzer()
  const batch = analyzer.analyze(source, [{ start, end, unescape: ['`'] }], tokens)
  const document = TextDocument.create('file:///test.html', 'html', 1, source)

  expect(batch.version).toBe(1)
  expect(batch.classPositions).toEqual([
    {
      range: { start, end: start + 6 },
      contextRange: { start, end },
      raw: 'fg:red',
      token: 'fg:red'
    },
    {
      range: { start: start + 8, end },
      contextRange: { start, end },
      raw: 'content:\\`\\`',
      token: 'content:``'
    }
  ])
  expect(batch.semanticTokenData).toEqual(encodeSemanticTokens(document, tokens).data)
})
