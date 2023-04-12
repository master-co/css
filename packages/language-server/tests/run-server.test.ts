import { execSync } from 'child_process'

it('run server', async () => {
    execSync('node ../dist/server.js --node-ipc', { cwd: __dirname })
})