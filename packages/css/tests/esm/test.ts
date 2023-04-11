import { execSync } from 'child_process'
import { expectFileIncludes } from '../../../../utils/expect-file-includes'
import { CONFIG_ESM_TEXT } from '../../src'

it('init (type="module")', () => {
    execSync('node ../../dist/cjs/bin init -o', { cwd: __dirname }).toString()
    expectFileIncludes('master.css.mjs', [CONFIG_ESM_TEXT])
})