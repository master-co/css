import { ChildProcess, exec } from 'child_process'
import stripAnsi from 'strip-ansi'

export function runViteDevProcess(): Promise<ChildProcess> {
    return new Promise((resolve) => {
        const devProcess = exec('vite dev')
        let url: string
        devProcess.stdout?.on('data', async data => {
            const message = stripAnsi(data.toString())
            const result = /(http:\/\/localhost:).*?([0-9]+)/.exec(message)
            if (result) {
                url = result[1] + result[2]
                await page.goto(url)
                resolve(devProcess)
            }
        })
    })
}