import { test, it, expect } from 'vitest'
import { execSync } from 'child_process'
import { rm } from 'shared/utils/fs'
import { join } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'

it('creates a new app', () => {
    rm(join(__dirname, 'dist'))
    execSync('tsx ../../src/bin dist', { cwd: __dirname })
    expect(existsSync(join(__dirname, 'dist/package.json'))).toBe(true)
}, 120000)

it('should install the remote dependencies', () => {
    expect(readFileSync(join(__dirname, 'dist/package.json')).toString()).not.toContain('workspace:^')
})
