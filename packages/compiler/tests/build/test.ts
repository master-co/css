import { execSync } from 'child_process'
import { expectFileIncludes } from '../../../../utils/expect-file-includes'
import '../../../css/src/polyfills/css-escape'

it('build master.css', () => {
    execSync('node ../../../css/dist/cjs/bin init -c -o --format esm', { cwd: __dirname })
    execSync('node ../../../css/dist/cjs/bin', { cwd: __dirname })
    expectFileIncludes('master.css', [
        CSS.escape('fg:primary'),
        CSS.escape('m:50'),
        CSS.escape('text:center'),
        CSS.escape('font:sans'),
        CSS.escape('font:heavy'),
        CSS.escape('font:48')
    ])
})