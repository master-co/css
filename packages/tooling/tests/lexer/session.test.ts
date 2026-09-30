import { beforeAll, expect, test } from 'vitest'
import { fileURLToPath } from 'node:url'
import { createTestToolingSession } from '../helpers/create-tooling-session'

beforeAll(() => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = fileURLToPath(
    new URL('../../../binding/artifacts/mastercss.node', import.meta.url)
  )
})

test('batches class lists, CSS inspection, and identifier escaping in Rust', () => {
  const lexer = createTestToolingSession()
  try {
    const result = lexer.analyzeClassList({
      classLists: [{ source: "😀 color\\:red  display:block", unescape: [':'] }],
      cssSources: [`@import "@master/css"; @theme {
  --x: 1;
}

.dark { --x: 1 }
`],
      escapeIdentifiers: ["color:red"]
    })
    expect(result.classLists[0].map(({ token }) => token)).toEqual(['😀', "color:red", "display:block"])
    expect(result.cssSources[0].directives.map(({ name }) => name)).toEqual(['theme'])
    expect(result.escapedIdentifiers).toEqual(["color\\:red"])
  } finally {
    lexer.dispose()
  }
})
