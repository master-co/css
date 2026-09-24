import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import { themeInstallationFixture, themeInstallationRoutes } from '../theme-installation-examples'

const fixtures = new Map<string, ReturnType<typeof themeInstallationFixture>>()
test.beforeAll(() => {
  test.setTimeout(120_000)
  for (const route of themeInstallationRoutes) fixtures.set(route, themeInstallationFixture(route))
})
test.afterAll(() => { for (const fixture of fixtures.values()) fixture.dispose() })
async function serve(page: Page, fixture: ReturnType<typeof themeInstallationFixture>) {
  await page.route(/^https:\/\/(theme-app|theme-cdn)\.test\//, request => {
    const url = new URL(request.request().url())
    if (url.hostname === 'theme-app.test' && url.pathname === '/') return request.fulfill({ contentType: 'text/html', body: fixture.html })
    const path = url.pathname.replace('/wp-content/themes/child', '')
    const file = resolve(fixture.root, '.' + path)
    if (!file.startsWith(fixture.root + '/')) return request.abort()
    const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm' }
    return request.fulfill({ body: readFileSync(file), contentType: types[extname(file)] ?? 'application/octet-stream', headers: { 'access-control-allow-origin': '*' } })
  })
  await page.goto('https://theme-app.test/')
}
for (const route of themeInstallationRoutes) test(`authored theme assets render ${route}`, async ({ page, browser }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  const fixture = fixtures.get(route)!
  await serve(page, fixture)
  const heading = page.getByRole('heading', { name: 'Hello World' })
  expect(await heading.evaluate(element => [...element.classList].sort())).toEqual(
    ['m-md', 'italic', 'font-3xl', 'font-heavy', 'text-strong'].sort(),
  )
  await expect(heading).toHaveCSS('font-style', 'italic')
  await expect(heading).toHaveCSS('margin-top', '16px')
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: page.viewportSize()! })
  try {
    const noScript = await context.newPage()
    await serve(noScript, fixture)
    const initial = noScript.getByRole('heading', { name: 'Hello World' })
    await expect(initial).toBeVisible()
    if (!fixture.runtime) {
      await expect(initial).toHaveCSS('font-style', 'italic')
      await expect(initial).toHaveCSS('margin-top', '16px')
    } else await expect(initial).not.toHaveCSS('font-style', 'italic')
  } finally { await context.close() }
  if (fixture.runtime) {
    await heading.evaluate(element => element.classList.add('p-xl'))
    await expect(heading).toHaveCSS('padding-top', '32px')
  }
  expect(errors).toEqual([])
})
