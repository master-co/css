import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { readFile, readdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Run only inside isolated-package.py examples/webpack.
assert(process.cwd().includes('master-css-bh-isolated-'))
const built = spawnSync('pnpm', ['run', 'build'], { stdio: 'inherit', timeout: 120000 })
assert.equal(built.status, 0, 'normal example build must succeed')
const repo = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(resolve(repo, 'packages/runtime/package.json'))
const { chromium } = require('@playwright/test')
const requests = []
const server = createServer(async (req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname
    const path = pathname === '/' ? '/index.html' : pathname
    try {
        const body = await readFile(resolve('dist', '.' + path))
        res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml' })[extname(path)] || 'application/octet-stream')
        requests.push({ path, status: 200 })
        res.end(body)
    } catch {
        requests.push({ path, status: 404 })
        res.writeHead(404); res.end()
    }
})
await new Promise(done => server.listen(0, '127.0.0.1', done))
let browser
try {
    browser = await chromium.launch()
    const page = await browser.newPage()
    const errors = []
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
    await page.goto(`http://127.0.0.1:${server.address().port}/`)
    await page.waitForFunction(() => getComputedStyle(document.querySelector('h1')).fontSize === '48px')
    const scripts = await page.locator('script[src]').evaluateAll(nodes => nodes.map(n => n.getAttribute('src')))
    const files = await readdir('dist')
    console.log(JSON.stringify({ files, scripts, requests, errors, heading: await page.locator('h1').innerText(), runtimeFont: await page.locator('h1').evaluate(el => getComputedStyle(el).fontSize) }, null, 2))
    assert(files.includes('main.js'), 'generated entry exists')
    assert(requests.some(r => r.path === '/main.js' && r.status === 200), 'generated entry request succeeds')
    assert(!requests.some(r => r.path === '/index.js' && r.status === 404), 'BH-0027: template must not request a nonexistent index.js')
} finally {
    await browser?.close()
    await new Promise(done => server.close(done))
}
