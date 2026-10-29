import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { openTypeScriptProject, parseTypeScript } from './typescript-api.mjs'
import { isolateToolingTypeScript } from './isolate-tooling-typescript.mjs'

test('TS7 overlays preserve real imports and do not modify source', () => {
  const root = mkdtempSync(join(tmpdir(), 'master-ts7-overlay-'))
  const file = join(root, 'index.ts')
  const original = 'export const value = 1\n'
  writeFileSync(file, original)
  writeFileSync(join(root, 'dependency.ts'), 'export interface Item { value: number }\n')
  const session = openTypeScriptProject([file], { overlays: { [file]: 'import type { Item } from "./dependency"; export const item: Item = { value: 2 }' } })
  try {
    assert.ok(session.program.getSourceFileNames().some(name => name.endsWith('/dependency.ts')))
    assert.deepEqual(session.program.getSemanticDiagnostics(), [])
    assert.equal(readFileSync(file, 'utf8'), original)
    assert.ok(parseTypeScript(file, 'export const = ;').diagnostics.length > 0)
  } finally { session.close(); rmSync(root, { recursive: true, force: true }) }
})

test('legacy compiler installation is idempotent and leaves workspace compilers untouched', () => {
  const root = mkdtempSync(join(tmpdir(), 'master-ts-isolation-'))
  const modules = join(root, 'node_modules')
  const legacy = join(modules, 'typescript-legacy-api')
  const tool = join(modules, 'typescript-eslint')
  const workspace = join(root, 'workspace')
  const nestedTool = join(workspace, 'node_modules/typescript-eslint')
  for (const directory of [legacy, tool, workspace]) mkdirSync(directory, { recursive: true })
  writeFileSync(join(legacy, 'package.json'), JSON.stringify({ name: 'typescript', version: '6.0.3' }))
  writeFileSync(join(tool, 'package.json'), JSON.stringify({ name: 'typescript-eslint' }))
  writeFileSync(join(workspace, 'package.json'), JSON.stringify({ name: 'typescript-eslint' }))
  writeFileSync(join(root, 'package.json'), JSON.stringify({ workspaces: ['workspace'] }))
  mkdirSync(nestedTool, { recursive: true })
  writeFileSync(join(nestedTool, 'package.json'), JSON.stringify({ name: 'typescript-eslint' }))
  symlinkSync(workspace, join(modules, 'workspace'), process.platform === 'win32' ? 'junction' : 'dir')
  try {
    assert.equal(isolateToolingTypeScript(root), 2)
    assert.equal(isolateToolingTypeScript(root), 2)
    assert.equal(createRequire(join(tool, 'package.json'))('typescript/package.json').version, '6.0.3')
    assert.equal(createRequire(join(nestedTool, 'package.json'))('typescript/package.json').version, '6.0.3')
    assert.throws(() => readFileSync(join(workspace, 'node_modules/typescript/package.json')))
  } finally { rmSync(root, { recursive: true, force: true }) }
})
