import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { dirname, extname, join, normalize, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { beforeAll, expect, it } from 'vitest'
import { MASTER_CSS_HYDRATION_MANIFEST_ATTR } from '@master/css-schema/hydration-manifest'
import { MASTER_CSS_STYLESHEET_ASSET_SUFFIX } from '@master/css-schema/runtime-style'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const fixtureDir = join(packageDir, 'tests/fixtures/progressive')
const outDir = join(fixtureDir, 'dist')
const astroCLI = join(dirname(createRequire(import.meta.url).resolve('astro/package.json')), 'bin/astro.mjs')
const contentTypes: Record<string, string> = {
  '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm'
}

type RuntimeGlobal = typeof globalThis & {
  masterCSSRuntime?: { snapshot(): { observing: boolean, hydration: unknown } }
}

beforeAll(() => {
  execFileSync(process.execPath, [astroCLI, 'build'], {
    cwd: fixtureDir,
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
    stdio: 'pipe',
    timeout: 120_000
  })
}, 120_000)

it('pre-renders progressive CSS through the middleware of a static Astro build', () => {
  const html = readFileSync(join(outDir, 'index.html'), 'utf8')
  const style = html.match(/<style\b[^>]*\bid="master-css"[^>]*>([\s\S]*?)<\/style>/)
  expect(style?.[1]).toContain('font-weight:700')
  expect(style?.[1]).toContain('margin-top:12px')
  // The linked stylesheet already defines the token the utility shares with it.
  expect(style?.[1]).not.toContain('--color-text-body:')
  const manifest = style?.[0].match(new RegExp(`${MASTER_CSS_HYDRATION_MANIFEST_ATTR}="([^"]+)"`))?.[1]
  expect(manifest).toBeTruthy()
  expect(existsSync(join(outDir, manifest!))).toBe(true)
  // The runtime adopts linked stylesheets through their sidecars.
  const stylesheets = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map(([, href]) => href)
  expect(stylesheets.length).toBeGreaterThan(0)
  for (const href of stylesheets) {
    const sidecar = JSON.parse(readFileSync(join(outDir, href + MASTER_CSS_STYLESHEET_ASSET_SUFFIX), 'utf8'))
    expect(sidecar.version).toBe(1)
  }
})

// Astro builds the runtime in a client bundle that never imports the page CSS.
it('hydrates the pre-rendered CSS in a browser', async () => {
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url || '/', 'http://127.0.0.1').pathname
    const file = normalize(join(outDir, pathname === '/' ? 'index.html' : pathname))
    if (relative(outDir, file).startsWith('..')) return void response.writeHead(403).end()
    try {
      const body = await readFile(file)
      response.writeHead(200, { 'content-type': contentTypes[extname(file)] ?? 'application/octet-stream' }).end(body)
    } catch {
      response.writeHead(404).end()
    }
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    const warnings: string[] = []
    page.on('console', message => { if (message.type() === 'warning') warnings.push(message.text()) })
    const address = server.address()
    await page.goto(`http://127.0.0.1:${typeof address === 'object' && address?.port}/`)
    await page.waitForFunction(() => (globalThis as RuntimeGlobal).masterCSSRuntime?.snapshot().observing)
    expect(await page.evaluate(() => (globalThis as RuntimeGlobal).masterCSSRuntime!.snapshot().hydration))
      .toEqual({ state: 'progressive', manifestLoaded: true })
    expect(warnings).toEqual([])
  } finally {
    await browser.close()
    server.close()
  }
}, 60_000)
