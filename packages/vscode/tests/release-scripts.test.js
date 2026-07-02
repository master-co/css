import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import { createVSCEPublishArgs } from '../scripts/package-target-core.js'
import { parseCLIArgs } from '../scripts/package-targets.js'
import { newStatusLines, unexpectedReleaseStatusLines } from '../scripts/release.js'

const here = dirname(fileURLToPath(import.meta.url))
const packageDir = resolve(here, '..')

test('publish accepts Azure credential authentication', () => {
    const options = parseCLIArgs(['publish', '--azure-credential', '--target', 'linux-x64'])

    expect(options).toMatchObject({
        command: 'publish',
        azureCredential: true,
        packageArgs: [],
        targets: ['linux-x64']
    })
    expect(createVSCEPublishArgs('/tmp/master-css-vscode.vsix', options)).toEqual([
        'publish',
        '--packagePath',
        '/tmp/master-css-vscode.vsix',
        '--azure-credential'
    ])
})

test('package rejects Azure credential authentication', () => {
    expect(() => parseCLIArgs(['package', '--azure-credential']))
        .toThrow('--azure-credential is only supported for publish')
})

test('release dry run reports Azure credential authentication', () => {
    const result = spawnSync(process.execPath, ['scripts/release.js', '--', '--dry-run', '--azure-credential'], {
        cwd: packageDir,
        encoding: 'utf8'
    })

    expect(result.stderr).toBe('')
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Authentication: Microsoft Entra ID')
})

test('release status guard ignores pre-existing dirty paths', () => {
    const baseline = [
        ' M packages/language/package.json',
        '?? local-notes.md'
    ]
    const current = [
        ...baseline,
        ' M packages/vscode/package.json',
        ' M pnpm-lock.yaml'
    ]

    expect(newStatusLines(current, baseline)).toEqual([
        ' M packages/vscode/package.json',
        ' M pnpm-lock.yaml'
    ])
    expect(unexpectedReleaseStatusLines(current, baseline)).toEqual([])
})

test('release status guard rejects newly dirty unexpected paths', () => {
    const baseline = [
        ' M packages/language/package.json'
    ]
    const current = [
        ...baseline,
        ' M packages/vscode/package.json',
        ' M pnpm-lock.yaml',
        ' M packages/vscode/data/generated.json'
    ]

    expect(unexpectedReleaseStatusLines(current, baseline)).toEqual([
        ' M packages/vscode/data/generated.json'
    ])
})
