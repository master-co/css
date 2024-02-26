import { execSync } from 'child_process'
import { join } from 'node:path'
import { readFileSync } from 'node:fs'
import { rm } from 'css-shared/utils/fs'

it('init by tsconfig.json', () => {
    rm(join(__dirname, 'master.css.ts'))
    execSync('tsx ../../src/bin', { cwd: __dirname })
    expect(readFileSync(join(__dirname, 'master.css.ts'), 'utf-8')).toEqual(require('../../src/master.css.ts.js').default)
})