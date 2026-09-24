import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import {
  discoverBuildWorkspaceDirectories,
  discoverBuildWorkspaceDirectoriesSync
} from '../src/workspace-directories'

test('ignores generated Master CSS directories when discovering workspaces', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-css-workspaces-'))
  try {
    const app = join(root, 'app')
    const generated = join(root, '.master', 'stylesheets', 'revision')
    mkdirSync(app, { recursive: true })
    mkdirSync(generated, { recursive: true })
    const packageJSON = JSON.stringify({ dependencies: { '@master/css': 'workspace:*' } })
    writeFileSync(join(app, 'package.json'), packageJSON)
    writeFileSync(join(generated, 'package.json'), packageJSON)

    expect(discoverBuildWorkspaceDirectoriesSync(root)).toStrictEqual([app, root].sort())
    await expect(discoverBuildWorkspaceDirectories(root)).resolves.toStrictEqual([app, root].sort())
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
