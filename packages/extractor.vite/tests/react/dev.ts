import fs from 'fs'
import path from 'upath'
import cssEscape from 'shared/utils/css-escape'
import puppeteer, { type Browser, type Page } from 'puppeteer'
import { copy, rm } from 'shared/utils/fs'
import { SpawndChildProcess, spawnd } from 'spawnd'

const examplePath = path.join(__dirname, '../../../../examples/react-with-static-extraction')
const tmpDir = path.join(__dirname, 'tmp/dev')

let devProcess: SpawndChildProcess
let browser: Browser
let page: Page
let error: Error
let templatePath: string
let templateContent: string
let masterCSSConfigPath: string

beforeAll((done) => {
    copy(examplePath, tmpDir)
    templatePath = path.join(tmpDir, 'src/App.tsx')
    templateContent = fs.readFileSync(templatePath).toString()
    masterCSSConfigPath = path.join(tmpDir, 'master.css.ts')
    devProcess = spawnd('npm run dev', { shell: true, cwd: tmpDir })
    devProcess.stdout.on('data', async (data) => {
        const message = data.toString()
        const result = /(http:\/\/localhost:).*?([0-9]+)/.exec(message)
        if (result) {
            devProcess.stdout.removeAllListeners()
            browser = await puppeteer.launch({ headless: 'new' })
            page = await browser.newPage()
            page.on('console', (consoleMessage) => {
                if (consoleMessage.type() === 'error') {
                    error = new Error(consoleMessage.text())
                }
            })
            page.on('pageerror', (e) => error = e)
            page.on('error', (e) => error = e)
            await page.goto(result[1] + result[2])
            done()
        }
    })
    devProcess.stderr.on('data', (data) => {
        console.error(data.toString())
    })
})

it('run dev without errors', () => {
    expect(() => { if (error) throw error }).not.toThrowError()
})

it('check if the page contains [data-vite-dev-id=".virtual/master.css"]', async () => {
    expect(await page.$('[data-vite-dev-id$=".virtual/master.css"]')).toBeTruthy()
})

it('change class names and check result in the browser during HMR', async () => {
    const newClassName = 'font:' + new Date().getTime()
    const newClassNameSelector = '.' + cssEscape(newClassName)
    fs.writeFileSync(templatePath, templateContent.replace('className="card"', `className="${newClassName}"`))
    await page.waitForNetworkIdle()
    const newClassNameElementHandle = await page.waitForSelector(newClassNameSelector)
    expect(newClassNameElementHandle).not.toBeNull()
    const styleHandle = await page.$('[data-vite-dev-id$=".virtual/master.css"]')
    expect(styleHandle).not.toBeNull()
    const cssText = await page.evaluate((style: any) => (style as HTMLStyleElement)?.textContent, styleHandle)
    expect(cssText).toContain(newClassNameSelector)
})

it('change master.css.ts and check result in the browser during HMR', async () => {
    const newBtnClassName = 'btn' + new Date().getTime()
    const newBtnClassNameSelector = '.' + cssEscape(newBtnClassName)
    fs.writeFileSync(templatePath, templateContent.replace('className="card"', `className="${newBtnClassName}"`))
    await page.waitForNetworkIdle()
    const newClassNameElementHandle = await page.waitForSelector(newBtnClassNameSelector)
    expect(newClassNameElementHandle).not.toBeNull()
    // -> classes: { btn43848384: 'xxx' }
    fs.writeFileSync(masterCSSConfigPath, `
        export default { classes: { '${newBtnClassName}': 'bg:pink' } }
    `)
    await page.waitForNetworkIdle()
    const styleHandle = await page.$('[data-vite-dev-id$=".virtual/master.css"]')
    expect(styleHandle).not.toBeNull()
    const cssText = await page.evaluate((style: any) => (style as HTMLStyleElement)?.textContent, styleHandle)
    expect(cssText).toContain(newBtnClassNameSelector)
})

afterAll(async () => {
    await page.close()
    await browser.close()
    await devProcess.destroy()
    rm(tmpDir)
})