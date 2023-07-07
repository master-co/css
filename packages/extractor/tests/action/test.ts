import { expectFileIncludes } from 'shared/test/expect-file-includes'
import cssEscape from 'shared/utils/css-escape'
import fs from 'fs'
import path from 'path'
import action from '../../src/actions/main'

it('basic extract', async () => {
    fs.rmSync(path.join(__dirname, '.virtual/master.css'), { force: true })
    fs.writeFileSync(path.join(__dirname, 'master.css.ts'), `
        export default {
            colors: {
                primary: 'blue'
            }
        }
    `, { flag: 'w' })
    await action([], { cwd: __dirname })
    expectFileIncludes('.virtual/master.css', [
        cssEscape('fg:primary'),
        cssEscape('m:50'),
        cssEscape('text:center'),
        cssEscape('font:sans'),
        cssEscape('font:heavy'),
        cssEscape('font:48')
    ])
})