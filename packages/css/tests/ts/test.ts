import { spawnSync } from 'child_process'
import { expectFileIncludes } from 'shared/test/expect-file-includes'
import { CONFIG_TS_TEXT } from '../../src'

it('init by tsconfig.json', () => {
    spawnSync('tsx ../../src/bin init -o', { cwd: __dirname }).toString()
    expectFileIncludes('master.css.ts', [CONFIG_TS_TEXT])
})