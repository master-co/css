/** require: `npm run dev` in root */

import fs from 'fs'
import path from 'upath'
import cssEscape from 'shared/utils/css-escape'
import waitForDataMatch from 'shared/utils/wait-for-data-match'
import dedent from 'ts-dedent'
import { it, beforeAll, afterAll, expect } from 'vitest'
import { execa, Subprocess } from 'execa'

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
    includeClasses: [],
    excludeClasses: [],
}

export default options
`

const configFilepath = path.join(__dirname, 'master.css.ts')
const originConfigText = `import type { Config } from '@master/css'
const config: Config = {
    components: {
        btn: 'bg:red'
    },
    variables: {
        primary: '$(blue)'
    }
}

export default config
`

const virtualCSSFilepath = path.join(__dirname, '.virtual/master.css')

let subprocess: Subprocess

beforeAll(() => {
    fs.writeFileSync(HTMLFilepath, originHTMLText, { flag: 'w+' })
    fs.writeFileSync(optionsFilepath, originOptionsText, { flag: 'w+' })
    fs.writeFileSync(configFilepath, originConfigText, { flag: 'w+' })
    subprocess = execa('tsx ../../../src/bin extract -w', { shell: true, cwd: __dirname })
}, 120000)

it('start watch process', async () => {
    await Promise.all([
        waitForDataMatch(subprocess, (data) => data.includes('Start watching source changes')),
        waitForDataMatch(subprocess, (data) => data.includes('exported'))
    ])
    const fileCSSText = fs.readFileSync(virtualCSSFilepath, { encoding: 'utf8' })
    expect(fileCSSText).toContain(cssEscape('font:heavy'))
    expect(fileCSSText).toContain(cssEscape('font:48'))
    expect(fileCSSText).toContain(cssEscape('bg:primary'))
    expect(fileCSSText).toContain(cssEscape('btn'))
}, 120000)

it('change options file `includeClasses` and reset process', async () => {
    await Promise.all([
        waitForDataMatch(subprocess, (data) => data.includes('watching source changes'), async () => {
            fs.writeFileSync(optionsFilepath, originOptionsText.replace('includeClasses: []', 'includeClasses: [\'fg:red\']'))
        }),
        waitForDataMatch(subprocess, (data) => data.includes(`inserted 'fg:red'`)),
        waitForDataMatch(subprocess, (data) => data.includes('exported')),
    ])
    const fileCSSText = fs.readFileSync(virtualCSSFilepath, { encoding: 'utf8' })
    expect(fileCSSText).toContain(cssEscape('fg:red'))
}, 120000)

// todo: fix this test on CI
if (!process.env.CI) {
    it('change config file `components` and reset process', async () => {
        await Promise.all([
            waitForDataMatch(subprocess, (data) => data.includes('watching source changes'), async () => {
                fs.writeFileSync(configFilepath, originConfigText.replace('bg:red', 'bg:blue'))
            }),
            waitForDataMatch(subprocess, (data) => data.includes('exported'))
        ])
        const fileCSSText = fs.readFileSync(virtualCSSFilepath, { encoding: 'utf8' })
        expect(fileCSSText).toContain('.btn{background-color:rgb(var(--blue))')
    }, 120000)

    it('change html file class attr and update', async () => {
        await Promise.all([
            waitForDataMatch(subprocess, (data) => data.includes('watching source changes'), () => {
                fs.writeFileSync(HTMLFilepath, originHTMLText.replace('hmr-test', 'text:underline'))
            }),
            waitForDataMatch(subprocess, (data) => data.includes(`classes inserted`)),
            waitForDataMatch(subprocess, (data) => data.includes('exported'))
        ])
        const fileCSSText = fs.readFileSync(virtualCSSFilepath, { encoding: 'utf8' })
        expect(fileCSSText).toContain(cssEscape('text:underline'))
    }, 120000)
}

afterAll(async () => {
    subprocess.kill()
}, 120000)