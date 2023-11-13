/** require: `npm run dev` in root */

import fs from 'fs'
import path from 'upath'
import cssEscape from 'css-shared/utils/css-escape'
import waitForDataMatch from 'css-shared/utils/wait-for-data-match'
import dedent from 'ts-dedent'
import { SpawndChildProcess, spawnd } from 'spawnd'

const HTMLFilepath = path.join(__dirname, 'test.html')
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

const optionsFilepath = path.join(__dirname, 'master.css-extractor.ts')
const originOptionsText = `import type { Options } from '@master/css-extractor'
const options: Options = {
    classes: {
        fixed: [],
        ignored: []
    }
}

export default options
`

const configFilepath = path.join(__dirname, 'master.css.ts')
const originConfigText = `import type { Config } from '@master/css'
const config: Config = {
    styles: {
        btn: 'bg:red'
    },
    variables: {
        primary: '$(blue)'
    },
    rules: {},
    semantics: {},
    mediaQueries: {},
    animations: {},
    selectors: {},
    functions: {}
}

export default config
`

const virtualCSSFilepath = path.join(__dirname, '.virtual/master.css')

let child: SpawndChildProcess

beforeAll(() => {
    fs.writeFileSync(HTMLFilepath, originHTMLText)
    fs.writeFileSync(optionsFilepath, originOptionsText)
    fs.writeFileSync(configFilepath, originConfigText)

    child = spawnd('tsx ../../../css/src/bin extract -w', { shell: true, cwd: __dirname })
}, 120000)

it('start watch process', async () => {
    await waitForDataMatch(child, (data) => data.includes('Start watching source changes'))
    const fileCSSText = fs.readFileSync(virtualCSSFilepath, { encoding: 'utf8' })
    expect(fileCSSText).toContain(cssEscape('font:heavy'))
    expect(fileCSSText).toContain(cssEscape('font:48'))
    expect(fileCSSText).toContain(cssEscape('bg:primary'))
    expect(fileCSSText).toContain(cssEscape('btn'))
}, 120000)

it('change options file `fixed` and reset process', async () => {
    await waitForDataMatch(child, (data) => data.includes('Restart watching source changes'), async () => {
        fs.writeFileSync(optionsFilepath, originOptionsText.replace('fixed: []', 'fixed: [\'fg:red\']'))
    })
    const fileCSSText = fs.readFileSync(virtualCSSFilepath, { encoding: 'utf8' })
    expect(fileCSSText).toContain(cssEscape('fg:red'))
}, 120000)

it('change config file `styles` and reset process', async () => {
    await waitForDataMatch(child, (data) => data.includes('Restart watching source changes'), async () => {
        fs.writeFileSync(configFilepath, originConfigText.replace('bg:red', 'bg:blue'))
    })
    const fileCSSText = fs.readFileSync(virtualCSSFilepath, { encoding: 'utf8' })
    expect(fileCSSText).toContain(cssEscape('bg:blue'))
}, 120000)

it('change html file class attr and update', async () => {
    await waitForDataMatch(child, (data) => data.includes('exported'), async () => {
        fs.writeFileSync(HTMLFilepath, originHTMLText.replace('hmr-test', 'text:underline'))
    })
    const fileCSSText = fs.readFileSync(virtualCSSFilepath, { encoding: 'utf8' })
    /** There is no recycling mechanism during the development */
    expect(fileCSSText).toContain(cssEscape('text:underline'))
}, 120000)

afterAll(async () => {
    await child.destroy()
}, 120000)