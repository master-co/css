import { ESLint } from 'eslint'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, sep } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import * as mdx from 'eslint-mdx'
import * as project from '@master/css-compiler/project/sync'
import * as nativeTooling from '@master/css-tooling/node'
import plugin from '../src'
import { createSourceTooling } from '../src/utils/source-tooling'
import type { MasterCSSToolingSession } from '@master/css-tooling'
import { acquireWorkspaceSnapshot, releaseWorkspaceSnapshot } from '../src/utils/workspace-cache'
import resolveContext from '../src/utils/resolve-context'
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'

const roots: string[] = []
afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function workspace() {
  const root = mkdtempSync(join(tmpdir(), 'master-eslint-cache-'))
  roots.push(root)
  return root
}

function linter(cwd: string, fix = false) {
  return new ESLint({
    cwd, fix, overrideConfigFile: true,
    overrideConfig: [
      ...plugin.configs.recommended,
      {
        files: ['**/*.{jsx,mdx}'],
        languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
        rules: { '@master/css/no-invalid-classes': ['error', { disallowUnknownClass: true }] }
      },
      { files: ['**/*.mdx'], languageOptions: { parser: mdx } }
    ]
  })
}

test('does no project discovery or native initialization for files without class values', async () => {
  const discover = vi.spyOn(project, 'discoverManifestEntriesSync')
  const create = vi.spyOn(nativeTooling, 'createToolingSessionSync')
  const results = await linter(workspace()).lintText('export const value = 1', { filePath: 'metadata.jsx' })
  expect(results[0].messages).toEqual([])
  expect(discover).not.toHaveBeenCalled()
  expect(create).not.toHaveBeenCalled()
})

test('reuses discovery and native sessions across source files', async () => {
  const root = workspace()
  const discover = vi.spyOn(project, 'discoverManifestEntriesSync')
  const create = vi.spyOn(nativeTooling, 'createToolingSessionSync')
  const eslint = linter(root)
  for (const filePath of ['first.jsx', 'second.jsx']) {
    const [result] = await eslint.lintText('<div className="color:red" />', { filePath })
    expect(result.messages).toEqual([])
  }
  expect(discover).toHaveBeenCalledTimes(1)
  expect(create).toHaveBeenCalledTimes(1)
})

test('analyzes each MDX document once across four rules and refreshes on the next source', async () => {
  const original = nativeTooling.createToolingSessionSync
  const analyses = vi.fn()
  vi.spyOn(nativeTooling, 'createToolingSessionSync').mockImplementation(options => {
    const session = original(options)
    const analyze = session.analyzeLintDocument.bind(session)
    vi.spyOn(session, 'analyzeLintDocument').mockImplementation((...args) => {
      analyses(...args)
      return analyze(...args)
    })
    return session
  })
  const eslint = linter(workspace())
  const [first] = await eslint.lintText('中文😀\r\n\r\n<div className="color:red" />', { filePath: 'guide.mdx' })
  expect(first.messages).toEqual([])
  expect(analyses).toHaveBeenCalledTimes(1)
  const [second] = await eslint.lintText('<div className="fixture-unknown" />', { filePath: 'guide.mdx' })
  expect(second.messages.some(message => message.ruleId === '@master/css/no-invalid-classes')).toBe(true)
  expect(analyses).toHaveBeenCalledTimes(2)
})

test('memoization separates text, unescape, options, sessions and failed requests', () => {
  const analyze = vi.fn((...args) => ({ args }))
  const tokenize = vi.fn((...args) => ({ args }))
  const session = { analyzeLintClassList: analyze, tokenizeClassList: tokenize } as unknown as MasterCSSToolingSession
  const facade = createSourceTooling(() => session)
  const first = facade.session
  const second = createSourceTooling(() => session).session
  const names = ['unknown']
  first.analyzeLintClassList('unknown', names, { disallowUnknownClass: true })
  first.analyzeLintClassList('unknown', names, { disallowUnknownClass: true })
  expect(analyze).toHaveBeenCalledTimes(1)
  first.analyzeLintClassList('unknown', names, { disallowUnknownClass: false })
  first.analyzeLintClassList(' unknown', names, { disallowUnknownClass: true })
  second.analyzeLintClassList('unknown', names, { disallowUnknownClass: true })
  expect(analyze).toHaveBeenCalledTimes(4)
  first.tokenizeClassList('text', false)
  first.tokenizeClassList('text', '"')
  first.tokenizeClassList('text', false)
  expect(tokenize).toHaveBeenCalledTimes(2)
  analyze.mockImplementationOnce(() => { throw new Error('failed') })
  expect(() => first.analyzeLintClassList('failure', [])).toThrow('failed')
  first.analyzeLintClassList('failure', [])
  expect(analyze).toHaveBeenCalledTimes(6)
  facade.clear()
  first.analyzeLintClassList('failure', [])
  expect(analyze).toHaveBeenCalledTimes(7)
})

test('new, edited and removed CSS entries invalidate unchanged source diagnostics', async () => {
  const root = workspace()
  const eslint = linter(root)
  const code = '<div className="fixture-one" />'
  const lint = async () => (await eslint.lintText(code, { filePath: 'index.jsx' }))[0].errorCount
  expect(await lint()).toBe(1)
  const entry = join(root, 'index.css')
  writeFileSync(entry, '@import "@master/css"; @mixin --fixture-one { color: red; }')
  expect(await lint()).toBe(0)
  writeFileSync(entry, '@import "@master/css"; @mixin --fixture-two { color: red; }')
  expect(await lint()).toBe(1)
  rmSync(entry)
  expect(await lint()).toBe(1)
})

test('CSS files becoming entries and imported dependency edits are observed', async () => {
  const root = workspace()
  const entry = join(root, 'index.css')
  const imported = join(root, 'tokens.css')
  writeFileSync(entry, ':root { color: red; }')
  writeFileSync(imported, '@mixin --fixture-one { color: red; }')
  const eslint = linter(root)
  const lint = async () => (await eslint.lintText('<div className="fixture-one" />', { filePath: 'index.jsx' }))[0].errorCount
  expect(await lint()).toBe(1)
  writeFileSync(entry, '@import "@master/css"; @import "./tokens.css";')
  expect(await lint()).toBe(0)
  writeFileSync(imported, '@mixin --fixture-two { color: red; }')
  expect(await lint()).toBe(1)
})

test('imports outside the discovery root invalidate cached native sessions', async () => {
  const root = workspace()
  const imported = join(workspace(), 'external.css')
  writeFileSync(imported, '@mixin --fixture-one { color: red; }')
  writeFileSync(join(root, 'index.css'), `@import "@master/css"; @import "${relative(root, imported).split(sep).join('/')}";`)
  const eslint = linter(root)
  const lint = async () => (await eslint.lintText('<div className="fixture-one" />', { filePath: 'index.jsx' }))[0].errorCount
  expect(await lint()).toBe(0)
  writeFileSync(imported, '@mixin --fixture-two { color: red; }')
  expect(await lint()).toBe(1)
})

test('package metadata changes and new directories refresh workspace ownership', async () => {
  const root = workspace()
  const child = join(root, 'child')
  mkdirSync(child)
  writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies: { '@master/css': '*' } }))
  writeFileSync(join(root, 'index.css'), '@import "@master/css"; @mixin --fixture-one { color: red; }')
  writeFileSync(join(child, 'package.json'), '{}')
  const eslint = linter(root)
  const lint = async () => (await eslint.lintText('<div className="fixture-one" />', { filePath: 'child/index.jsx' }))[0].errorCount
  expect(await lint()).toBe(0)
  writeFileSync(join(child, 'package.json'), JSON.stringify({ dependencies: { '@master/css': '*' } }))
  expect(await lint()).toBe(1)
  mkdirSync(join(child, 'styles'))
  writeFileSync(join(child, 'styles/index.css'), '@import "@master/css"; @mixin --fixture-one { color: red; }')
  expect(await lint()).toBe(0)
})

test('workspace snapshots are isolated and released only after their last reader', () => {
  vi.useFakeTimers()
  const root = workspace()
  const first = acquireWorkspaceSnapshot(root)
  const second = acquireWorkspaceSnapshot(root)
  const other = acquireWorkspaceSnapshot(workspace())
  expect(second).toBe(first)
  expect(other).not.toBe(first)
  releaseWorkspaceSnapshot(first)
  vi.advanceTimersByTime(2_000)
  const third = acquireWorkspaceSnapshot(root)
  expect(third).toBe(second)
  releaseWorkspaceSnapshot(second)
  releaseWorkspaceSnapshot(third)
  releaseWorkspaceSnapshot(other)
  vi.advanceTimersByTime(1_000)
  const next = acquireWorkspaceSnapshot(root)
  expect(next).not.toBe(first)
  releaseWorkspaceSnapshot(next)
  vi.advanceTimersByTime(1_000)
})

test('native sessions survive active sources and are disposed after the last release', () => {
  vi.useFakeTimers()
  const dispose = vi.fn()
  vi.spyOn(nativeTooling, 'createToolingSessionSync').mockReturnValue({ binding: 'native', dispose } as unknown as MasterCSSToolingSession)
  const context = {
    cwd: workspace(), filename: '<input>', physicalFilename: '<input>',
    options: [], sourceCode: {}, settings: {}
  } as unknown as RuleContext<any, any[]>
  const first = resolveContext(context)
  const second = resolveContext({ ...context, sourceCode: {} } as RuleContext<any, any[]>)
  expect(first.tooling.binding).toBe('native')
  expect(second.tooling.binding).toBe('native')
  first.release()
  vi.advanceTimersByTime(2_000)
  expect(dispose).not.toHaveBeenCalled()
  second.release()
  second.release()
  vi.advanceTimersByTime(1_000)
  expect(dispose).toHaveBeenCalledTimes(1)
  expect(() => first.tooling.binding).toThrow('released')
})

test('autofix passes use fresh source analysis and converge', async () => {
  const root = workspace()
  const eslint = linter(root, true)
  const [result] = await eslint.lintText('<div className="color:red margin:0 color:blue" />', { filePath: 'fix.mdx' })
  expect(result.output).toBe('<div className="margin:0 color:red" />')
  const [again] = await eslint.lintText(result.output!, { filePath: 'fix.mdx' })
  expect(again.messages).toEqual([])
  expect(again.output).toBeUndefined()
})
