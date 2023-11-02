import fs, { readFileSync } from 'fs'
import path, { join } from 'path'
import action from '../../src/actions/main'

it('basic extract', async () => {
    fs.rmSync(path.join(__dirname, '.virtual/master.css'), { force: true })
    fs.writeFileSync(path.join(__dirname, 'master.css.ts'), `
        export default {
            variables: {
                primary: 'blue'
            }
        }
    `, { flag: 'w' })
    await action([], { cwd: __dirname })
    expect(readFileSync(join(__dirname, '.virtual/master.css')).toString()).toMatch(/(fg\\:primary|m\\:50|text\\:center|font\\:sans|font\\:heavy|font\\:48)/)
})