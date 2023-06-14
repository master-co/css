import { execSync } from 'child_process'
import { expectFileIncludes } from 'shared/test/expect-file-includes'
import '../../../css/src/polyfills/css-escape'
import fs from 'fs'
import path from 'path'

it('basic extract', () => {
    fs.rmSync(path.join(__dirname, 'master.css'), { force: true })
    execSync('tsx ../../src/bin extract', { cwd: __dirname })
    expectFileIncludes('master.css', [
        CSS.escape('fg:primary'),
        CSS.escape('m:50'),
        CSS.escape('text:center'),
        CSS.escape('font:sans'),
        CSS.escape('font:heavy'),
        CSS.escape('font:48')
    ])
})