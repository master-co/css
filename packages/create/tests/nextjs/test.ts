import { execSync } from 'child_process'
import { rm } from 'css-shared/utils/fs'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

it('creates a new app', () => {
    rm(join(__dirname, 'master.css.ts'))
    execSync('tsx ../../src/bin', { cwd: __dirname })
    expect(existsSync(join(__dirname, 'master.css.ts'))).toBe(true)
})