import stripAnsi from 'strip-ansi'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

it('checks config file', async () => {
    fs.writeFileSync(path.join(__dirname, 'test.html'), `
        <html>
            <head>
                <link rel="styleSheet">
            </head>
            <body>
                <h1 class="text:center ml:0&gt;:is(a,button):first font:32">Hello World</h1>
            </body>
        </html>
    `)
    const message = stripAnsi(execSync('tsx ../../src/bin render test.html --config ../config/extends/master-css.js', { cwd: __dirname }).toString())
    expect(message).toContain('✓ ../config/extends/master-css.js config file found')
}, 15000)