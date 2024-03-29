import { execSync } from 'child_process'
import { join } from 'node:path'
import { readFileSync } from 'node:fs'
import { rm } from 'css-shared/utils/fs'

it('init (type="module")', () => {
    rm(join(__dirname, 'master.css.mjs'))
    execSync('tsx ../../src/bin', { cwd: __dirname })
    expect(readFileSync(join(__dirname, 'master.css.mjs'), 'utf-8')).toEqual(require('../../src/master.css.mjs.js').default)
})