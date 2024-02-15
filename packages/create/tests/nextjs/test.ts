import { execSync } from 'node:child_process'
import { rm } from 'css-shared/utils/fs'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

it('creates a new app', () => {
    rm(join(__dirname, 'master.css.js'))
    execSync('tsx ../../src/bin', { cwd: __dirname })
    expect(existsSync(join(__dirname, 'master.css.js'))).toBe(true)
})