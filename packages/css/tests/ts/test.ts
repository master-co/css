import { execSync } from 'child_process'
import { expectFileIncludes } from '../../../../utils/expect-file-includes'
import { CONFIG_ESM_TEXT } from '../../src'

it('init by tsconfig.json', () => {
    execSync('node ../../dist/cjs/bin init -c -o', { cwd: __dirname }).toString()
    expectFileIncludes('master.css.ts', [CONFIG_ESM_TEXT])
})