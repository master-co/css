import { execSync } from 'child_process'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { rm } from 'css-shared/utils/fs'

it('init cjs', () => {
    const configFilepath = resolve(__dirname, 'master.css.js')
    rm(configFilepath)
    execSync('tsx ../../dist/bin/index.bundle.js init', { cwd: __dirname, stdio: 'inherit' })
    expect(readFileSync(configFilepath).toString()).toBe(require('../../src/master.css.js.txt'))
    rm(configFilepath)
})
