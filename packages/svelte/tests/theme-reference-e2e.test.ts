import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { expect, it } from 'vitest'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const fixtureDir = join(packageDir, 'tests/fixtures/theme-reference')

it('delivers native theme variables to a scoped Svelte style', async () => {
  execFileSync(join(packageDir, 'node_modules/.bin/vite'), ['build'], {
    cwd: fixtureDir,
    stdio: 'pipe',
    timeout: 120_000
  })

  const outputDir = join(fixtureDir, '.svelte-kit/output')
  const html = readFileSync(join(outputDir, 'prerendered/pages/index.html'), 'utf8')
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
  const css = stylesheets.map(readCSS).join('\n')
  expect(css).toMatch(/\.probe\.svelte-[\w-]+/)
  expect(css).toContain('--color-probe:#123456')
  expect(css).toContain('--color-probe:#abcdef')
  expect(css).not.toContain('@reference')

  const server = createServer((request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
    const file = pathname === '/' ? join(outputDir, 'prerendered/pages/index.html') : join(outputDir, 'client', pathname)
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
    }
  } finally {
    await browser.close()
    await new Promise<void>(resolve => server.close(() => resolve()))
  }
}, 120_000)
