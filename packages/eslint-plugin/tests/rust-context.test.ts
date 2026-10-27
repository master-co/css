import { expect, test, vi } from 'vitest'
import * as nativeTooling from '@master/css-tooling/node'
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

test('reuses a tooling session across source files in one lint run', () => {
  const create = vi.spyOn(nativeTooling, 'createToolingSessionSync')
  const first = resolveContext({
    cwd: process.cwd(),
    filename: '<input>',
    physicalFilename: '<input>',
    options: [],
    sourceCode: {},
    settings: {}
  } as unknown as RuleContext<any, any[]>)
  expect(first.tooling.binding).toBe('native')
  const creations = create.mock.calls.length
  first.release()

  const second = resolveContext({
    cwd: process.cwd(),
    filename: '<input>',
    physicalFilename: '<input>',
    options: [],
    sourceCode: {},
    settings: {}
  } as unknown as RuleContext<any, any[]>)

  expect(second.tooling.binding).toBe('native')
  expect(create.mock.calls.length).toBe(creations)
  second.release()
  create.mockRestore()
})
