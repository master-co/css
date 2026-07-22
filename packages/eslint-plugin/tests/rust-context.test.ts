import { expect, test } from 'vitest'
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import resolveContext from '../src/utils/resolve-context'

test('does not construct the TypeScript oracle when the Rust lint session is available', () => {
  const context = {
    cwd: process.cwd(),
    filename: '<input>',
    physicalFilename: '<input>',
    options: [],
    settings: {}
  } as unknown as RuleContext<any, any[]>

  const resolved = resolveContext(context)

  expect(resolved.rustLint).toBeDefined()
  expect(resolved.css).toBeUndefined()
})
