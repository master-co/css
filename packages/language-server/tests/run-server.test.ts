import { execSync } from 'child_process'

it('run server', async () => {
    execSync('node ../dist/server.bundle.js --node-ipc', { cwd: __dirname })
})