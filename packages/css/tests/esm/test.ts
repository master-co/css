import { spawnSync } from 'child_process'
import { expectFileIncludes } from 'shared/test/expect-file-includes'
import { CONFIG_ESM_TEXT } from '../../src'

it('init (type="module")', () => {
    spawnSync('tsx ../../src/bin init -o', { cwd: __dirname }).toString()
    expectFileIncludes('master.css.mjs', [CONFIG_ESM_TEXT])
})