import { execSync } from 'child_process'
import { expectFileIncludes } from '../../../../utils/expect-file-includes'
import { OPTIONS_TS_TEXT } from '../../src'

it('init by tsconfig.json', () => {
    execSync('node ../../../css/dist/cjs/bin init -c -o', { cwd: __dirname }).toString()
    expectFileIncludes('master.css-compiler.ts', [OPTIONS_TS_TEXT])
})