import { exec, ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'
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

const resolvedExtractorOptionsPath = path.resolve(__dirname, 'master.css-extractor.ts')
const originalExtractorOptions = `import type { Options } from '@master/css-extractor'
const options: Options = {
    include: ['test.html'],
    classes: {
        fixed: [],
        ignored: []
    }
}

export default options
`

const resolvedConfigPath = path.resolve(__dirname, 'master.css.ts')
const originalCSSConfig = `import type { Config } from '@master/css'
const config: Config = {
    classes: {
        btn: 'bg:red'
    },
    colors: {
        primary: 'blue'
    },
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

it('mcss extract -w', (done) => {
    fs.writeFileSync(htmlPath, originalHtml, { flag: 'w' })
    fs.writeFileSync(resolvedExtractorOptionsPath, originalExtractorOptions, { flag: 'w' })
    fs.writeFileSync(resolvedConfigPath, originalCSSConfig, { flag: 'w' })
    child = exec('tsx ../../src/bin extract -w', { cwd: __dirname })
    let step = 0
    let watchReady = false
    child.stdout?.on('data', async data => {
        if (data.includes('Start watching source changes')) {
            watchReady = true
        } else if (!watchReady) {
            return
        }
        const fileCSSText = fs.readFileSync(path.join(__dirname, 'master.css'), { encoding: 'utf8' })
        expect(fileCSSText).toContain(CSS.escape('font:heavy'))
        expect(fileCSSText).toContain(CSS.escape('font:48'))
        expect(fileCSSText).toContain(CSS.escape('bg:primary'))
        expect(fileCSSText).toContain(CSS.escape('btn'))
        if (step === 0) {
            // add fixed class names
            fs.writeFileSync(resolvedExtractorOptionsPath, originalExtractorOptions.replace('fixed: []', 'fixed: [\'f:red\']'))
            step++
        } else {
            if (data.includes('exported in master.css')) {
                // expect fixed class names to be added
                expect(fileCSSText).toContain(CSS.escape('f:red'))

                switch (step) {
                    case 1:
                        // change master.css.* bg:red -> bg:blue
                        fs.writeFileSync(resolvedConfigPath, originalCSSConfig.replace('bg:red', 'bg:blue'))
                        step++
                        break
                    case 2:
                        expect(fileCSSText).not.toContain(CSS.escape('bg:red'))
                        expect(fileCSSText).toContain(CSS.escape('bg:blue'))

                        // change test.html hmr-test -> f:96
                        fs.writeFileSync(htmlPath, originalHtml.replace('hmr-test', 'f:96'))
                        step++
                        break
                    case 3:
                        expect(fileCSSText).toContain(CSS.escape('f:96'))
                        done()
                        break
                }
            }
        }
    })
}, 30000)

afterAll(() => {
    child.stdout?.destroy()
    child.stdin?.destroy()
    child.kill()
}, 30000) // 30s timeout for the slow windows OS