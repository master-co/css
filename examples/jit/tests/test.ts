import { ChildProcess, exec } from 'child_process'
import puppeteer, { Browser, Page } from 'puppeteer'
import stripAnsi from 'strip-ansi'

describe('dev', () => {
    let childProcess: ChildProcess
    let browser: Browser
    let page: Page
    let url: string

    beforeAll((done) => {
        childProcess = exec('vite dev')
        childProcess.stdout?.on('data', async data => {
            const message = stripAnsi(data.toString())
            const result = /(http:\/\/localhost:).*?([0-9]+)/.exec(message)
            if (result) {
                browser = await puppeteer.launch()
                page = await browser.newPage()
                url = result[1] + result[2]
                done()
            }
        })
    }, 5000)

    it('run dev without errors', async () => {
        page.on('console', (consoleMessage) => {
            expect(consoleMessage.type()).not.toBe('error')
        })
        page.on('pageerror', (error) => {
            expect(() => { throw error }).not.toThrowError()
        })
        page.on('error', (error) => {
            expect(() => { throw error }).not.toThrowError()
        })
        await page.goto(url)
        await page.waitForNetworkIdle()
    })

    afterAll(async () => {
        await browser?.close()
        childProcess.stdout?.destroy()
        childProcess.kill()
    })
})
