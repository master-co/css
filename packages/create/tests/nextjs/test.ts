import { test, it, expect } from 'vitest'
import { execSync } from 'child_process'
import { rm } from 'shared/utils/fs'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

it('creates a new app', () => {
    rm(join(__dirname, 'master.css'))
    execSync('tsx ../../src/bin', { cwd: __dirname })
    expect(existsSync(join(__dirname, 'master.css'))).toBe(true)
})
