import { execSync, spawnSync } from 'child_process'
import { CONFIG_TEXT } from '../../src'
import { join } from 'path'
import { readFileSync } from 'fs'
import { rm } from 'shared/utils/fs'

it('init cjs', () => {
    const configFilepath = join(__dirname, 'master.css.js')
    rm(configFilepath)
    execSync('tsx ../../src/bin init', { cwd: __dirname, stdio: 'inherit' })
    expect(readFileSync(configFilepath).toString()).toBe(CONFIG_TEXT)
    rm(configFilepath)
})
