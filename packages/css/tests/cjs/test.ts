import { spawnSync } from 'child_process'
import { expectFileIncludes } from 'shared/test/expect-file-includes'
import { CONFIG_TEXT } from '../../src'

it('init cjs', () => {
    spawnSync('tsx ../../src/bin init -o', { cwd: __dirname })
    expectFileIncludes('master.css.js', [CONFIG_TEXT])
})
