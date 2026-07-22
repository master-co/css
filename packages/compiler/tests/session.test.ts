import { expect, test } from 'vitest'
import { createCompilerSync } from '../src/node'

test('native compiler sessions batch semantic operations and reject use after disposal', () => {
  const compiler = createCompilerSync()
  const inspected = compiler.inspectCSS<{ hasMasterEntry: boolean }>('@master entry;')
  const compiled = compiler.compileCSS('@master entry;\n@utilities { btn { display: block; } }')

  expect(compiler.backend).toBe('native')
  expect(inspected.hasMasterEntry).toBe(true)
  expect(compiled.styleDefinitions?.length).toBeGreaterThan(0)
  expect(compiler.filterCSSExtractionCandidates(
    ['bg:red', 'fg:red'],
    [{ source: '^bg:', flags: 'g' }]
  )).toEqual(['fg:red'])

  compiler.dispose()
  expect(() => compiler.inspectCSS('')).toThrowError(expect.objectContaining({
    code: 'SESSION_DISPOSED'
  }))
})
