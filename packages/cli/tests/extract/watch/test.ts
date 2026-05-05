/** require: `npm run dev` in root */

import fs from 'fs'
import os from 'node:os'
import { createRequire } from 'module'
import { pathToFileURL } from 'url'
import path from 'upath'
import cssEscape from 'shared/utils/css-escape'
import waitForDataMatch from 'shared/utils/wait-for-data-match'
import dedent from 'ts-dedent'
import { it, beforeAll, afterAll, expect } from 'vitest'
import { execa, type ResultPromise } from 'execa'

const cliFilepath = path.resolve(__dirname, '../../../src/bin/index.ts')
const tsxLoaderURL = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href
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

const originOptionsText = `import type { Options } from '@master/css-extractor'
const options: Options = {
    includeClasses: [],
    excludeClasses: [],
}

export default options
`

const originConfigText = `import type { Config } from '@master/css'
const config: Config = {
    components: {
        btn: ['bg:red']
    },
    variables: [
        { namespace: 'color', key: 'primary', value: '$(color-blue)' }
    ]
}

export default config
`

let workspacePath: string
let HTMLFilepath: string
let optionsFilepath: string
let configFilepath: string
let virtualCSSFilepath: string
let subprocess: ResultPromise
let subprocessOutput = ''

async function waitForCSSContent(doesMatch: (css: string) => boolean) {
    const deadline = Date.now() + 30000
    let css = ''
    while (Date.now() < deadline) {
        if (fs.existsSync(virtualCSSFilepath)) {
            css = fs.readFileSync(virtualCSSFilepath, { encoding: 'utf8' })
            if (doesMatch(css)) return css
        }
        await new Promise((resolve) => setTimeout(resolve, 100))
    }
    throw new Error(`Timed out waiting for generated CSS content.\n\nLast CSS:\n${css}\n\nProcess output:\n${subprocessOutput}`)
}

async function waitForWatchRestart(onReady: () => void) {
    await waitForDataMatch(
        subprocess,
        (data) => data.includes('Restart watching source changes'),
        onReady
    )
}

beforeAll(() => {
    subprocessOutput = ''
    workspacePath = fs.mkdtempSync(path.join(os.tmpdir(), 'master-css-cli-watch-'))
    HTMLFilepath = path.join(workspacePath, 'test.html')
    optionsFilepath = path.join(workspacePath, 'master.css-extractor.ts')
    configFilepath = path.join(workspacePath, 'master.css.ts')
    virtualCSSFilepath = path.join(workspacePath, 'master.css')
    fs.writeFileSync(HTMLFilepath, originHTMLText, { flag: 'w+' })
    fs.writeFileSync(optionsFilepath, originOptionsText, { flag: 'w+' })
    fs.writeFileSync(configFilepath, originConfigText, { flag: 'w+' })
    subprocess = execa(process.execPath, ['--import', tsxLoaderURL, cliFilepath, 'extract', '-w'], {
        cwd: workspacePath,
        forceKillAfterDelay: 1000
    })
    void subprocess.catch(() => undefined)
    subprocess.stdout?.on('data', (data) => {
        subprocessOutput += data.toString()
    })
    subprocess.stderr?.on('data', (data) => {
        subprocessOutput += data.toString()
    })
}, 120000)

it('start watch process', async () => {
    await Promise.all([
        waitForDataMatch(subprocess, (data) => data.includes('Start watching source changes')),
        waitForDataMatch(subprocess, (data) => data.includes('exported'))
    ])
    const fileCSSText = await waitForCSSContent((css) => [
        'font:heavy',
        'font:48',
        'bg:primary',
        'btn'
    ].every((eachClass) => css.includes(cssEscape(eachClass))))
    expect(fileCSSText).toContain(cssEscape('font:heavy'))
    expect(fileCSSText).toContain(cssEscape('font:48'))
    expect(fileCSSText).toContain(cssEscape('bg:primary'))
    expect(fileCSSText).toContain(cssEscape('btn'))
}, 120000)

it('change options file `includeClasses` and reset process', async () => {
    await Promise.all([
        waitForWatchRestart(() => {
            fs.writeFileSync(optionsFilepath, originOptionsText.replace('includeClasses: []', 'includeClasses: [\'fg:red\']'))
        }),
        waitForCSSContent((css) => css.includes(cssEscape('fg:red')))
    ])
    const fileCSSText = await waitForCSSContent((css) => css.includes(cssEscape('fg:red')))
    expect(fileCSSText).toContain(cssEscape('fg:red'))
}, 120000)

it('change config file `components` and reset process', async () => {
    await Promise.all([
        waitForWatchRestart(() => {
            fs.writeFileSync(configFilepath, originConfigText.replace('bg:red', 'bg:blue'))
        }),
        waitForCSSContent((css) => css.includes('.btn{background-color:var(--color-blue)'))
    ])
    const fileCSSText = await waitForCSSContent((css) => css.includes('.btn{background-color:var(--color-blue)'))
    expect(fileCSSText).toContain('.btn{background-color:var(--color-blue)')
}, 120000)

it('change html file class attr and update', async () => {
    fs.writeFileSync(HTMLFilepath, originHTMLText.replace('hmr-test', 'text:underline'))
    const fileCSSText = await waitForCSSContent((css) => css.includes(cssEscape('text:underline')))
    expect(fileCSSText).toContain(cssEscape('text:underline'))
}, 120000)

afterAll(async () => {
    subprocess.kill()
    await subprocess.catch(() => undefined)
    fs.rmSync(workspacePath, { recursive: true, force: true })
}, 120000)
