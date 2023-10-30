import { execSync, spawnSync } from 'child_process'
import { CONFIG_TS_TEXT } from '../../src'
import { readFileSync } from 'fs'
import { join } from 'path'
import { rm } from 'css-shared/utils/fs'

it('init by tsconfig.json', () => {
    const configFilepath = join(__dirname, 'master.css.ts')
    rm(configFilepath)
    execSync('tsx ../../src/bin init', { cwd: __dirname, stdio: 'inherit' })
    expect(readFileSync(configFilepath).toString()).toBe(CONFIG_TS_TEXT)
    rm(configFilepath)
})