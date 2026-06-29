import { afterEach, describe, expect, it } from 'vitest'
import { chromium, type Browser } from '@playwright/test'
import { createServer, type ViteDevServer } from 'vite'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import masterCSS from '../src'

let server: ViteDevServer | undefined
let browser: Browser | undefined
let fixtureDir: string | undefined
const fixtureRoot = path.resolve(__dirname, '../tmp')

function writeStyle(root: string, displayClass: string) {
    writeFileSync(path.join(root, 'app.css'), [
        '@master entry;',
        '@components {',
        '    probe {',
        `        @compose ${displayClass};`,
        '        width: 4px;',
        '        height: 4px;',
        '    }',
        '}'
    ].join('\n'))
}

afterEach(async () => {
    await browser?.close()
    await server?.close()
    browser = undefined
    server = undefined
    if (fixtureDir) {
        rmSync(fixtureDir, { recursive: true, force: true })
        fixtureDir = undefined
    }
})

describe('Vite dev HMR', () => {
    it('updates runtime CSS without full reload and recovers after invalid CSS', async () => {
        mkdirSync(fixtureRoot, { recursive: true })
        fixtureDir = mkdtempSync(path.join(fixtureRoot, 'dev-hmr-'))
        mkdirSync(fixtureDir, { recursive: true })
        writeFileSync(path.join(fixtureDir, 'index.html'), [
            '<!doctype html>',
            '<html>',
            '<head><title>Master CSS Vite HMR</title></head>',
            '<body><div id="probe" class="probe"></div></body>',
            '</html>'
        ].join(''))
        writeStyle(fixtureDir, 'inline-flex')

        server = await createServer({
            root: fixtureDir,
            logLevel: 'silent',
            server: {
                host: '127.0.0.1',
                port: 0
            },
            resolve: {
                alias: {
                    '@master/css.vite/runtime': path.resolve(__dirname, '../src/runtime.ts')
                }
            },
            plugins: masterCSS({ mode: 'runtime' })
        })
        await server.listen()
        const wsEvents: unknown[] = []
        const originalSend = server.ws.send.bind(server.ws)
        server.ws.send = ((payload: unknown, ...args: unknown[]) => {
            wsEvents.push(payload)
            return originalSend(payload as never, ...args as never[])
        }) as typeof server.ws.send
        const url = server.resolvedUrls?.local[0]
        if (!url) throw new Error('Expected Vite dev server URL.')

        browser = await chromium.launch()
        const page = await browser.newPage()
        await page.goto(url)
        await page.waitForFunction(() => getComputedStyle(document.querySelector('#probe')!).display === 'inline-flex')
        await page.evaluate(() => {
            (window as Window & { __MASTER_CSS_HMR_MARKER?: string }).__MASTER_CSS_HMR_MARKER = 'preserve'
        })

        writeStyle(fixtureDir, 'flex')
        await page.waitForFunction(() => getComputedStyle(document.querySelector('#probe')!).display === 'flex')
        expect(wsEvents).not.toContainEqual(expect.objectContaining({ type: 'full-reload' }))
        expect(await page.evaluate(() => (window as Window & { __MASTER_CSS_HMR_MARKER?: string }).__MASTER_CSS_HMR_MARKER))
            .toBe('preserve')

        writeStyle(fixtureDir, 'bg:neutral-120')
        await page.waitForTimeout(300)
        writeStyle(fixtureDir, 'block')
        await page.waitForFunction(() => getComputedStyle(document.querySelector('#probe')!).display === 'block')
        expect(wsEvents).not.toContainEqual(expect.objectContaining({ type: 'full-reload' }))
        expect(await page.evaluate(() => (window as Window & { __MASTER_CSS_HMR_MARKER?: string }).__MASTER_CSS_HMR_MARKER))
            .toBe('preserve')
    })
})
