import { execSync } from 'node:child_process'
import { rm } from 'css-shared/utils/fs'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

it('creates a new app', () => {
    rm(join(__dirname, 'my-app'))
    execSync('tsx ../../src/bin my-app', { cwd: __dirname })
    expect(existsSync(join(__dirname, 'my-app'))).toBe(true)
})