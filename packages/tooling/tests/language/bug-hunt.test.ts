import { expect, test } from 'vitest'
import { createTestToolingSession } from '../helpers/create-tooling-session'

test('BH-0014 semantic tokens retain raw source offsets after escaped quotes', () => {
  using session = createTestToolingSession()
  const source = String.raw`clsx("content:\"x\":hover")`
  const result = session.analyzeDocument({ source, languageId: 'typescript' })
  expect(result.classPositions).toHaveLength(1)
  const hoverStart = source.indexOf('hover')
  expect(result.semanticTokens.map(({ start, end }) => ({ start, end })))
    .toContainEqual({ start: hoverStart, end: hoverStart + 5 })
})

test('audit control: Unicode CRLF formatting preserves text and is idempotent', () => {
  using session = createTestToolingSession()
  const source = '/* 😀 中 */\r\n.x { @compose  block  fg:red ! ; }\r\n'
  const edits = session.formatDirectives({ source }).edits
  let formatted = source
  for (const edit of [...edits].reverse()) {
    formatted = formatted.slice(0, edit.range.start) + edit.text + formatted.slice(edit.range.end)
  }
  expect(formatted).toBe('/* 😀 中 */\r\n.x { @compose block fg:red!; }\r\n')
  expect(session.formatDirectives({ source: formatted }).edits).toEqual([])
  expect(() => session.analyzeDocument({
    source: '😀', languageId: 'text', hostRanges: [{ start: 1, end: 2, unescape: [] }]
  })).toThrow(/UTF-16/)
})
