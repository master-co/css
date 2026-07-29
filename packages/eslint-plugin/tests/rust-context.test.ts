import { expect, test } from 'vitest'
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import resolveContext from '../src/utils/resolve-context'

test('uses the shared Rust-backed tooling session', () => {
  const sourceCode = {}
  const context = {
    cwd: process.cwd(),
    filename: '<input>',
    physicalFilename: '<input>',
    options: [],
    sourceCode,
    settings: {}
  } as unknown as RuleContext<any, any[]>

  const first = resolveContext(context)
  const second = resolveContext(context)

  expect(first.tooling).toBeDefined()
  expect(first.tooling.binding).toBe('native')
  expect(second.tooling).toBe(first.tooling)

  first.release()
  second.release()
})
