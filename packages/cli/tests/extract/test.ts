import { execFileSync } from 'child_process'
import { createRequire } from 'module'
import fs, { readFileSync } from 'fs'
import { join, resolve } from 'path'
import { it, expect } from 'vitest'

const cliFilepath = resolve(__dirname, '../../src/bin/index.ts')
const tsxLoaderPath = createRequire(import.meta.url).resolve('tsx')

it('basic extract', async () => {
    fs.rmSync(join(__dirname, 'master.css'), { force: true })
    fs.writeFileSync(join(__dirname, 'master.css.ts'), `
        export default {
            variables: {
                primary: '$(blue)'
            }
        }
    `, { flag: 'w' })
    execFileSync(process.execPath, ['--import', tsxLoaderPath, cliFilepath, 'extract'], { cwd: __dirname })
    expect(readFileSync(join(__dirname, 'master.css')).toString()).toMatch(/(fg\\:primary|m\\:12x|text\\:center|font\\:sans|font\\:heavy|font\\:48)/)
})
