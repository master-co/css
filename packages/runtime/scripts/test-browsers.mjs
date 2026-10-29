import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const args = process.platform === 'darwin'
  ? [fileURLToPath(new URL('./test-isolated-firefox.mjs', import.meta.url)), '--all-browsers', ...process.argv.slice(2)]
  : ['--bun', 'playwright', 'test', ...process.argv.slice(2)]
const child = spawn('bun', args, { stdio: 'inherit' })
child.once('error', error => { console.error(error); process.exitCode = 1 })
child.once('exit', (code, signal) => { if (signal) process.kill(process.pid, signal); else process.exitCode = code ?? 1 })
