import { SpawndChildProcess } from 'spawnd'
import { spawnd } from 'spawnd'

let serverProcess: SpawndChildProcess

beforeAll(() => {
    serverProcess = spawnd('node ./index --node-ipc', { shell: true, cwd: __dirname })
})

it('run server', async () => {
    expect(serverProcess).toBeDefined()
})

afterAll(async () => {
    await serverProcess.destroy()
}, 60000)