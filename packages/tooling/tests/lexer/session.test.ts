import { beforeAll, expect, test } from 'vitest'
import { createTestToolingSession } from '../helpers/create-tooling-session'

beforeAll(() => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = new URL(
    '../../../binding/artifacts/mastercss.node',
    import.meta.url
  ).pathname
})

test('batches class lists, CSS inspection, and identifier escaping in Rust', () => {
  const lexer = createTestToolingSession()
  try {
    const result = lexer.analyzeClassList({
      classLists: [{ source: '😀 fg\\:red  block', unescape: [':'] }],
      cssSources: ['@master entry; @theme dark { --x: 1 }'],
      escapeIdentifiers: ['fg:red']
    })
    expect(result.classLists[0].map(({ token }) => token)).toEqual(['😀', 'fg:red', 'block'])
    expect(result.cssSources[0].directives.map(({ name }) => name)).toEqual(['master', 'theme'])
    expect(result.escapedIdentifiers).toEqual(['fg\\:red'])
  } finally {
    lexer.dispose()
  }
})
