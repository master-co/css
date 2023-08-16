import fs from 'fs'
import path from 'path'
import cssEscape from 'shared/utils/css-escape'
import puppeteer, { type Browser, type Page } from 'puppeteer-core'
import { copy } from 'shared/utils/fs'
import { SpawndChildProcess, spawnd } from 'spawnd'
import waitForDataMatch from 'shared/utils/wait-for-data-match'

const examplePath = path.join(__dirname, '../../../../examples/nuxt.js-with-static-extraction')
const tmpDir = path.join(__dirname, 'tmp/dev')

let devProcess: SpawndChildProcess
let browser: Browser
let page: Page
let error: Error
let templatePath: string
let templateContent: string
let masterCSSConfigPath: string

test.todo('nuxt.js dev tests timeout in CI')
if (!process.env.GITHUB_ACTIONS) {
    beforeAll(async () => {
        copy(examplePath, tmpDir)
        templatePath = path.join(tmpDir, 'app.vue')
        templateContent = fs.readFileSync(templatePath).toString()
        masterCSSConfigPath = path.join(tmpDir, 'master.css.ts')
        devProcess = spawnd('pnpm dev', { shell: true, cwd: tmpDir, env: { ...process.env, NODE_ENV: 'development' } })
        const urlPattern = /(http:\/\/localhost:).*?([0-9]+)/
        const data = await waitForDataMatch(devProcess, (data) => urlPattern.exec(data)?.length)
        const result = urlPattern.exec(data)
        browser = await puppeteer.launch({ headless: 'new', channel: 'chrome' })
        page = await browser.newPage()
        if (result) {
            await page.goto(result[1] + result[2], { timeout: 120000 })
            await page.waitForNavigation({ timeout: 120000 })
            page.on('console', (consoleMessage) => {
                if (consoleMessage.type() === 'error') {
                    error = new Error(consoleMessage.text())
                }
            })
            page.on('pageerror', (e) => error = e)
            page.on('error', (e) => error = e)
        }
    }, 120000)

    it('run dev without errors', async () => {
        await page.waitForNetworkIdle()
        expect(() => { if (error) throw error }).not.toThrowError()
    }, 60000)

    it('check if the page contains [data-vite-dev-id=".virtual/master.css"]', async () => {
        expect(await page.$('[data-vite-dev-id$=".virtual/master.css"]')).toBeTruthy()
    }, 60000)

    it('change class names and check result in the browser during HMR', async () => {
        const newClassName = 'font:' + new Date().getTime()
        const newClassNameSelector = '.' + cssEscape(newClassName)
        fs.writeFileSync(templatePath, templateContent.replace(/class="([^"]+)"/, `class="${newClassName}"`))
        await page.waitForNetworkIdle()
        const styleHandle = await page.$('[data-vite-dev-id$=".virtual/master.css"]')
        const cssText = await page.evaluate((style: any) => (style as HTMLStyleElement)?.textContent, styleHandle)
        expect(cssText).toContain(newClassNameSelector)
    }, 60000)

    it('change master.css.ts and check result in the browser during HMR', async () => {
        const newBtnClassName = 'btn' + new Date().getTime()
        const newBtnClassNameSelector = '.' + cssEscape(newBtnClassName)
        fs.writeFileSync(templatePath, templateContent.replace(/class="([^"]+)"/, `class="${newBtnClassName}"`))
        fs.writeFileSync(masterCSSConfigPath, `
            export default { classes: { '${newBtnClassName}': 'bg:pink' } }
        `)
        await page.waitForNetworkIdle()
        const styleHandle = await page.$('[data-vite-dev-id$=".virtual/master.css"]')
        const cssText = await page.evaluate((style: any) => (style as HTMLStyleElement)?.textContent, styleHandle)
        expect(cssText).toContain(newBtnClassNameSelector)
    }, 60000)

    afterAll(async () => {
        await page.close()
        await browser.close()
        await devProcess.destroy()
    }, 60000)
}