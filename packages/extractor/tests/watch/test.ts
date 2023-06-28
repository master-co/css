import { exec, ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'
import '../../../css/src/polyfills/css-escape'
import dedent from 'ts-dedent'

const HTMLFilepath = path.resolve(__dirname, 'test.html')
const originHTMLText = dedent`
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

const optionsFilepath = path.resolve(__dirname, 'master.css-extractor.ts')
const originOptionsText = `import type { Options } from '@master/css-extractor'
const options: Options = {
    classes: {
        fixed: [],
        ignored: []
    }
}

export default options
`

const configFilepath = path.resolve(__dirname, 'master.css.ts')
const originConfigText = `import type { Config } from '@master/css'
const config: Config = {
    classes: {
        btn: 'bg:red'
    },
    colors: {
        primary: 'blue'
    },
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

beforeAll(() => {
    fs.writeFileSync(HTMLFilepath, originHTMLText, { flag: 'w' })
    fs.writeFileSync(optionsFilepath, originOptionsText, { flag: 'w' })
    fs.writeFileSync(configFilepath, originConfigText, { flag: 'w' })
    child = exec('tsx ../../src/bin extract -w', { cwd: __dirname })
})

describe('extract watch', () => {

    it('start watch process', (done) => {
        const handle = data => {
            if (data.includes('Start watching source changes')) {
                const fileCSSText = fs.readFileSync(path.join(__dirname, 'master.css'), { encoding: 'utf8' })
                expect(fileCSSText).toContain(CSS.escape('font:heavy'))
                expect(fileCSSText).toContain(CSS.escape('font:48'))
                expect(fileCSSText).toContain(CSS.escape('bg:primary'))
                expect(fileCSSText).toContain(CSS.escape('btn'))
                child.stdout?.off('data', handle)
                done()
            }
        }
        child.stdout?.on('data', handle)
    })

    it('change options file `fixed` and reset process', (done) => {
        const handle = data => {
            if (data.includes('Restart watching source changes')) {
                const fileCSSText = fs.readFileSync(path.join(__dirname, 'master.css'), { encoding: 'utf8' })
                expect(fileCSSText).toContain(CSS.escape('fg:red'))
                child.stdout?.off('data', handle)
                done()
            }
        }
        child.stdout?.on('data', handle)
        fs.writeFileSync(optionsFilepath, originOptionsText.replace('fixed: []', 'fixed: [\'fg:red\']'))
    })

    it('change config file `classes` and reset process', (done) => {
        const handle = data => {
            if (data.includes('Restart watching source changes')) {
                const fileCSSText = fs.readFileSync(path.join(__dirname, 'master.css'), { encoding: 'utf8' })
                expect(fileCSSText).toContain(CSS.escape('bg:blue'))
                child.stdout?.off('data', handle)
                done()
            }
        }
        child.stdout?.on('data', handle)
        fs.writeFileSync(configFilepath, originConfigText.replace('bg:red', 'bg:blue'))
    })

    it('change html file class attr and update', (done) => {
        const handle = data => {
            console.log(data)
            if (data.includes('exported')) {
                const fileCSSText = fs.readFileSync(path.join(__dirname, 'master.css'), { encoding: 'utf8' })
                /** There is no recycling mechanism during the development */
                expect(fileCSSText).toContain(CSS.escape('text:underline'))
                child.stdout?.off('data', handle)
                done()
            }
        }
        child.stdout?.on('data', handle)
        fs.writeFileSync(HTMLFilepath, originHTMLText.replace('hmr-test', 'text:underline'))
    })
})

afterAll(() => {
    child.stdout?.destroy()
    child.stdin?.destroy()
    child.kill()
}, 30000) // 30s timeout for the slow windows OS