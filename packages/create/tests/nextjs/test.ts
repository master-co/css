import { it, expect } from 'vitest'
import { execSync } from 'child_process'
import { rm } from 'shared/utils/fs'
import { join } from 'node:path'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

it('creates a new app and ignores Next extract output', () => {
    const masterCSSPath = join(__dirname, 'master.css')
    rm(masterCSSPath)
    const gitignorePath = join(__dirname, '.gitignore')
    const originalGitignore = readFileSync(gitignorePath, 'utf-8')
    writeFileSync(
        gitignorePath,
        originalGitignore
            .split(/\r?\n/)
            .filter((line) => line.trim() !== '.master')
            .join('\n')
    )
    try {
        execSync('tsx ../../src/bin', { cwd: __dirname })
        expect(existsSync(masterCSSPath)).toBe(true)
        expect(readFileSync(gitignorePath, 'utf-8').split(/\r?\n/)).toContain('.master')
    } finally {
        rm(masterCSSPath)
        writeFileSync(gitignorePath, originalGitignore)
    }
})
