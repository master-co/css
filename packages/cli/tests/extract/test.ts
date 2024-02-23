import { execaCommandSync } from 'execa'
import fs, { readFileSync } from 'fs'
import { join } from 'path'

it('basic extract', async () => {
    fs.rmSync(join(__dirname, '.virtual/master.css'), { force: true })
    fs.writeFileSync(join(__dirname, 'master.css.ts'), `
        export default {
            variables: {
                primary: '$(blue)'
            }
        }
    `, { flag: 'w' })
    execaCommandSync('tsx ../../src/bin extract', { cwd: __dirname })
    expect(readFileSync(join(__dirname, '.virtual/master.css')).toString()).toMatch(/(fg\\:primary|m\\:12x|text\\:center|font\\:sans|font\\:heavy|font\\:48)/)
})