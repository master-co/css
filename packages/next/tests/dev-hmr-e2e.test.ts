import { spawn, type ChildProcess } from 'node:child_process'
import { once } from 'node:events'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium, type Browser } from '@playwright/test'
import { describe, expect, it } from 'vitest'
import execPnpmSync from './helpers/pnpm-command'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const nextBin = fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url))

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function getFreePort() {
    return new Promise<number>((resolve, reject) => {
        const server = createServer()
        server.once('error', reject)
        server.listen(0, '127.0.0.1', () => {
            const address = server.address()
            if (!address || typeof address === 'string') {
                server.close()
                reject(new Error('Unable to allocate a local port.'))
                return
            }
            const port = address.port
            server.close((error) => error ? reject(error) : resolve(port))
        })
    })
}

function createGlobalsCSS(compose: string) {
    return [
        '@import "@master/css";',
        '',
        '@components {',
        '    probe {',
        `        @compose ${compose};`,
        '        width: 40px;',
        '        height: 40px;',
        '    }',
        '}',
        ''
    ].join('\n')
}

function writeFixture(fixtureDir: string, compose = 'inline-flex') {
    mkdirSync(join(fixtureDir, 'app'), { recursive: true })
    writeFileSync(join(fixtureDir, 'package.json'), JSON.stringify({
        private: true,
        type: 'module'
    }, null, 2))
    const nextIntegrationURL = pathToFileURL(join(packageDir, 'dist/index.js')).href
    writeFileSync(join(fixtureDir, 'next.config.js'), [
        `import { withMasterCSS } from ${JSON.stringify(nextIntegrationURL)}`,
        '',
        `export default withMasterCSS({ reactStrictMode: true })`,
        ''
    ].join('\n'))
    writeFileSync(join(fixtureDir, 'app/layout.jsx'), [
        `import './globals.css'`,
        `import { CSSRuntimeRegistry } from '@master/css.react'`,
        '',
        `export default function RootLayout({ children }) {`,
        `    return <html lang="en"><body><CSSRuntimeRegistry>{children}</CSSRuntimeRegistry></body></html>`,
        `}`,
        ''
    ].join('\n'))
    writeFileSync(join(fixtureDir, 'app/page.jsx'), [
        `export default function Page() {`,
        `    return <main><div id="probe" className="probe">Probe</div></main>`,
        `}`,
        ''
    ].join('\n'))
    writeFileSync(join(fixtureDir, 'app/globals.css'), createGlobalsCSS(compose))
}

function buildPackage() {
    execPnpmSync(['--dir', packageDir, 'build'], {
        cwd: packageDir,
        encoding: 'utf-8',
        env: {
            ...process.env,
            NEXT_TELEMETRY_DISABLED: '1'
        },
        stdio: 'pipe',
        timeout: 120000
    })
}

function startNextDev(fixtureDir: string, port: number) {
    const output = { text: '' }
    const child = spawn(process.execPath, [
        nextBin,
        'dev',
        '--turbo',
        '--hostname',
        '127.0.0.1',
        '--port',
        String(port)
    ], {
        cwd: fixtureDir,
        env: {
            ...process.env,
            NEXT_TELEMETRY_DISABLED: '1',
            NODE_ENV: 'development'
        },
        stdio: ['ignore', 'pipe', 'pipe']
    })
    child.stdout.on('data', (chunk) => {
        output.text += chunk.toString()
    })
    child.stderr.on('data', (chunk) => {
        output.text += chunk.toString()
    })
    return { child, output }
}

async function stopNextDev(child: ChildProcess) {
    if (child.exitCode !== null || child.signalCode !== null) return
    child.kill('SIGTERM')
    await Promise.race([
        once(child, 'exit'),
        delay(5000).then(() => {
            if (child.exitCode === null && child.signalCode === null) {
                child.kill('SIGKILL')
            }
        })
    ])
}

async function waitForServer(url: string, child: ChildProcess, output: { text: string }) {
    const deadline = Date.now() + 60000
    while (Date.now() < deadline) {
        if (child.exitCode !== null) {
            throw new Error(`Next dev exited early.\n${output.text}`)
        }
        try {
            const response = await fetch(url)
            if (response.status < 500) return
        } catch {
            // Server is still starting.
        }
        await delay(500)
    }
    throw new Error(`Timed out waiting for Next dev server.\n${output.text}`)
}

async function waitForOutput(output: { text: string }, pattern: string, child: ChildProcess) {
    const deadline = Date.now() + 30000
    while (Date.now() < deadline) {
        if (output.text.includes(pattern)) return
        if (child.exitCode !== null) {
            throw new Error(`Next dev exited before ${pattern} appeared.\n${output.text}`)
        }
        await delay(250)
    }
    throw new Error(`Timed out waiting for ${pattern}.\n${output.text}`)
}

async function expectDisplay(browser: Browser, url: string, display: string) {
    const page = await browser.newPage()
    await page.goto(url)
    await page.waitForSelector('#probe')
    await page.waitForFunction((expectedDisplay) => {
        const probe = document.getElementById('probe')
        return probe && getComputedStyle(probe).display === expectedDisplay
    }, display)
    return page
}

describe('Next dev HMR', () => {
    it('updates Master CSS without a full reload and recovers after invalid CSS', async () => {
        buildPackage()
        const workspaceDir = join(packageDir, 'e2e/dev-hmr-workspaces')
        mkdirSync(workspaceDir, { recursive: true })
        const fixtureDir = mkdtempSync(join(workspaceDir, 'fixture-'))
        const port = await getFreePort()
        const url = `http://127.0.0.1:${port}`
        let browser: Browser | undefined
        const globalsPath = join(fixtureDir, 'app/globals.css')

        writeFixture(fixtureDir)
        const { child, output } = startNextDev(fixtureDir, port)

        try {
            await waitForServer(url, child, output)
            browser = await chromium.launch()
            const page = await expectDisplay(browser, url, 'inline-flex')
            await page.evaluate(() => {
                const markerWindow = window as unknown as { __MASTER_CSS_HMR_MARKER?: string }
                markerWindow.__MASTER_CSS_HMR_MARKER = 'preserve'
            })

            writeFileSync(globalsPath, createGlobalsCSS('flex'))
            await page.waitForFunction(() => {
                const probe = document.getElementById('probe')
                return probe && getComputedStyle(probe).display === 'flex'
            })
            await expect(page.evaluate(() => {
                return (window as unknown as { __MASTER_CSS_HMR_MARKER?: string }).__MASTER_CSS_HMR_MARKER
            })).resolves.toBe('preserve')

            writeFileSync(globalsPath, createGlobalsCSS('bg:neutral-120'))
            await waitForOutput(output, 'Invalid @compose class', child)
            writeFileSync(globalsPath, createGlobalsCSS('block'))
            await page.waitForFunction(() => {
                const probe = document.getElementById('probe')
                return probe && getComputedStyle(probe).display === 'block'
            }, undefined, { timeout: 30000 })
        } finally {
            await browser?.close()
            await stopNextDev(child)
            rmSync(workspaceDir, { recursive: true, force: true })
        }
    }, 180000)
})
