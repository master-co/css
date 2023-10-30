import { execSync, spawnSync } from 'child_process'
import { CONFIG_ESM_TEXT } from '../../src'
import { join } from 'path'
import { readFileSync } from 'fs'
import { rm } from 'css-shared/utils/fs'

it('init (type="module")', () => {
    const configFilepath = join(__dirname, 'master.css.mjs')
    rm(configFilepath)
    execSync('tsx ../../src/bin init', { cwd: __dirname, stdio: 'inherit' })
    expect(readFileSync(configFilepath).toString()).toBe(CONFIG_ESM_TEXT)
    rm(configFilepath)
})