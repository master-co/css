import { ChildProcess } from 'child_process'
import { runViteDevProcess } from '../../vite/tests/run-vite-dev-process'

let devProcess: ChildProcess
let error: Error

page.on('console', (consoleMessage) => {
    if (consoleMessage.type() === 'error') {
        error = new Error(consoleMessage.text())
    }
})
page.on('pageerror', (e) => error = e)
page.on('error', (e) => error = e)

beforeAll(async () => {
    devProcess = await runViteDevProcess()
})

it('run dev without errors', () => {
    expect(() => { if (error) throw error }).not.toThrowError()
})

afterAll(() => {
    devProcess.stdout?.destroy()
    devProcess.kill()
})