import { execSync } from 'node:child_process'
import { join } from 'node:path'
import { readFileSync } from 'node:fs'
import { rm } from 'css-shared/utils/fs'

it('init cjs', () => {
    rm(join(__dirname, 'master.css.js'))
    execSync('tsx ../../src/bin', { cwd: __dirname })
    expect(readFileSync(join(__dirname, 'master.css.js'), 'utf-8')).toEqual(require('../../src/master.css.js.js').default)
})
