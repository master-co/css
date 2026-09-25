import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, relative } from 'node:path'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { gzipSync, brotliCompressSync } from 'node:zlib'
import { chromium } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { MASTER_CSS_HYDRATION_MANIFEST_ATTR } from '@master/css-schema/hydration-manifest'
import execPnpmSync from './helpers/pnpm-command'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const fixtureDir = join(packageDir, 'e2e/static-export')
const outDir = join(fixtureDir, 'out')

function buildFixture() {
  try {
    execPnpmSync(['--dir', fixtureDir, 'build'], {
      cwd: packageDir,
      encoding: 'utf-8',
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: '1'
      },
      stdio: 'pipe',
      timeout: 120000
    })
  } catch (error) {
    const buildError = error as Error & { stdout?: string | Buffer, stderr?: string | Buffer }
    throw new Error([
      buildError.message,
      buildError.stdout?.toString(),
      buildError.stderr?.toString()
    ].filter(Boolean).join('\n'))
  }
}

function collectHTMLFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const filePath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectHTMLFiles(filePath))
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(filePath)
    }
  }
  return files
}

function collectHydrationManifestSources(html: string) {
  return [...html.matchAll(new RegExp(`${MASTER_CSS_HYDRATION_MANIFEST_ATTR}="([^"]+)"`, 'g'))]
    .map((match) => match[1])
}

describe('static export e2e', () => {
  it('exports hydration assets and adopts them in the browser before dynamic updates', async () => {
    buildFixture()

    const htmlFiles = collectHTMLFiles(outDir)
    const manifestSources = htmlFiles.flatMap((htmlFile) =>
      collectHydrationManifestSources(readFileSync(htmlFile, 'utf-8'))
    )

    expect(htmlFiles.map((file) => relative(outDir, file).replaceAll('\\', '/'))).toEqual(expect.arrayContaining([
      'index.html',
      'nested.html'
    ]))
    expect(manifestSources.length).toBeGreaterThan(0)
    expect(existsSync(join(fixtureDir, '.next/static/master-css/hydration'))).toBe(false)

    for (const source of manifestSources) {
      const pathname = new URL(source, 'http://localhost').pathname
      const manifestFile = join(outDir, ...pathname.split('/').filter(Boolean))
      expect(pathname).toMatch(/^\/_next\/static\/master-css\/hydration\/master-css-hydration\.[0-9a-f]{8}\.json$/)
      expect(existsSync(manifestFile), `${source} should exist in the static export`).toBe(true)
      const manifest = JSON.parse(readFileSync(manifestFile, 'utf-8'))
      expect(manifest.version).toBe(1)
      expect(manifest.languageVersion).toBe(3)
      expect(manifest.rules.length).toBeGreaterThan(0)
    }
    const requests: { path: string; raw: number; gzip: number; brotli: number }[] = []
    const server = createServer((request, response) => {
      const pathname = new URL(request.url || '/', 'http://localhost').pathname
      const file = join(outDir, pathname === '/' ? 'index.html' : pathname)
      if (relative(outDir, file).startsWith('..') || !existsSync(file)) {
        response.writeHead(404).end()
        return
      }
      const content = readFileSync(file)
      const type = ({ '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm' } as Record<string, string>)[extname(file)] || 'application/octet-stream'
      requests.push({ path: pathname, raw: content.length, gzip: gzipSync(content, { level: 9 }).length, brotli: brotliCompressSync(content).length })
      response.writeHead(200, { 'content-type': type }).end(content)
    })
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    const browser = await chromium.launch()
    try {
      const page = await browser.newPage()
      const address = server.address() as { port: number }
      await page.goto(`http://127.0.0.1:${address.port}`)
      await page.waitForFunction(() => (globalThis as any).__MASTER_CSS_NEXT_RUNTIME__?.runtime?.snapshot().hydration.state === 'progressive')
      expect(await page.locator('main').evaluate(element => getComputedStyle(element).fontSize)).toBe('40px')
      await page.locator('main').evaluate(element => element.classList.add('padding:17px'))
      await expect.poll(() => page.locator('main').evaluate(element => getComputedStyle(element).padding)).toBe('17px')
      expect(requests.some(request => request.path.endsWith('.wasm'))).toBe(true)
      expect(requests.some(request => request.path.includes('/static/media/') && request.path.endsWith('.json'))).toBe(false)
      if (process.env.MASTER_CSS_NEXT_PAYLOAD_REPORT) writeFileSync(process.env.MASTER_CSS_NEXT_PAYLOAD_REPORT, JSON.stringify({
        languageVersion: 3, delivery: 'bundler-esm', requests,
        compression: 'Measured from fetched response bodies; local test server sends uncompressed responses.',
        timing: await page.evaluate(() => performance.getEntriesByType('resource').map(entry => {
          const resource = entry as PerformanceResourceTiming
          return { name: resource.name, transferSize: resource.transferSize, encodedBodySize: resource.encodedBodySize, duration: resource.duration }
        }))
      }, null, 2))
    } finally {
      await browser.close()
      server.closeAllConnections()
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    }
  })
})
