import { exec, ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'
import { expectFileIncludes } from '../../../../utils/expect-file-includes'
import '../../../css/src/polyfills/css-escape'
import dedent from 'ts-dedent'

const htmlPath = path.resolve(__dirname, 'test.html')
const originalHtml = dedent`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
        <h1 class="font:heavy font:48 btn hmr-test">Hello World</h1>
        <button class="bg:primary">Submit</button>
    </body>
    </html>
`

const cssCompilerConfigPath = path.resolve(__dirname, 'master.css-compiler.ts')
const originalCssCompilerConfig = `import type { Options } from '@master/css-compiler'
const options: Options = {
    include: ['test.html'],
    classes: {
        fixed: [],
        ignored: []
    }
}

export default options
`

const cssConfigPath = path.resolve(__dirname, 'master.css.ts')
const originalCssConfig = `import type { Config } from '@master/css'
const config: Config = {
    classes: {
        btn: 'bg:red'
    },
    colors: {},
    themes: {},
    rules: {},
    values: {},
    semantics: {},
    breakpoints: {},
    mediaQueries: {},
    keyframes: {},
    selectors: {},
    functions: {}
}

export default config
`

let child: ChildProcess
it('watch master.css', (done) => {
    fs.writeFileSync(htmlPath, originalHtml)
    fs.writeFileSync(cssCompilerConfigPath, originalCssCompilerConfig)
    fs.writeFileSync(cssConfigPath, originalCssConfig)

    child = exec('node ../../../css/dist/cjs/bin -w', { cwd: __dirname })

    let step = 0
    child.stdout?.on('data', async data => {
        console.log(data, step)
        if (step === 3) {
            if (/.*?compile.*?f:96/.test(data)) {
                expectFileIncludes('master.css', [
                    CSS.escape('font:heavy'),
                    CSS.escape('font:48'),
                    CSS.escape('bg:primary'),
                    CSS.escape('btn'),
                    CSS.escape('f:red'),
                    CSS.escape('bg:blue'),
                    CSS.escape('f:96')
                ])
                done()
            }
        } else if (/.*?sources.*?test\.html/.test(data)) {
            switch (step) {
                case 0:
                    expectFileIncludes('master.css', [
                        CSS.escape('font:heavy'),
                        CSS.escape('font:48'),
                        CSS.escape('bg:primary'),
                        CSS.escape('btn')
                    ])
                    // change compiler config
                    setTimeout(() => {
                        fs.writeFileSync(cssCompilerConfigPath, originalCssCompilerConfig.replace('fixed: []', 'fixed: [\'f:red\']'))
                    }, 1000)
                    break
                case 1:
                    expectFileIncludes('master.css', [
                        CSS.escape('font:heavy'),
                        CSS.escape('font:48'),
                        CSS.escape('bg:primary'),
                        CSS.escape('btn'),
                        CSS.escape('f:red')
                    ])
                    // change css config
                    setTimeout(() => {
                        fs.writeFileSync(cssConfigPath, originalCssConfig.replace('bg:red', 'bg:blue'))
                    }, 1000)
                    break
                case 2:
                    expectFileIncludes('master.css', [
                        CSS.escape('font:heavy'),
                        CSS.escape('font:48'),
                        CSS.escape('bg:primary'),
                        CSS.escape('btn'),
                        CSS.escape('f:red'),
                        CSS.escape('bg:blue')
                    ])
                    // change index html
                    setTimeout(() => {
                        fs.writeFileSync(htmlPath, originalHtml.replace('hmr-test', 'f:96'))
                    }, 1000)
                    break
            }
            step++
        }
    })
}, 30000)

afterAll(() => {
    child.stdout?.destroy()
    child.stdin?.destroy()
    child.kill()
}, 30000) // 30s timeout for the slow windows OS