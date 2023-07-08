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

export function waitForDataMatch(child: SpawndChildProcess, doesDataMatch: (data: string) => boolean) {
    return new Promise<void>((resolve, reject) => {
        let isDone = false
        const handler = (data) => {
            if (isDone) return
            if (doesDataMatch(data.toString())) {
                isDone = true
                child.stdout.off('data', handler)
                child.stderr.off('data', errorHandler)
                resolve()
            }
        }
        const errorHandler = (data) => {
            child.stdout.off('data', handler)
            child.stderr.off('data', errorHandler)
            reject(data.toString())
        }
        child.stdout.on('data', handler)
        child.stderr.on('data', errorHandler)
    })
}

it('start watch process', async () => {
    await waitForDataMatch(child, (data) => data.includes('Start watching source changes'))
    const fileCSSText = fs.readFileSync(path.join(__dirname, '.virtual/master.css'), { encoding: 'utf8' })
    expect(fileCSSText).toContain(cssEscape('font:heavy'))
    expect(fileCSSText).toContain(cssEscape('font:48'))
    expect(fileCSSText).toContain(cssEscape('bg:primary'))
    expect(fileCSSText).toContain(cssEscape('btn'))
})

it('change options file `fixed` and reset process', async () => {
    setTimeout(() => fs.writeFileSync(optionsFilepath, originOptionsText.replace('fixed: []', 'fixed: [\'fg:red\']')))
    await waitForDataMatch(child, (data) => data.includes('Restart watching source changes'))
    const fileCSSText = fs.readFileSync(path.join(__dirname, '.virtual/master.css'), { encoding: 'utf8' })
    expect(fileCSSText).toContain(cssEscape('fg:red'))
})

it('change config file `classes` and reset process', async () => {
    fs.writeFileSync(configFilepath, originConfigText.replace('bg:red', 'bg:blue'))
    await waitForDataMatch(child, (data) => data.includes('Restart watching source changes'))
    const fileCSSText = fs.readFileSync(path.join(__dirname, '.virtual/master.css'), { encoding: 'utf8' })
    expect(fileCSSText).toContain(cssEscape('bg:blue'))
})

it('change html file class attr and update', async () => {
    fs.writeFileSync(HTMLFilepath, originHTMLText.replace('hmr-test', 'text:underline'))
    await waitForDataMatch(child, (data) => data.includes('exported'))
    const fileCSSText = fs.readFileSync(path.join(__dirname, '.virtual/master.css'), { encoding: 'utf8' })
    /** There is no recycling mechanism during the development */
    expect(fileCSSText).toContain(cssEscape('text:underline'))
})

afterAll(async () => {
    await child.destroy()
}) 