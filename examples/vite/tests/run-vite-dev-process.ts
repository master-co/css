import { ChildProcess, exec } from 'child_process'
import stripAnsi from 'strip-ansi'
import type { Page } from 'puppeteer'

export function runViteDevProcess(page: Page): Promise<ChildProcess> {
    return new Promise((resolve) => {
        const devProcess = exec('vite dev')
        devProcess.stdout?.on('data', async (data) => {
            const message = stripAnsi(data)
            const result = /(http:\/\/localhost:).*?([0-9]+)/.exec(message)
            console.log(result)
            if (result) {
                await page.goto(result[1] + result[2])
                resolve(devProcess)
            }
        })
        devProcess.stderr?.on('data', (data) => {
            console.error(data)
        })
    })
}