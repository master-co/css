import { ChildProcess, execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { cssEscape } from '../../../packages/css/src/utils/css-escape'
import { runViteDevProcess } from '../../vite/tests/run-vite-dev-process'
import puppeteer, { type Browser, type Page } from 'puppeteer'

let devProcess: ChildProcess
let browser: Browser
let page: Page

const indexHtmlPath = path.resolve(__dirname, '../index.html')
const originalIndexHtmlContent = fs.readFileSync(indexHtmlPath, { encoding: 'utf-8' })
const configPath = path.resolve(__dirname, '../master.css.mjs')
const originalConfigContent = fs.readFileSync(configPath, { encoding: 'utf-8' })

beforeAll(async () => {
    browser = await puppeteer.launch()
    page = await browser.newPage()
    devProcess = await runViteDevProcess(page)
})

it('check if the browser contains [data-vite-dev-id="master.css"]', async () => {
    expect(await page.$('[data-vite-dev-id$="master.css"]')).toBeTruthy()
})

it('change class names and check result in the browser during HMR', async () => {
    const newClassName = 'font:' + new Date().getTime()
    const newClassNameSelector = '.' + cssEscape(newClassName)
    console.log(newClassNameSelector)
    fs.writeFileSync(indexHtmlPath, originalIndexHtmlContent.replace('hmr-test', newClassName))
    await page.waitForNetworkIdle()
    const newClassNameElementHandle = await page.waitForSelector(newClassNameSelector)
    expect(newClassNameElementHandle).not.toBeNull()
    const styleHandle = await page.$('[data-vite-dev-id$="master.css"]')
    expect(styleHandle).not.toBeNull()
    const cssText = await page.evaluate((style: any) => (style as HTMLStyleElement)?.textContent, styleHandle)
    expect(cssText).toContain(newClassNameSelector)
})

it('change master.css.mjs and check result in the browser during HMR', async () => {
    const newBtnClassName = 'btn' + new Date().getTime()
    const newBtnClassNameSelector = '.' + cssEscape(newBtnClassName)
    fs.writeFileSync(indexHtmlPath, originalIndexHtmlContent.replace('hmr-test', newBtnClassName))
    await page.waitForNetworkIdle()
    const newClassNameElementHandle = await page.waitForSelector(newBtnClassNameSelector)
    expect(newClassNameElementHandle).not.toBeNull()
    // -> classes: { btn43848384: 'xxx' }
    fs.writeFileSync(configPath, originalConfigContent.replace(/(btn):/, newBtnClassName + ':'))
    await new Promise((x) => setTimeout(x, 1000))
    await page.waitForNetworkIdle()
    const styleHandle = await page.$('[data-vite-dev-id$="master.css"]')
    expect(styleHandle).not.toBeNull()
    const cssText = await page.evaluate((style: any) => (style as HTMLStyleElement)?.textContent, styleHandle)
    expect(cssText).toContain(newBtnClassNameSelector)
})

afterAll(async () => {
    execSync('git restore index.html')
    execSync('git restore master.css.mjs')
    devProcess.stdout?.destroy()
    devProcess.kill()
    await page.close()
    await browser.close()
})