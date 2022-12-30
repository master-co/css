import { ChildProcess, exec, execSync } from 'child_process'
import puppeteer, { Browser, Page } from 'puppeteer'
import fs from 'fs'
import path from 'path'

const configRegexp = /(classes:.*?)[a-z0-9]+/s

let process: ChildProcess
let browser: Browser
let page: Page
let newClassName: string

beforeAll(async () => {
    process = exec('npm run dev')

    await new Promise<void>((resolve) => {
        process.stdout?.on('data', async data => {
            const message = data.toString()
            const result = /(http:\/\/localhost:).*?\[1m([0-9]+)/.exec(message)
            if (result) {
                browser = await puppeteer.launch()
                page = await browser.newPage()
                await page.goto(result[1] + result[2])
                resolve()
            }
        })
    })
}, 10000)

it('check if the browser contains [data-vite-dev-id="master.css"]', async () => {
    expect(await page.$('[data-vite-dev-id$="master.css"]')).toBeTruthy()
})

it('change class names and check result in the browser during HMR', async () => {
    const indexHtmlPath = path.resolve(__dirname, '../index.html')
    const originalIndexHtmlContent = fs.readFileSync(indexHtmlPath, { encoding: 'utf-8' })
    newClassName = 'a' + Math.random().toString(36).substr(2, 8)
    fs.writeFileSync(indexHtmlPath, originalIndexHtmlContent.replace(/(logo 172x172) [a-z0-9]+/, '$1 ' + newClassName))
    try {
        await page.waitForSelector('[class$="' + newClassName + '"]', { timeout: 5000 })
    } catch (err) {
        throw new Error(err)
    }
})

it('change master.css.mjs and check result in the browser during HMR', async () => {
    const configPath = path.resolve(__dirname, '../master.css.mjs')
    const originalConfigContent = fs.readFileSync(configPath, { encoding: 'utf-8' })
    fs.writeFileSync(configPath, originalConfigContent.replace(configRegexp, '$1' + newClassName))
    await page.waitForNetworkIdle()
    try {
        await page.waitForFunction((newClassName) => Array.from<CSSRule>(document.querySelector('[data-vite-dev-id$="master.css"]')?.['sheet']['cssRules']).some(eachRule => eachRule['selectorText'].includes(newClassName)), { timeout: 5000 }, newClassName)
    } catch (err) {
        throw new Error(err)
    }
})

afterAll(async () => {
    await browser.close()
    process.kill()

    execSync('git restore index.html')
    execSync('git restore master.css.mjs')
})
