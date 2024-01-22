import { execSync } from 'child_process'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { rm } from 'css-shared/utils/fs'

it('init (type="module")', () => {
    const configFilepath = resolve(__dirname, 'master.css.mjs')
    rm(configFilepath)
    execSync('tsx ../../dist/bin/index.bundle.js init', { cwd: __dirname, stdio: 'inherit' })
    expect(readFileSync(configFilepath, 'utf-8').toString()).toBe(require('../../src/master.css.mjs.txt'))
    rm(configFilepath)
})