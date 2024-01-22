import { execSync, spawnSync } from 'child_process'
import { join } from 'path'
import { readFileSync } from 'fs'
import { rm } from 'css-shared/utils/fs'

it('init cjs', () => {
    const configFilepath = join(__dirname, 'master.css.js')
    rm(configFilepath)
    execSync('node ../../dist/bin/index.bundle.js init', { cwd: __dirname, stdio: 'inherit' })
    expect(readFileSync(configFilepath).toString()).toBe(require('../../src/master.css.js.txt'))
    rm(configFilepath)
})
