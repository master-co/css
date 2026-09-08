import { spawn, spawnSync } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const kind = process.argv[2]
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: '1', ASTRO_TELEMETRY_DISABLED: '1' }
const built = process.env.BH_SKIP_BUILD ? { status: 0 } : spawnSync('pnpm', ['run', 'build'], { env, stdio: 'inherit' })
if (built.status) process.exit(built.status)
const probe = createServer()
await new Promise((done) => probe.listen(0, '127.0.0.1', done))
const port = probe.address().port
await new Promise((done) => probe.close(done))
const require = createRequire(resolve('package.json'))
const command = kind === 'angular' ? [process.execPath, ['dist/angular-with-progressive-rendering/server/server.mjs']]
    : kind === 'next' ? [process.execPath, [require.resolve('next/dist/bin/next'), 'start', '--port', String(port)]]
    : kind === 'nuxt' ? [process.execPath, ['.output/server/index.mjs']]
        : [process.execPath, [resolve('node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort']]
const child = spawn(command[0], command[1], { env: { ...env, PORT: String(port), HOST: '127.0.0.1', NITRO_PORT: String(port), NITRO_HOST: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'pipe'] })
let output = ''
child.stdout.on('data', (chunk) => { output += chunk })
child.stderr.on('data', (chunk) => { output += chunk })
const url = `http://127.0.0.1:${port}/`
try {
    let html = ''
    const deadline = Date.now() + 60000
    while (Date.now() < deadline && child.exitCode === null) {
        try { const response = await fetch(url); if (response.ok) { html = await response.text(); break } } catch {}
        await new Promise((done) => setTimeout(done, 200))
    }
    if (!html) throw new Error('SSR server unavailable: ' + output)
    console.log(JSON.stringify({ kind, htmlBytes: Buffer.byteLength(html), hasMasterStyle: /id=["']master-css["']/.test(html) }))
    const smoke = fileURLToPath(new URL('./browser-smoke.mjs', import.meta.url))
    const browsers = (process.env.BH_BROWSER_MATRIX || process.env.BH_BROWSER || 'chromium').split(',')
    const results = []
    for (const browser of browsers) {
        const result = spawnSync(process.execPath, [smoke, '.', process.env.BH_BROWSER_KIND || 'runtime'], {
            env: { ...env, BH_SMOKE_URL: url, BH_BROWSER: browser }, stdio: 'inherit', timeout: 90000
        })
        results.push({ browser, exit: result.status, error: result.error?.message })
    }
    console.log(JSON.stringify({ kind, results }))
    process.exitCode = results.every(result => result.exit === 0) ? 0 : 1
} finally {
    if (child.exitCode === null) {
        const stopped = once(child, 'exit')
        child.kill('SIGTERM')
        const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
        await stopped
        clearTimeout(timer)
    }
    console.log(output)
}
