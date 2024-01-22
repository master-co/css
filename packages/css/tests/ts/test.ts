import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { rm } from 'css-shared/utils/fs'
import normalizeNewline from 'normalize-newline'

it('init by tsconfig.json', () => {
    const configFilepath = resolve(__dirname, 'master.css.ts')
    rm(configFilepath)
    execSync('tsx ../../dist/bin/index.bundle.js init', { cwd: __dirname, stdio: 'inherit' })
    expect(normalizeNewline(readFileSync(configFilepath, 'utf-8'))).toEqual(normalizeNewline(require('../../src/master.css.ts.txt')))
    rm(configFilepath)
})