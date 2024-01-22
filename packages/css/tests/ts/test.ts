import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'
import { rm } from 'css-shared/utils/fs'

it('init by tsconfig.json', () => {
    const configFilepath = join(__dirname, 'master.css.ts')
    rm(configFilepath)
    execSync('node ../../dist/bin/index.bundle.js init', { cwd: __dirname, stdio: 'inherit' })
    expect(readFileSync(configFilepath).toString()).toBe(require('../../src/master.css.ts.txt'))
    rm(configFilepath)
})