import { spawnSync } from 'child_process'
import { CONFIG_TS_TEXT } from '../../src'
import { readFileSync } from 'fs'
import { join } from 'path'

it('init by tsconfig.json', () => {
    spawnSync('tsx ../../src/bin init -o', { cwd: __dirname }).toString()
    expect(readFileSync(join(__dirname, 'master.css.ts')).toString()).toBe(CONFIG_TS_TEXT)
})