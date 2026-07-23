import { expect, test } from 'vitest'
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import resolveContext from '../src/utils/resolve-context'

test('uses the shared Rust-backed tooling session', () => {
  const context = {
    cwd: process.cwd(),
    filename: '<input>',
    physicalFilename: '<input>',
    options: [],
    settings: {}
  } as unknown as RuleContext<any, any[]>

  const resolved = resolveContext(context)

  expect(resolved.tooling).toBeDefined()
  expect(resolved.tooling.backend).toBe('native')
})
