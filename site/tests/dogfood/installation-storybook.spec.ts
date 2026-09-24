import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import { storybookInstallationFixture, storybookModes } from '../storybook-installation-examples'

const fixtures = new Map<string, ReturnType<typeof storybookInstallationFixture>>()
test.beforeAll(() => {
  test.setTimeout(120_000)
  for (const mode of storybookModes) fixtures.set(mode, storybookInstallationFixture(mode))
})
test.afterAll(() => { for (const fixture of fixtures.values()) fixture.dispose() })

for (const mode of storybookModes) test(`authored story preview renders ${mode}`, async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  const fixture = fixtures.get(mode)!
  await page.route('https://story-assets.test/**', request => {
    const pathname = new URL(request.request().url()).pathname
    if (pathname === '/') return request.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><title>Isolated preview fixture</title></head><body><p>Host document</p><iframe title="Story preview" src="/iframe.html"></iframe></body></html>' })
    const file = resolve(fixture.root, '.' + (pathname === '/iframe.html' ? '/index.html' : pathname))
    if (!file.startsWith(fixture.root + '/')) return request.abort()
    const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm' }
    return request.fulfill({ body: readFileSync(file), contentType: types[extname(file)] ?? 'application/octet-stream' })
  })
  await page.goto('https://story-assets.test/')
  const frame = page.frameLocator('iframe')
  const heading = frame.getByRole('heading', { name: 'Hello World' })
  await expect(heading).toHaveCSS('font-style', 'italic')
  await expect(heading).toHaveCSS('margin-top', '16px')
  expect(await page.evaluate(() => document.styleSheets.length)).toBe(0)
  if (mode !== 'app-static') {
    await heading.evaluate(element => element.classList.add('p-xl'))
    await expect(heading).toHaveCSS('padding-top', '32px')
  }
  expect(errors).toEqual([])
})
