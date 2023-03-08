import { ChildProcess, exec, execSync } from 'child_process'
import puppeteer, { Browser, Page } from 'puppeteer'
import fs from 'fs'
import path from 'path'
import stripAnsi from 'strip-ansi'
import { cssEscape } from '../../../packages/css/src/utils/css-escape'

let childProcess: ChildProcess
let browser: Browser
let page: Page

const indexHtmlPath = path.resolve(__dirname, '../index.html')
const originalIndexHtmlContent = fs.readFileSync(indexHtmlPath, { encoding: 'utf-8' })
const configPath = path.resolve(__dirname, '../master.css.mjs')
const originalConfigContent = fs.readFileSync(configPath, { encoding: 'utf-8' })

beforeAll((done) => {
    childProcess = exec('npm run dev')

    childProcess.stdout?.on('data', async data => {
        const message = stripAnsi(data.toString())
        const result = /(http:\/\/localhost:).*?([0-9]+)/.exec(message)
        if (result) {
            browser = await puppeteer.launch()
            page = await browser.newPage()
            await page.goto(result[1] + result[2])
            done()
        }
    })
}, 20000)

it('check if the browser contains [data-vite-dev-id="master.css"]', async () => {
    expect(await page.$('[data-vite-dev-id$="master.css"]')).toBeTruthy()
})

it('change class names and check result in the browser during HMR', async () => {
    const newClassName = 'font:' + new Date().getTime()
    const newClassNameSelector = '.' + cssEscape(newClassName)
    fs.writeFileSync(indexHtmlPath, originalIndexHtmlContent.replace('hmr-test', newClassName))
    await page.waitForNetworkIdle()
    const newClassNameElementHandle = await page.waitForSelector(newClassNameSelector)
    expect(newClassNameElementHandle).not.toBeNull()
    const styleHandle = await page.$('[data-vite-dev-id$="master.css"]')
    expect(styleHandle).not.toBeNull()
    const cssText = await page.evaluate((style: any) => (style as HTMLStyleElement)?.textContent, styleHandle)
    expect(cssText).toContain(newClassNameSelector)
}, 15000)

it('change master.css.mjs and check result in the browser during HMR', async () => {
    const newBtnClassName = 'btn' + new Date().getTime()
    const newBtnClassNameSelector = '.' + cssEscape(newBtnClassName)
    fs.writeFileSync(indexHtmlPath, originalIndexHtmlContent.replace('hmr-test', newBtnClassName))
    await page.waitForNetworkIdle()
    const newClassNameElementHandle = await page.waitForSelector(newBtnClassNameSelector)
    expect(newClassNameElementHandle).not.toBeNull()
    // -> classes: { btn43848384: 'xxx' }
    fs.writeFileSync(configPath, originalConfigContent.replace(/(btn):/, newBtnClassName + ':'))
    await page.waitForNetworkIdle()
    const styleHandle = await page.$('[data-vite-dev-id$="master.css"]')
    expect(styleHandle).not.toBeNull()
    const cssText = await page.evaluate((style: any) => (style as HTMLStyleElement)?.textContent, styleHandle)
    expect(cssText).toContain(newBtnClassNameSelector)
}, 15000)

afterAll(async () => {
    await browser?.close()

    childProcess.stdout?.destroy()
    childProcess.kill()

    execSync('git restore index.html')
    execSync('git restore master.css.mjs')
})
