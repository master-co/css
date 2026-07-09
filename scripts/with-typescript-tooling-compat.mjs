import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const [, , command, ...args] = process.argv

if (!command) {
    console.error('Usage: node scripts/with-typescript-tooling-compat.mjs <command> [...args]')
    process.exit(1)
}

const scriptsDirectory = dirname(fileURLToPath(import.meta.url))
const loaderURL = pathToFileURL(resolve(scriptsDirectory, 'typescript-tooling-compat.mjs')).href
const loaderOption = `--import=${loaderURL}`
const nodeOptions = process.env.NODE_OPTIONS?.trim()
const env = {
    ...process.env,
    NODE_OPTIONS: nodeOptions ? `${nodeOptions} ${loaderOption}` : loaderOption
}

const child = spawn(command, args, {
    env,
    shell: process.platform === 'win32',
    stdio: 'inherit'
})

child.on('exit', (code, signal) => {
    if (signal) {
        process.kill(process.pid, signal)
        return
    }

    process.exit(code ?? 1)
})

child.on('error', (error) => {
    console.error(error)
    process.exit(1)
})
