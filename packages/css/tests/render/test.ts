import stripAnsi from 'strip-ansi'
import { spawnd, SpawndChildProcess } from 'spawnd'

let child: SpawndChildProcess

it('render cli', async () => {
    child = spawnd('tsx ../../src/bin render ../cli/a.test.html --config ../config/extends/master-css.js', { shell: true, cwd: __dirname })

    const messages: string[] = []
    child.stdout.on('data', (data) => messages.push(stripAnsi(data.toString())))

    await new Promise<void>(resolve => {
        child.on('close', () => {
            resolve()
        })
    })

    expect(messages.join(' ')).toContain('../config/extends/master-css.js config file found')
}, 15000)

// afterAll(async () => {
//     await child.destroy()
// }, 30000)