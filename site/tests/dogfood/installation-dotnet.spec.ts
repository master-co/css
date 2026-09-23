import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import { dotnetInstallationFixture, dotnetInstallationRoutes } from '../dotnet-installation-examples'

const fixtures = new Map<string, ReturnType<typeof dotnetInstallationFixture>>()
test.beforeAll(() => {
  test.setTimeout(180_000)
  for (const route of dotnetInstallationRoutes) fixtures.set(route, dotnetInstallationFixture(route))
})
test.afterAll(() => { for (const fixture of fixtures.values()) fixture.dispose() })

async function serve(page: Page, fixture: ReturnType<typeof dotnetInstallationFixture>) {
  await page.route('https://dotnet-assets.test/**', request => {
    const pathname = new URL(request.request().url()).pathname
    if (!pathname.startsWith('/nested/')) return request.abort()
    const relative = pathname.slice('/nested/'.length)
    const file = resolve(fixture.root, relative || 'index.html')
    if (!file.startsWith(fixture.root + '/')) return request.abort()
    const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm' }
    return request.fulfill({ body: readFileSync(file), contentType: types[extname(file)] ?? 'application/octet-stream' })
  })
  await page.goto('https://dotnet-assets.test/nested/')
}

for (const route of dotnetInstallationRoutes) test(`authored .NET assets render ${route}`, async ({ page, browser }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  const fixture = fixtures.get(route)!
  await serve(page, fixture)
  const heading = page.getByRole('heading', { name: 'Hello World' })
  await expect(heading).toHaveCSS('font-style', 'italic')
  await expect(heading).toHaveCSS('margin-top', '16px')
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: page.viewportSize()! })
  try {
    const noScript = await context.newPage()
    await serve(noScript, fixture)
    const initial = noScript.getByRole('heading', { name: 'Hello World' })
    await expect(initial).toBeVisible()
    if (route.endsWith('/static-rendering')) await expect(initial).toHaveCSS('font-style', 'italic')
    else await expect(initial).not.toHaveCSS('font-style', 'italic')
  } finally { await context.close() }
  if (!route.endsWith('/static-rendering')) {
    await heading.evaluate(element => element.classList.add('p:xl'))
    await expect(heading).toHaveCSS('padding-top', '32px')
    // A real DOM replacement checks observation, not Blazor enhanced navigation.
    await heading.evaluate(element => {
      const replacement = document.createElement('h2')
      replacement.textContent = 'Updated content'
      replacement.className = 'p:lg italic'
      element.replaceWith(replacement)
    })
    await expect(page.getByRole('heading', { name: 'Updated content' })).toHaveCSS('padding-top', '24px')
  }
  expect(errors).toEqual([])
})
