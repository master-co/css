import { spawn, type ChildProcess } from 'node:child_process'
import { once } from 'node:events'
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { dirname, isAbsolute, join, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium, type Browser } from '@playwright/test'
import { describe, expect, it, onTestFinished } from 'vitest'
import execPnpmSync from './helpers/pnpm-command'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const nextBin = fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url))
const traceLoaderPath = fileURLToPath(new URL('./helpers/static-hmr-trace-loader.mjs', import.meta.url))

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

function createGlobalsCSS(display: string) {
  return [
    '@import url("@master/css");',
    '',
    '@layer components {',
    '    .probe {',
    `        display: ${display};`,
    '        width: 40px;',
    '        height: 40px;',
    '    }',
    '    .box {',
    '        display: flex;',
    '    }',
    '}',
    ''
  ].join('\n')
}

function writeFixture(fixtureDir: string, display = 'inline-flex') {
  mkdirSync(join(fixtureDir, 'app'), { recursive: true })
  writeFileSync(join(fixtureDir, 'package.json'), JSON.stringify({
    private: true,
    type: 'module'
  }, null, 2))
  const nextIntegrationPath = process.env.MASTER_NEXT_HMR_INTEGRATION ?? join(packageDir, 'dist/index.js')
  // Webpack tracks config imports as files and cannot cache a file:// specifier.
  const relativeIntegrationPath = relative(fixtureDir, nextIntegrationPath).split(sep).join('/')
  const nextIntegrationSpecifier = isAbsolute(relativeIntegrationPath)
    ? pathToFileURL(nextIntegrationPath).href
    : relativeIntegrationPath.startsWith('.') ? relativeIntegrationPath : `./${relativeIntegrationPath}`
  writeFileSync(join(fixtureDir, 'next.config.js'), [
    `import { withMasterCSS } from ${JSON.stringify(nextIntegrationSpecifier)}`,
    '',
    `const configured = withMasterCSS(${JSON.stringify({ reactStrictMode: true, ...(process.env.MASTER_NEXT_HMR_TURBOPACK_ROOT ? { turbopack: { root: process.env.MASTER_NEXT_HMR_TURBOPACK_ROOT } } : {}) })})`,
    `let result = configured`,
    `if (process.env.MASTER_NEXT_HMR_TRACE_REPORT) {`,
    `  result = Promise.resolve(configured).then(config => {`,
    `  for (const rule of config.turbopack?.rules?.['*'] ?? []) {`,
    `    for (const entry of rule.loaders ?? []) {`,
    `      const kind = /(?:static-css-loader|static-loader|stylesheet-loader)\\.js$/.exec(entry.loader)?.[0]`,
    `      if (!kind) continue`,
    `      entry.options = { ...entry.options, __masterOriginalLoader: entry.loader, __masterTraceKind: kind }`,
    `      entry.loader = ${JSON.stringify(traceLoaderPath)}`,
    `    }`,
    `  }`,
    `  return config`,
    `  })`,
    `}`,
    `export default result`,
    ''
  ].join('\n'))
  writeFileSync(join(fixtureDir, 'app/layout.jsx'), [
    `import './globals.css'`,
    '',
    `export default function RootLayout({ children }) {`,
    `    return <html lang="en"><body>{children}</body></html>`,
    `}`,
    ''
  ].join('\n'))
  writePage(fixtureDir, 11)
  writeModules(fixtureDir, 20)
  writeFileSync(join(fixtureDir, 'app/globals.css'), createGlobalsCSS(display))
}

function writePage(fixtureDir: string, padding: number) {
  writeFileSync(join(fixtureDir, 'app/page.jsx'), [
    `'use client'`,
    `import { useEffect, useState } from 'react'`,
    ...Array.from({ length: 10 }, (_, index) => `import { value as value${index} } from './value-${index}'`),
    `export default function Page() {`,
    `  const [hydrated, setHydrated] = useState(false)`,
    `  useEffect(() => setHydrated(true), [])`,
    "  return <main data-hydrated={hydrated}><div id=\"cascade\" className=\"box display:block\">Cascade</div><div id=\"probe\" className=\"probe\">Probe</div>",
    `<div id="incremental" className="padding:${padding}px">Incremental</div>`,
    ...Array.from({ length: 10 }, (_, index) => `<div id="module-${index}" className={value${index}}>Module</div>`),
    `</main>`, `}`
  ].join('\n'))
}
function writeModules(fixtureDir: string, padding: number) {
  for (let index = 0; index < 10; index++) writeFileSync(join(fixtureDir, `app/value-${index}.jsx`), `export const value = 'padding:${padding + index}px'`)
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

function startNextDev(fixtureDir: string, port: number, bundler: 'turbo' | 'webpack', pipelineReport?: string) {
  const output = { text: '' }
  const child = spawn(process.execPath, [
    nextBin,
    'dev',
    `--${bundler}`,
    '--hostname',
    '127.0.0.1',
    '--port',
    String(port)
  ], {
    cwd: fixtureDir,
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: '1',
      NODE_ENV: 'development',
      ...(pipelineReport ? {
        MASTER_NEXT_HMR_PIPELINE_REPORT: pipelineReport,
        ...(bundler === 'turbo' ? { MASTER_NEXT_HMR_TRACE_REPORT: join(dirname(pipelineReport), 'loaders.jsonl') } : {}),
        NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --import=${new URL('./helpers/static-hmr-metrics.mjs', import.meta.url).href}`
      } : {})
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
  const recentProbes: string[] = []
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Next dev exited early.\n${output.text}`)
    }
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
      recentProbes.push(`HTTP ${response.status}`)
      if (response.status < 500) return
    } catch (error) {
      recentProbes.push(error instanceof Error ? `${error.name}: ${error.message}` : String(error))
      // Server is still starting.
    }
    if (recentProbes.length > 8) recentProbes.shift()
    await delay(500)
  }
  throw new Error(`Timed out waiting for Next dev server. Recent probes: ${recentProbes.join('; ')}\n${output.text}`)
}

async function expectDisplay(browser: Browser, url: string, display: string) {
  const page = await browser.newPage()
  await page.goto(url)
  await page.waitForSelector('main[data-hydrated="true"]')
  await page.waitForSelector('#probe')
  await page.waitForFunction((expectedDisplay) => {
    const probe = document.getElementById('probe')
    return probe && getComputedStyle(probe).display === expectedDisplay
  }, display)
  return page
}

describe('Next dev HMR', () => {
  it('updates a direct generated CSS import when sources change or appear (turbo)', async () => {
    buildPackage()
    const workspace = join(packageDir, 'e2e/dev-hmr-workspaces')
    mkdirSync(workspace, { recursive: true })
    const fixture = mkdtempSync(join(workspace, 'direct-css-'))
    writeFixture(fixture)
    writeFileSync(join(fixture, 'app/globals.css'), '')
    writeFileSync(join(fixture, 'app/layout.jsx'), `import '../.master/next.css'; export default function RootLayout({ children }) { return <html lang="en"><body>{children}</body></html> }`)
    const port = await getFreePort(), url = `http://127.0.0.1:${port}`
    const { child, output } = startNextDev(fixture, port, 'turbo')
    let browser: Browser | undefined
    try {
      await waitForServer(url, child, output)
      browser = await chromium.launch()
      const page = await browser.newPage()
      await page.goto(url)
      await page.waitForFunction(() => getComputedStyle(document.getElementById('incremental')!).padding === '11px')
      await page.evaluate(() => { (window as Window & { __MASTER_CSS_HMR_MARKER?: string }).__MASTER_CSS_HMR_MARKER = 'preserve' })
      writePage(fixture, 77)
      await page.waitForFunction(() => getComputedStyle(document.getElementById('incremental')!).padding === '77px')
      const added = join(fixture, 'app/unimported.jsx')
      writeFileSync(added, "export const hidden = 'margin:37px'")
      await page.evaluate(() => {
        const probe = document.createElement('div')
        probe.id = 'new-source-probe'
        probe.className = "margin:37px"
        document.body.append(probe)
      })
      await page.waitForFunction(() => getComputedStyle(document.getElementById('new-source-probe')!).marginTop === '37px')
      rmSync(added)
      await page.waitForFunction(() => getComputedStyle(document.getElementById('new-source-probe')!).marginTop === '0px')
      expect(await page.evaluate(() => (window as Window & { __MASTER_CSS_HMR_MARKER?: string }).__MASTER_CSS_HMR_MARKER)).toBe('preserve')
    } finally {
      await browser?.close()
      await stopNextDev(child)
      rmSync(fixture, { recursive: true, force: true })
    }
  }, 180000)

  it('updates separated Module theme resources while preserving ancestor inheritance (webpack)', async () => {
    buildPackage()
    const workspace = join(packageDir, 'e2e/dev-hmr-workspaces')
    mkdirSync(workspace, { recursive: true })
    const fixture = mkdtempSync(join(workspace, 'module-globals-'))
    writeFixture(fixture)
    const tokens = join(fixture, 'app/tokens.css')
    writeFileSync(tokens, `@theme { --color-module: red; }
`)
    writeFileSync(join(fixture, 'app/Card.module.css'), '@reference "./tokens.css"; .card { color:var(--color-module); }')
    writeFileSync(join(fixture, 'app/page.jsx'), `import styles from './Card.module.css'; export default function Page(){ return <main className={styles.card}>Theme</main> }`)
    const port = await getFreePort(), url = `http://127.0.0.1:${port}`
    const { child, output } = startNextDev(fixture, port, 'webpack')
    let browser: Browser | undefined
    try {
      await waitForServer(url, child, output)
      browser = await chromium.launch()
      const page = await browser.newPage()
      await page.goto(url)
      await page.waitForFunction(() => getComputedStyle(document.querySelector('main')!).color === 'rgb(255, 0, 0)')
      await page.evaluate(() => document.body.style.setProperty('--color-module', 'rgb(1, 2, 3)'))
      expect(await page.locator('main').evaluate(element => getComputedStyle(element).color)).toBe('rgb(1, 2, 3)')
      writeFileSync(tokens, `@theme { --color-module: blue; }
`)
      await page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue('--color-module').trim() === 'blue')
      expect(await page.locator('main').evaluate(element => getComputedStyle(element).color)).toBe('rgb(1, 2, 3)')
      await page.evaluate(() => document.body.style.removeProperty('--color-module'))
      expect(await page.locator('main').evaluate(element => getComputedStyle(element).color)).toBe('rgb(0, 0, 255)')
    } finally {
      await browser?.close()
      await stopNextDev(child)
      rmSync(fixture, { recursive: true, force: true })
    }
  }, 180000)

  it.each(['turbo', 'webpack'] as const)('updates Master CSS without a full reload (%s)', async bundler => {
    buildPackage()
    const workspaceDir = join(packageDir, 'e2e/dev-hmr-workspaces')
    mkdirSync(workspaceDir, { recursive: true })
    const fixtureDir = mkdtempSync(join(workspaceDir, 'fixture-'))
    const port = await getFreePort()
    const url = `http://127.0.0.1:${port}`
    let browser: Browser | undefined
    const globalsPath = join(fixtureDir, 'app/globals.css')
    const metricsDir = process.env.MASTER_NEXT_HMR_REPORT ? mkdtempSync(join(tmpdir(), 'next-hmr-metrics-')) : undefined
    const pipelineReport = metricsDir && join(metricsDir, 'pipeline.jsonl')

    writeFixture(fixtureDir)
    const { child, output } = startNextDev(fixtureDir, port, bundler, pipelineReport)
    let cleaned = false
    const cleanup = async () => {
      if (cleaned) return
      cleaned = true
      await browser?.close()
      await stopNextDev(child)
      rmSync(fixtureDir, { recursive: true, force: true })
      if (metricsDir) rmSync(metricsDir, { recursive: true, force: true })
    }
    onTestFinished(cleanup)

    try {
      await waitForServer(url, child, output)
      browser = await chromium.launch()
      const page = await expectDisplay(browser, url, 'inline-flex')
      await page.waitForFunction(() => {
        const cascade = document.getElementById('cascade')
        return cascade && getComputedStyle(cascade).display === 'block'
      })
      await page.evaluate(() => {
        const markerWindow = window as unknown as { __MASTER_CSS_HMR_MARKER?: string }
        markerWindow.__MASTER_CSS_HMR_MARKER = 'preserve'
      })

      writeFileSync(globalsPath, createGlobalsCSS('flex'))
      await page.waitForFunction(() => {
        const probe = document.getElementById('probe')
        return probe && getComputedStyle(probe).display === 'flex'
      })
      const samples: { singleMs: number, burstMs: number, singleStarted: number, burstStarted: number, finished: number }[] = []
      for (let round = 0; round < 4; round++) {
        const padding = 50 + round * 20
        const singleStarted = Date.now()
        let started = performance.now()
        writePage(fixtureDir, padding)
        try {
          await page.waitForFunction(value => getComputedStyle(document.getElementById('incremental')!).padding === `${value}px`, padding)
        } catch (error) {
          const actual = await page.locator('#incremental').evaluate(element => getComputedStyle(element).padding)
          console.error(`Next ${bundler} page round ${round}: expected ${padding}px, got ${actual}`)
          throw error
        }
        const singleMs = performance.now() - started
        const burstStarted = Date.now()
        started = performance.now()
        writeModules(fixtureDir, padding + 1)
        try {
          await page.waitForFunction(value => Array.from({ length: 10 }, (_, index) =>
            getComputedStyle(document.getElementById(`module-${index}`)!).padding === `${value + index}px`).every(Boolean), padding + 1)
        } catch (error) {
          const actual = await page.evaluate(() => Array.from({ length: 10 }, (_, index) =>
            getComputedStyle(document.getElementById(`module-${index}`)!).padding))
          console.error(`Next ${bundler} module round ${round}: expected ${padding + 1}..${padding + 10}px, got ${actual.join(', ')}`)
          throw error
        }
        if (round > 0) samples.push({ singleMs, burstMs: performance.now() - started, singleStarted, burstStarted, finished: Date.now() })
      }
      if (process.env.MASTER_NEXT_HMR_REPORT && pipelineReport) {
        // Observe deferred notifications separately from the visible style update.
        await delay(1000)
        const idleStarted = Date.now()
        await delay(2000)
        const publications = readFileSync(pipelineReport, 'utf8').trim().split('\n').map(line => JSON.parse(line) as { started: number, finished: number, composeCalls: number })
        const loaderReport = join(metricsDir!, 'loaders.jsonl')
        const loaderEvents = existsSync(loaderReport) ? readFileSync(loaderReport, 'utf8').trim().split('\n').map(line => JSON.parse(line)) : []
        const idle = publications.filter(row => row.started >= idleStarted)
        appendFileSync(process.env.MASTER_NEXT_HMR_REPORT,
          JSON.stringify({ bundler, node: process.version, samples, publications, loaderEvents, idle,
            note: 'File write to observed browser computed style; one warmup, three samples. Pipeline hold/wait and loader calls are separate child-process observations. Idle observes two seconds after a one-second drain.' }) + '\n')
        expect(idle.reduce((sum, row) => sum + row.composeCalls, 0)).toBe(0)
      }
      await expect(page.evaluate(() => {
        return (window as unknown as { __MASTER_CSS_HMR_MARKER?: string }).__MASTER_CSS_HMR_MARKER
      })).resolves.toBe('preserve')
    } catch (error) {
      console.error(`Next ${bundler} output:\n${output.text}`)
      if (pipelineReport && existsSync(pipelineReport)) {
        console.error(`Next ${bundler} pipeline:\n${readFileSync(pipelineReport, 'utf8')}`)
      }
      throw error
    } finally {
      await cleanup()
    }
  }, 180000)
})
