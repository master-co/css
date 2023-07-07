import { copySync } from 'fs-extra'
import fs from 'fs'
import path from 'path'
import { ChildProcess, exec } from 'child_process'
import cssEscape from 'shared/utils/css-escape'
import puppeteer, { type Browser, type Page } from 'puppeteer'
import stripAnsi from 'strip-ansi'

const examplePath = path.join(__dirname, '../../../../examples/vite-with-static-extraction')
const tmpDir = path.join(__dirname, 'tmp')

let devProcess: ChildProcess
let browser: Browser
let page: Page
let error: Error
let indexHTMLPath: string
let indexHTMLContent: string
let masterCSSConfigPath: string
let masterCSSConfigContent: string

beforeAll(async () => {
    copySync(examplePath, tmpDir)
    indexHTMLPath = path.join(tmpDir, 'index.html')
    indexHTMLContent = fs.readFileSync(indexHTMLPath).toString()
    masterCSSConfigPath = path.join(tmpDir, 'master.css.ts')
    masterCSSConfigContent = fs.readFileSync(masterCSSConfigPath).toString()
    browser = await puppeteer.launch({ headless: 'new' })
    page = await browser.newPage()
    page.on('console', (consoleMessage) => {
        if (consoleMessage.type() === 'error') {
            error = new Error(consoleMessage.text())
        }
    })
    page.on('pageerror', (e) => error = e)
    page.on('error', (e) => error = e)
    devProcess = await new Promise((resolve) => {
        devProcess = exec('vite dev', { cwd: tmpDir })
        devProcess.stdout?.on('data', async (data) => {
            const message = stripAnsi(data)
            const result = /(http:\/\/localhost:).*?([0-9]+)/.exec(message)
            if (result) {
                await page.goto(result[1] + result[2])
                resolve(devProcess)
            }
        })
        devProcess.stderr?.on('data', (data) => {
            console.error(data)
        })
    })
}, 30000) // 30s timeout for the slow windows OS

it('run dev without errors', () => {
    expect(() => { if (error) throw error }).not.toThrowError()
})

it('check if the page contains [data-vite-dev-id=".virtual/master.css"]', async () => {
    expect(await page.$('[data-vite-dev-id$=".virtual/master.css"]')).toBeTruthy()
})

it('change class names and check result in the browser during HMR', async () => {
    const newClassName = 'font:' + new Date().getTime()
    const newClassNameSelector = '.' + cssEscape(newClassName)
    fs.writeFileSync(indexHTMLPath, indexHTMLContent.replace('class="card"', `class="${newClassName}"`))
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
    fs.writeFileSync(indexHTMLPath, indexHTMLContent.replace('class="card"', `class="${newBtnClassName}"`))
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
    devProcess.stdout?.destroy()
    devProcess.kill()
    await page.close()
    await browser.close()
}, 30000) // 30s timeout for the slow windows OS
