import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import { bundlerInstallationFixture, bundlerInstallationRoutes } from '../bundler-installation-examples'

const fixtures = new Map<string, ReturnType<typeof bundlerInstallationFixture>>()
test.beforeAll(() => {
  test.setTimeout(180_000)
  for (const route of bundlerInstallationRoutes) fixtures.set(route, bundlerInstallationFixture(route))
})
test.afterAll(() => { for (const fixture of fixtures.values()) fixture.dispose() })
async function serve(page: Page, root: string) {
  await page.route('http://bundler-app.test/**', request => {
    const pathname = new URL(request.request().url()).pathname
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname))
    if (!file.startsWith(root + '/')) return request.abort()
    const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm' }
    return request.fulfill({ body: readFileSync(file), contentType: types[extname(file)] ?? 'application/octet-stream' })
  })
  await page.goto('http://bundler-app.test/')
}
for (const route of bundlerInstallationRoutes) test(`authored bundler build renders ${route}`, async ({ page, browser }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  const root = fixtures.get(route)!.root
  await serve(page, root)
  const heading = page.getByRole('heading', { name: 'Hello World' })
  // Production HTML minimizers may sort attributes' class tokens.
  expect(await heading.evaluate(element => [...element.classList].sort())).toEqual(
    ['m-md', 'italic', 'font-3xl', 'font-heavy', 'text-strong'].sort(),
  )
  await expect(heading).toHaveCSS('font-style', 'italic')
  await expect(heading).toHaveCSS('margin-top', '16px')
  if (route.endsWith('/static-rendering')) {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: page.viewportSize()! })
    try {
      const noScript = await context.newPage()
      await serve(noScript, root)
      await expect(noScript.getByRole('heading', { name: 'Hello World' })).toHaveCSS('font-style', 'italic')
      await expect(noScript.getByRole('heading', { name: 'Hello World' })).toHaveCSS('margin-top', '16px')
    } finally { await context.close() }
  }
  expect(errors).toEqual([])
})
