import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import { angularInstallationFixture } from '../angular-installation-examples'

const fixtures = new Map<string, ReturnType<typeof angularInstallationFixture>>()
const runtime = 'https://cdn.master.co/css-runtime@rc'
const asset = (name: string) => readFileSync(new URL(`../../../packages/${name}`, import.meta.url))
test.beforeAll(() => {
  test.setTimeout(180000)
  for (const mode of ['runtime', 'static'] as const) fixtures.set(mode, angularInstallationFixture(mode))
})
test.afterAll(() => { for (const fixture of fixtures.values()) fixture.dispose() })

for (const mode of ['runtime', 'static'] as const) test(`Angular application delivers authored ${mode} styles`, async ({ page }) => {
  const errors: string[] = []
  const requests: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', event => { if (event.type() === 'error') errors.push(event.text()) })
  page.on('request', request => requests.push(request.url()))
  await page.route('https://cdn.master.co/css@rc/base.css', route => route.fulfill({ contentType: 'text/css', body: asset('preset/src/base.css') }))
  await page.route(runtime, route => route.fulfill({ contentType: 'text/javascript', body: asset('runtime/dist/global.min.js') }))
  await page.route(runtime + '/default-manifest.json', route => route.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: asset('runtime/dist/default-manifest.json') }))
  await page.route('**/mastercss_binding_wasm_engine_bg.wasm', route => route.fulfill({ contentType: 'application/wasm', headers: { 'access-control-allow-origin': '*' }, body: asset('runtime/artifacts/mastercss_binding_wasm_engine_bg.wasm') }))
  const fixture = fixtures.get(mode)!
  await page.route('https://angular-doc.test/**', route => {
    const pathname = new URL(route.request().url()).pathname
    const file = resolve(fixture.root, '.' + (pathname === '/' ? '/index.html' : pathname))
    if (!file.startsWith(fixture.root + '/')) return route.abort()
    const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }
    return route.fulfill({ contentType: types[extname(file)] ?? 'application/octet-stream', body: readFileSync(file) })
  })
  await page.goto('https://angular-doc.test/')
  const heading = page.getByRole('heading', { name: 'Hello World' })
  await expect(heading).toHaveCSS('font-style', 'italic')
  await expect(heading).toHaveCSS('margin-top', '16px')
  await expect(page.locator('app-root')).toHaveAttribute('ng-version', /^22\./)
  expect(errors).toEqual([])
  if (mode === 'runtime') {
    await heading.evaluate(element => element.classList.add('p-xl'))
    await expect(heading).toHaveCSS('padding-top', '32px')
    expect(errors).toEqual([])
    await page.route(runtime, route => route.abort())
    // A failed CSS runtime must not prevent Angular from mounting its content.
    await page.reload()
    await expect(heading).toBeVisible()
    await expect(heading).toHaveCSS('font-style', 'normal')
  } else {
    expect(requests.some(url => url.includes('cdn.master.co') || url.endsWith('.wasm'))).toBe(false)
  }
  expect(errors.filter(error => !error.includes('Failed to load resource'))).toEqual([])
})
