import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import detectPackageManager from '../src/detect-package-manager'

let tempDirectories: string[] = []

afterEach(() => {
    for (const directory of tempDirectories) {
        rmSync(directory, { recursive: true, force: true })
    }
    tempDirectories = []
})

function createTempDirectory() {
    const directory = mkdtempSync(join(tmpdir(), 'master-create-'))
    tempDirectories.push(directory)
    return directory
}

it('detects a package manager from an ancestor packageManager field', async () => {
    const root = createTempDirectory()
    const nested = join(root, 'packages/create/tests/new')
    mkdirSync(nested, { recursive: true })
    writeFileSync(join(root, 'package.json'), JSON.stringify({ packageManager: 'pnpm@10.33.2' }))

    expect(await detectPackageManager(nested)).toBe('pnpm')
})

it('detects a package manager from an ancestor lockfile', async () => {
    const root = createTempDirectory()
    const nested = join(root, 'packages/create/tests/new')
    mkdirSync(nested, { recursive: true })
    writeFileSync(join(root, 'pnpm-lock.yaml'), '')

    expect(await detectPackageManager(nested)).toBe('pnpm')
})
