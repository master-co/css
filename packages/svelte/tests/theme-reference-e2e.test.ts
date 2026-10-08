import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { expect, it } from 'vitest'
import { createServer as createViteServer } from 'vite'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const fixtureDir = join(packageDir, 'tests/fixtures/theme-reference')
const viteCLI = join(dirname(createRequire(import.meta.url).resolve('vite/package.json')), 'bin/vite.js')

it('delivers referenced resources without leaking route-owned native overrides', async () => {
  execFileSync(process.execPath, [viteCLI, 'build'], {
    cwd: fixtureDir,
    stdio: 'pipe',
    timeout: 120_000
  })

  const outputDir = join(fixtureDir, '.svelte-kit/output')
  const routeCSS = (page: string): string => {
    const html = readFileSync(join(outputDir, 'prerendered/pages', page), 'utf8')
    const stylesheets = [...html.matchAll(/<link\b[^>]*href="([^"]+\.css)"[^>]*rel="stylesheet"/g)].map(([, href]) => href)
    expect(stylesheets.length).toBeGreaterThan(0)
    const seen = new Set<string>()
    const readCSS = (href: string): string => {
      if (seen.has(href)) return ''
      seen.add(href)
      const css = readFileSync(join(outputDir, 'client', href), 'utf8')
      const imported = [...css.matchAll(/@import\s+"([^"]+)"/g)]
        .map(([, specifier]) => readCSS(new URL(specifier, new URL(href, 'http://localhost')).pathname))
      return [...imported, css].join('\n')
    }
    return stylesheets.map(readCSS).join('\n')
  }
  const loadedCSS = routeCSS('index.html'), unloadedCSS = routeCSS('unloaded.html')
  for (const css of [loadedCSS, unloadedCSS]) {
    expect(css).toMatch(/\.probe\.svelte-[\w-]+/)
    expect(css).toMatch(/--color-probe:\s*#123456/)
    expect(css).toContain('@keyframes project-pulse')
    expect(css).not.toContain('@reference')
  }
  expect(loadedCSS).toMatch(/--color-probe:\s*#abcdef/)
  expect(unloadedCSS).not.toMatch(/--color-probe:\s*#abcdef/)
  expect(loadedCSS).toContain('.never-loaded')
  expect(unloadedCSS).not.toContain('.never-loaded')
  expect(unloadedCSS).not.toContain('.probe-tone{')

  const server = createServer((request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
    const file = pathname === '/' ? join(outputDir, 'prerendered/pages/index.html')
      : pathname === '/unloaded' ? join(outputDir, 'prerendered/pages/unloaded.html')
        : join(outputDir, 'client', pathname)
    try {
      response.setHeader('Content-Type', pathname.endsWith('.css') ? 'text/css' : pathname.endsWith('.js') ? 'text/javascript' : 'text/html')
      response.end(readFileSync(file))
    } catch {
      response.writeHead(404).end()
    }
  })
  await new Promise<void>(resolve => server.listen(0, resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Expected an HTTP port')
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.goto(`http://localhost:${address.port}/`)
    for (const [scheme, color] of [['light', 'rgb(18, 52, 86)'], ['dark', 'rgb(171, 205, 239)']] as const) {
      await page.emulateMedia({ colorScheme: scheme })
      expect(await page.locator('.probe').evaluate(element => getComputedStyle(element).color)).toBe(color)
      expect(await page.locator('.probe').evaluate(element => getComputedStyle(element).opacity)).toBe('0.5')
    }
    await page.locator('a[href="/unloaded"]').click()
    await page.waitForURL('**/unloaded')
    expect(await page.locator('.probe').evaluate(element => getComputedStyle(element).color)).toBe('rgb(171, 205, 239)')
    const isolated = await browser.newPage({ colorScheme: 'light' })
    await isolated.goto(`http://localhost:${address.port}/unloaded`)
    expect(await isolated.locator('.probe').evaluate(element => getComputedStyle(element).color)).toBe('rgb(18, 52, 86)')
    expect(await isolated.locator('.probe').evaluate(element => getComputedStyle(element).opacity)).toBe('0.5')
  } finally {
    await browser.close()
    await new Promise<void>(resolve => server.close(() => resolve()))
  }
}, 120_000)

it('hot-updates added and edited entries, then reloads after an entry is deleted', async () => {
  const directory = mkdtempSync(join(packageDir, 'tests/fixtures/theme-hmr-'))
  cpSync(fixtureDir, directory, { recursive: true, filter: source => !source.includes('/.svelte-kit') })
  const entry = join(directory, 'src/routes/globals.css')
  writeFileSync(join(directory, 'src/routes/+page.svelte'), '<main class="probe">HMR probe</main><style>.probe{color:var(--color-probe,fuchsia)}</style>')
  writeFileSync(join(directory, 'src/routes/unloaded/+page.svelte'), '<main>Other route</main>')
  rmSync(entry)
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined
  let server: Awaited<ReturnType<typeof createViteServer>> | undefined
  const previousDirectory = process.cwd()
  try {
    process.chdir(directory)
    server = await createViteServer({ configFile: join(directory, 'vite.config.ts'), logLevel: 'silent', server: { host: '127.0.0.1', port: 0 } })
    await server.listen()
    browser = await chromium.launch()
    const page = await browser.newPage()
    let loads = 0
    page.on('load', () => { loads++ })
    await page.goto(server.resolvedUrls!.local[0])
    const color = () => page.locator('.probe').evaluate(element => getComputedStyle(element).color)
    expect(await color()).toBe('rgb(255, 0, 255)')
    expect(loads).toBe(1)
    for (const [value, expected] of [['blue', 'rgb(0, 0, 255)'], ['red', 'rgb(255, 0, 0)'], [null, 'rgb(255, 0, 255)']] as const) {
      if (value) writeFileSync(entry, `@import "@master/css";@theme {--color-probe:${value}}`)
      else rmSync(entry)
      await expect.poll(color, { timeout: 15_000 }).toBe(expected)
      if (value) expect(loads).toBe(1)
    }
    expect(loads).toBeGreaterThan(1)
  } finally {
    try {
      await browser?.close()
      await server?.close()
    } finally {
      process.chdir(previousDirectory)
      rmSync(directory, { recursive: true, force: true })
    }
  }
}, 120_000)
