import { execSync } from 'child_process'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { rm } from 'css-shared/utils/fs'
import normalizeNewline from 'normalize-newline'

it('init (type="module")', () => {
    const configFilepath = resolve(__dirname, 'master.css.mjs')
    rm(configFilepath)
    execSync('node ../../dist/bin/index.bundle.js init', { cwd: __dirname, stdio: 'inherit' })
    expect(normalizeNewline(readFileSync(configFilepath, 'utf-8'))).toEqual(normalizeNewline(require('../../src/master.css.mjs.txt')))
    rm(configFilepath)
})