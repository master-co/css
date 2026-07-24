import { expect, test } from 'vitest'
import { createCompilerSync } from '../src/node'

test('native compiler sessions batch semantic operations and reject use after disposal', () => {
  const compiler = createCompilerSync()
  const inspected = compiler.inspectCSS('@master entry;')
  const compiled = compiler.compileCSS('@master entry;\n@utilities { btn { display: block; } }')

  expect(compiler.binding).toBe('native')
  expect(inspected.hasMasterEntry).toBe(true)
  expect(compiled.diagnostics).toEqual([])
  expect(Object.keys(compiled)).not.toContain('styleDefinitions')
  compiler.dispose()
  compiler.dispose()
  expect(() => compiler.inspectCSS('')).toThrowError(expect.objectContaining({
    code: 'SESSION_DISPOSED'
  }))
})
