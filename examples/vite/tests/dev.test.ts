import { ChildProcess } from 'child_process'
import { runViteDevProcess } from '../../vite/tests/run-vite-dev-process'
import puppeteer, { type Browser, type Page } from 'puppeteer'

let devProcess: ChildProcess
let error: Error
let browser: Browser
let page: Page

beforeAll(async () => {
    browser = await puppeteer.launch()
    page = await browser.newPage()
    page.on('console', (consoleMessage) => {
        if (consoleMessage.type() === 'error') {
            error = new Error(consoleMessage.text())
        }
    })
    page.on('pageerror', (e) => error = e)
    page.on('error', (e) => error = e)
    devProcess = await runViteDevProcess(page)
}, 15000) // 15s timeout for the slow windows OS

it('run dev without errors', () => {
    expect(() => { if (error) throw error }).not.toThrowError()
})

afterAll(async () => {
    devProcess.stdout?.destroy()
    devProcess.stdin?.destroy()
    devProcess.kill()
    await page.close()
    await browser.close()
}, 15000) // 15s timeout for the slow windows OS
