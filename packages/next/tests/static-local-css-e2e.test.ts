import { execFileSync } from 'node:child_process'
import { createServer } from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { beforeAll, expect, it } from 'vitest'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
beforeAll(() => {
  execFileSync('pnpm', ['--dir', packageDir, 'build'], { cwd: packageDir, stdio: 'pipe', timeout: 120_000 })
})

it.each([
  ['static-local-css', '--turbo', false],
  ['static-local-css', '--webpack', false],
  ['static-module-reference', '--webpack', true],
  ['static-module-reference', '--turbo', true]
] as const)('delivers project theme variables without @reference in Next %s %s mode', async (fixture, builder, moduleStyle) => {
  const fixtureDir = join(packageDir, 'e2e', fixture)
  const outDir = join(fixtureDir, 'out')
  execFileSync(join(packageDir, 'node_modules/.bin/next'), ['build', builder], {
    cwd: fixtureDir,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
    stdio: 'pipe',
    timeout: 120_000
  })

  const html = readFileSync(join(outDir, 'index.html'), 'utf8')
  const css = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)]
    .map(([link]) => link.match(/href="([^"]+)"/)?.[1])
    .filter((href): href is string => Boolean(href))
    .map(href => readFileSync(join(outDir, href), 'utf8'))
    .join('\n')
  if (!moduleStyle) {
    expect(css).toContain('.probe')
    expect(css).toContain('var(--color-probe)')
    expect(css).toContain('--color-probe:#123456')
    expect(css).toContain('--color-probe:#abcdef')
  } else {
    // Webpack retains a publication import; Turbopack may bundle the global CSS.
    if (builder === '--webpack') expect(css).toContain('@import')
    expect(css).not.toMatch(/\.[\w-]+\{--color-probe:/)
  }
  expect(css).not.toContain('@reference')

  const server = createServer((request, response) => {
    const url = new URL(request.url || '/', 'http://localhost')
    const pathname = url.pathname
    const route = pathname === '/' ? '/index' : pathname
    const file = join(outDir, !extname(pathname)
      ? route + (request.headers.rsc === '1' || url.searchParams.has('_rsc') ? '.txt' : '.html')
      : pathname)
    if (relative(outDir, file).startsWith('..') || !existsSync(file)) {
      response.writeHead(404).end()
      return
    }
    const type = ({ '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.txt': 'text/x-component' } as Record<string, string>)[extname(file)] || 'application/octet-stream'
    response.writeHead(200, { 'content-type': type }).end(readFileSync(file))
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const browser = await chromium.launch()
  try {
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Missing test server port')
    for (const [colorScheme, expected] of [['light', 'rgb(18, 52, 86)'], ['dark', 'rgb(171, 205, 239)']] as const) {
      const page = await browser.newPage({ colorScheme })
      const errors: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
      try {
        await page.goto(`http://127.0.0.1:${address.port}/`)
        expect(await page.locator('main').evaluate(element => getComputedStyle(element).color)).toBe(expected)
        if (moduleStyle) {
          await expect.poll(() => page.locator('main').evaluate(element => getComputedStyle(element).opacity)).toBe('0.5')
          await page.evaluate(() => document.body.setAttribute('data-theme', 'ocean'))
          for (const [link, pathname] of [['Other route', '/other'], ['Home route', '/']] as const) {
            await page.getByRole('link', { name: link }).click()
            await page.waitForURL(`http://127.0.0.1:${address.port}${pathname}`)
            // The attribute survives client navigation; each route's different
            // CSS Module must preserve the same generated theme cascade.
            expect(await page.locator('body').getAttribute('data-theme')).toBe('ocean')
            expect(await page.locator('main').evaluate(element => getComputedStyle(element).color)).toBe('rgb(8, 47, 73)')
          }
          await page.evaluate(() => document.body.removeAttribute('data-theme'))
          expect(await page.locator('main').evaluate(element => getComputedStyle(element).color)).toBe(expected)
          await page.evaluate(() => document.body.style.setProperty('--color-probe', 'rgb(1, 2, 3)'))
          expect(await page.locator('main').evaluate(element => getComputedStyle(element).color)).toBe('rgb(1, 2, 3)')
          await page.evaluate(() => {
            document.body.style.removeProperty('--color-probe')
            document.body.setAttribute('data-theme', 'ocean')
            const copy = document.querySelector('main')!.cloneNode(true)
            document.body.append(copy)
          })
          expect(await page.locator('main').evaluateAll(elements => elements.map(element => getComputedStyle(element).color))).toEqual(['rgb(8, 47, 73)', 'rgb(8, 47, 73)'])
        }
        expect(errors).toEqual([])
      } finally {
        await page.close()
      }
    }
  } finally {
    await browser.close()
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  }
})
