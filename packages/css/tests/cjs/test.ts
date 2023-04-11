import { execSync } from 'child_process'
import { expectFileIncludes } from '../../../../utils/expect-file-includes'
import { CONFIG_TEXT } from '../../src'

it('init cjs', () => {
    execSync('node ../../dist/cjs/bin init -o', { cwd: __dirname })
    expectFileIncludes('master.css.js', [CONFIG_TEXT])
})
