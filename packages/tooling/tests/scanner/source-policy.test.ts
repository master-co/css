import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { SourcePolicy } from '../../src/scanner/source-policy'

test('workspace and nested ignores, explicit inputs and output boundaries use one policy', () => {
  const root = mkdtempSync(join(tmpdir(), 'master-source-policy-'))
  try {
    mkdirSync(join(root, '.git'))
    const project = join(root, 'packages/app')
    mkdirSync(project, { recursive: true })
    writeFileSync(join(root, '.gitignore'), 'ignored/\n*.generated.ts\n')
    writeFileSync(join(project, '.gitignore'), '!keep.generated.ts\n')
    const policy = new SourcePolicy(project, { exclude: ['private/**'], outputDirectories: ['build-next'] })
    expect(policy.accepts('src/a.ts')).toBe(true)
    expect(policy.accepts('a.generated.ts')).toBe(false)
    expect(policy.accepts('keep.generated.ts')).toBe(true)
    expect(policy.accepts('ignored/a.ts')).toBe(false)
    expect(policy.accepts('node_modules/pkg/a.ts')).toBe(false)
    expect(policy.accepts('a.d.ts')).toBe(false)
    expect(policy.accepts('ignored/a.ts', true)).toBe(true)
    expect(policy.accepts('private/a.ts', true)).toBe(false)
    expect(policy.accepts('build-next/a.js', true)).toBe(false)
    expect(policy.accepts('.master/generated.css', true)).toBe(false)
    expect(policy.dependencies.has(join(root, '.gitignore'))).toBe(true)
    writeFileSync(join(project, '.gitignore'), 'src/\n')
    expect(policy.accepts('src/a.ts')).toBe(false)
  } finally { rmSync(root, { recursive: true, force: true }) }
})
