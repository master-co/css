import { execSync } from 'child_process'
import { expectFileIncludes } from '../../../../utils/expect-file-includes'
import { OPTIONS_TEXT } from '../../src'

it('init cjs', () => {
    execSync('node ../../../css/dist/cjs/bin init -c -o', { cwd: __dirname }).toString()
    expectFileIncludes('master.css-compiler.js', [OPTIONS_TEXT])
})