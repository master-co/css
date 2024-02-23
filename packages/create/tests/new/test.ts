import { execaCommandSync } from 'execa'
import { rm } from 'css-shared/utils/fs'
import { join } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'

it('creates a new app', () => {
    rm(join(__dirname, 'my-app'))
    execaCommandSync('tsx ../../src/bin my-app', { cwd: __dirname })
    expect(existsSync(join(__dirname, 'my-app/package.json'))).toBe(true)
})

it('should install the remote dependencies', () => {
    expect(readFileSync(join(__dirname, 'my-app/package.json')).toString()).not.toContain('workspace:^')
})