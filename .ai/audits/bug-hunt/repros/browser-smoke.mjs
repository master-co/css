import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(resolve(repo, 'packages/runtime/package.json'))
const browserTypes = require('@playwright/test')
const browserName = process.env.BH_BROWSER || 'chromium'
assert(['chromium', 'firefox', 'webkit'].includes(browserName))
const [directory, kind = 'runtime'] = process.argv.slice(2)
const root = resolve(directory)
const server = createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname
    if (kind === 'figma' && pathname === '/') {
        response.setHeader('Content-Type', 'text/html')
        response.end('<!doctype html><iframe src="/import-variables.html"></iframe>')
        return
    }
    const file = resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname))
    if (!file.startsWith(root + sep)) { response.writeHead(404); response.end(); return }
    try {
        response.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
            '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml' })[extname(file)] || 'application/octet-stream')
        response.end(await readFile(file))
    } catch { response.writeHead(404); response.end() }
})
await new Promise((done) => server.listen(0, '127.0.0.1', done))
const browser = await browserTypes[browserName].launch()
console.log(JSON.stringify({ browser: browserName, version: browser.version() }))
try {
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => { if (message.type() === 'error') console.error('Browser console:', message.text()) })
    page.on('response', (response) => { if (response.status() >= 400) console.error('HTTP:', response.status(), response.url()) })
    if (kind === 'figma') {
        await page.addInitScript(() => {
            if (window !== window.top) return
            window.auditNotifications = []
            window.auditRequests = []
            window.addEventListener('message', (event) => {
                const message = event.data?.pluginMessage
                if (message?.type === 'notify') window.auditNotifications.push(message.data.message)
                if (message?.type === 'getVariableCollections') event.source.postMessage({ pluginMessage: {
                    type: message.type, data: [{ id: 'test', name: 'Audit fixture' }] } }, '*')
                if (message?.type === 'setCollectionVariables') {
                    window.auditRequests.push(message.data)
                    event.source.postMessage({ pluginMessage: { type: message.type, data: null } }, '*')
                }
            })
        })
    }
    const url = process.env.BH_SMOKE_URL || `http://127.0.0.1:${server.address().port}/`
    await page.goto(url)
    if (kind === 'figma') {
        const frame = page.frameLocator('iframe')
        await frame.locator('textarea').fill('{invalid')
        await frame.getByRole('button', { name: 'Import', exact: true }).click()
        await page.waitForFunction(() => window.auditNotifications.includes('Invalid JSON format'))
        assert(await frame.getByRole('button', { name: 'Import', exact: true }).isEnabled())
        await frame.locator('textarea').fill('{"variables":{"space":{"base":16}}}')
        await frame.getByRole('button', { name: 'Import', exact: true }).click()
        await page.waitForFunction(() => window.auditNotifications.includes('Import succeeded'))
        const requests = await page.evaluate(() => window.auditRequests)
        assert.equal(requests.length, 1)
        assert.equal(requests[0].variableData.variables.space.base, 16)
        console.log('Figma built UI, mock parent RPC, invalid JSON recovery and valid import PASS')
    } else if (kind === 'frame') {
        const paragraph = page.frameLocator('iframe').locator('p')
        await paragraph.waitFor()
        assert.equal(await paragraph.evaluate(el => getComputedStyle(el).color), 'rgb(255, 0, 0)')
        console.log('Runtime playground iframe initial CSS PASS; mutations covered0009')
    } else if (kind === 'nuxtstatic') {
        await page.locator('.box').waitFor()
        assert.equal(await page.locator('.box').evaluate(el => getComputedStyle(el).display), 'flex')
        console.log('Nuxt playground SSR/native component CSS PASS')
    } else {
        await page.waitForSelector('h1,h2')
        assert(await page.locator('h1,h2').first().isVisible())
        if (await page.locator('[data-runtime-toggle]').count()) {
            await page.locator('[data-runtime-toggle]').click()
            await page.waitForFunction(() => document.querySelector('[data-runtime-status]').textContent.includes('Runtime generated'))
            assert.equal(await page.locator('[data-runtime-toggle]').evaluate((el) => getComputedStyle(el).backgroundColor), 'rgb(65, 105, 225)')
        }
        if (await page.getByRole('button', { name: 'Increase the counter by one', exact: true }).count()) {
            await page.getByRole('button', { name: 'Increase the counter by one', exact: true }).click()
            await page.waitForFunction(() => document.querySelector('.counter-digits strong:not([aria-hidden])').textContent === '1')
        }
        const buttons = page.getByRole('button', { name: /count is 0/ })
        if (await buttons.count()) {
            await buttons.first().click()
            await page.getByRole('button', { name: /count is 1/ }).first().waitFor()
        }
        if (kind !== 'static' && kind !== 'vitestatic') {
            await page.evaluate((shadow) => {
                const target = shadow ? document.querySelector('my-element').shadowRoot : document.body
                const probe = document.createElement('div')
                probe.id = 'audit-probe'
                probe.className = 'hidden'
                target.append(probe)
            }, kind === 'lit')
            await page.waitForFunction((shadow) => {
                const target = shadow ? document.querySelector('my-element').shadowRoot : document
                return getComputedStyle(target.querySelector('#audit-probe')).display === 'none'
            }, kind === 'lit')
            await page.locator('#audit-probe').evaluate((probe) => { probe.className = 'block audit-unknown-utility' })
            await page.waitForFunction((shadow) => {
                const target = shadow ? document.querySelector('my-element').shadowRoot : document
                return getComputedStyle(target.querySelector('#audit-probe')).display === 'block'
            }, kind === 'lit')
            await page.locator('#audit-probe').evaluate((probe) => probe.remove())
        } else if (kind === 'vitestatic') {
            assert.equal(await page.locator('body').evaluate(el => getComputedStyle(el).display), 'grid')
            assert.equal(await page.locator('.btn').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(0, 97, 255)')
            await page.emulateMedia({ colorScheme: 'dark' })
            await page.waitForFunction(() => getComputedStyle(document.querySelector('.btn')).backgroundColor === 'rgb(143, 181, 255)')
        } else {
            assert.equal(await page.locator('.size\\:40x\\!').evaluate((el) => getComputedStyle(el).width), '160px')
        }
        console.log(JSON.stringify({ kind, title: await page.title(), heading: await page.locator('h1,h2').first().innerText(), errors }))
    }
    assert.deepEqual(errors, [])
} finally {
    await browser.close()
    await new Promise((done) => server.close(done))
}
