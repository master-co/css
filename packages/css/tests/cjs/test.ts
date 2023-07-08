import { spawnSync } from 'child_process'
import { CONFIG_TEXT } from '../../src'
import { join } from 'path'
import { readFileSync } from 'fs'

it('init cjs', () => {
    spawnSync('tsx ../../src/bin init -o', { cwd: __dirname })
    expect(readFileSync(join(__dirname, 'master.css.js')).toString()).toBe(CONFIG_TEXT)
})
