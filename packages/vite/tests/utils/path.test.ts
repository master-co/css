import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { normalizePath } from 'vite'
import { expect, test } from 'vitest'
import { includesFile, normalizeFilePath } from '../../src/utils/path'

test('deleted dependency paths retain their identity through an existing directory alias', () => {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), 'master-css-path-')))
  const directory = join(root, 'sources'), alias = join(root, 'alias')
  const file = join(directory, 'nested', 'tokens.scss'), aliasedFile = join(alias, 'nested', 'tokens.scss')
  try {
    mkdirSync(join(directory, 'nested'), { recursive: true })
    symlinkSync(directory, alias, process.platform === 'win32' ? 'junction' : 'dir')
    writeFileSync(file, '$color:red')
    const identity = normalizeFilePath(aliasedFile)
    expect(identity).toBe(normalizePath(file))
    rmSync(join(directory, 'nested'), { recursive: true })
    expect(normalizeFilePath(aliasedFile)).toBe(identity)
    expect(includesFile([identity], aliasedFile)).toBe(true)
    mkdirSync(join(directory, 'nested'))
    writeFileSync(file, '$color:blue')
    expect(normalizeFilePath(aliasedFile)).toBe(identity)
  } finally { rmSync(root, { recursive: true, force: true }) }
})
