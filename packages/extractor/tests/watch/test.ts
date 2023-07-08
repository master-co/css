/** require: `npm run dev` in root */

import fs from 'fs'
import path from 'path'
import cssEscape from 'shared/utils/css-escape'
import dedent from 'ts-dedent'
import { SpawndChildProcess, spawnd } from 'spawnd'

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

let child: SpawndChildProcess

beforeAll(() => {
    fs.writeFileSync(HTMLFilepath, originHTMLText, { flag: 'w' })
    fs.writeFileSync(optionsFilepath, originOptionsText, { flag: 'w' })
    fs.writeFileSync(configFilepath, originConfigText, { flag: 'w' })
    child = spawnd('tsx ../../../css/src/bin extract -w', { shell: true, cwd: __dirname })
})

it('start watch process', (done) => {
    child.stdout.on('data', (data) => {
        if (data.toString().includes('Start watching source changes')) {
            const fileCSSText = fs.readFileSync(path.join(__dirname, '.virtual/master.css'), { encoding: 'utf8' })
            expect(fileCSSText).toContain(cssEscape('font:heavy'))
            expect(fileCSSText).toContain(cssEscape('font:48'))
            expect(fileCSSText).toContain(cssEscape('bg:primary'))
            expect(fileCSSText).toContain(cssEscape('btn'))
            child.stdout.removeAllListeners()
            done()
        }
    })
}, 30000)

it('change options file `fixed` and reset process', (done) => {
    child.stdout.on('data', (data) => {
        if (data.toString().includes('Restart watching source changes')) {
            const fileCSSText = fs.readFileSync(path.join(__dirname, '.virtual/master.css'), { encoding: 'utf8' })
            expect(fileCSSText).toContain(cssEscape('fg:red'))
            child.stdout.removeAllListeners()
            done()
        }
    })
    fs.writeFileSync(optionsFilepath, originOptionsText.replace('fixed: []', 'fixed: [\'fg:red\']'))
}, 30000)

it('change config file `classes` and reset process', (done) => {
    child.stdout?.on('data', (data) => {
        if (data.toString().includes('Restart watching source changes')) {
            const fileCSSText = fs.readFileSync(path.join(__dirname, '.virtual/master.css'), { encoding: 'utf8' })
            expect(fileCSSText).toContain(cssEscape('bg:blue'))
            child.stdout.removeAllListeners()
            done()
        }
    })
    fs.writeFileSync(configFilepath, originConfigText.replace('bg:red', 'bg:blue'))
}, 30000)

it('change html file class attr and update', (done) => {
    child.stdout?.on('data', (data) => {
        if (data.toString().includes('exported')) {
            const fileCSSText = fs.readFileSync(path.join(__dirname, '.virtual/master.css'), { encoding: 'utf8' })
            /** There is no recycling mechanism during the development */
            expect(fileCSSText).toContain(cssEscape('text:underline'))
            child.stdout.removeAllListeners()
            done()
        }
    })
    fs.writeFileSync(HTMLFilepath, originHTMLText.replace('hmr-test', 'text:underline'))
}, 30000)

afterAll(async () => {
    await child.destroy()
}) 