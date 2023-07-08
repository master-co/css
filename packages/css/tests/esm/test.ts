import { spawnSync } from 'child_process'
import { CONFIG_ESM_TEXT } from '../../src'
import { join } from 'path'
import { readFileSync } from 'fs'

it('init (type="module")', () => {
    spawnSync('tsx ../../src/bin init -o', { cwd: __dirname }).toString()
    expect(readFileSync(join(__dirname, 'master.css.mjs')).toString()).toBe(CONFIG_ESM_TEXT)
})