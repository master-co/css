import { execSync } from 'child_process'
import fs, { readFileSync } from 'fs'
import path, { join } from 'path'

it('basic extract', async () => {
    fs.rmSync(path.join(__dirname, '.virtual/master.css'), { force: true })
    fs.writeFileSync(path.join(__dirname, 'master.css.ts'), `
        export default {
            variables: {
                primary: '$(blue)'
            }
        }
    `, { flag: 'w' })
    execSync('tsx ../../src/bin extract', { cwd: __dirname })
    expect(readFileSync(join(__dirname, '.virtual/master.css')).toString()).toMatch(/(fg\\:primary|m\\:12x|text\\:center|font\\:sans|font\\:heavy|font\\:48)/)
})