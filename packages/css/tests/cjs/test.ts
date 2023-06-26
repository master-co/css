import { execSync } from 'child_process'
import { expectFileIncludes } from 'shared/test/expect-file-includes'
import { CONFIG_TEXT } from '../../src'

it('init cjs', () => {
    execSync('tsx ../../src/bin init -o', { cwd: __dirname })
    expectFileIncludes('master.css.js', [CONFIG_TEXT])
})
