import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { rm } from 'css-shared/utils/fs'

it('init by tsconfig.json', () => {
    const configFilepath = resolve(__dirname, 'master.css.ts')
    rm(configFilepath)
    execSync('tsx ../../dist/bin/index.bundle.js init', { cwd: __dirname, stdio: 'inherit' })
    expect(readFileSync(configFilepath, 'utf-8').normalize()).toEqual(require('../../src/master.css.ts.txt').normalize())
    rm(configFilepath)
})