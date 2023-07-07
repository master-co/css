import { spawnSync } from 'child_process'

it('run server', async () => {
    spawnSync('node ../dist/server.bundle.js --node-ipc', { cwd: __dirname })
})