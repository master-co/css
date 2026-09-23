import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import { serverInstallationFixture, serverInstallationRoutes } from '../server-installation-examples'

const fixtures = new Map<string, Awaited<ReturnType<typeof serverInstallationFixture>>>()
test.beforeAll(async () => {
  test.setTimeout(180_000)
  for (const route of serverInstallationRoutes) fixtures.set(route, await serverInstallationFixture(route))
})
test.afterAll(async () => { for (const fixture of fixtures.values()) await fixture.dispose() })
async function serve(page: Page, fixture: Awaited<ReturnType<typeof serverInstallationFixture>>) {
  if (fixture.url) { await page.goto(fixture.url); return }
  await page.route('http://rails-assets.test/**', request => {
    const pathname = new URL(request.request().url()).pathname
    const file = resolve(fixture.root, '.' + (pathname === '/' ? '/index.html' : pathname))
    if (!file.startsWith(fixture.root + '/')) return request.abort()
    const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm' }
    return request.fulfill({ body: readFileSync(file), contentType: types[extname(file)] ?? 'application/octet-stream' })
  })
  await page.goto('http://rails-assets.test/')
}
for (const route of serverInstallationRoutes) test(`authored server assets render ${route}`, async ({ page, browser }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  const fixture = fixtures.get(route)!
  await serve(page, fixture)
  const heading = page.getByRole('heading', { name: 'Hello World' })
  expect(await heading.evaluate(element => [...element.classList].sort())).toEqual(
    ['m:md', 'italic', 'font:3xl', 'font:heavy', 'text:strong'].sort(),
  )
  await expect(heading).toHaveCSS('font-style', 'italic')
  await expect(heading).toHaveCSS('margin-top', '16px')
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: page.viewportSize()! })
  try {
    const noScript = await context.newPage()
    await serve(noScript, fixture)
    const initial = noScript.getByRole('heading', { name: 'Hello World' })
    await expect(initial).toBeVisible()
    if (route === '/express' || route.endsWith('/static-rendering')) {
      await expect(initial).toHaveCSS('font-style', 'italic')
      await expect(initial).toHaveCSS('margin-top', '16px')
    } else await expect(initial).not.toHaveCSS('font-style', 'italic')
  } finally { await context.close() }
  if (!route.endsWith('/static-rendering')) {
    // Actual class insertion and node replacement; this does not simulate Turbo.
    await heading.evaluate(element => element.classList.add('p:xl'))
    await expect(heading).toHaveCSS('padding-top', '32px')
    await heading.evaluate(element => {
      const next = document.createElement('h2')
      next.textContent = 'Updated content'
      next.className = 'p:lg italic'
      element.replaceWith(next)
    })
    const next = page.getByRole('heading', { name: 'Updated content' })
    await expect(next).toHaveCSS('padding-top', '24px')
    await expect(next).toHaveCSS('font-style', 'italic')
  }
  expect(errors).toEqual([])
})
