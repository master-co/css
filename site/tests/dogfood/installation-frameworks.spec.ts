import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import { frameworkInstallationFixture, frameworkInstallationRoutes } from '../framework-installation-examples'
import { ready } from './interactions-helpers'

const fixtures = new Map<string, ReturnType<typeof frameworkInstallationFixture>>()
test.beforeAll(() => {
  for (const route of frameworkInstallationRoutes) fixtures.set(route, frameworkInstallationFixture(route))
})
test.afterAll(() => { for (const fixture of fixtures.values()) fixture.dispose() })

for (const route of frameworkInstallationRoutes) test(`authored framework build renders ${route}`, async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  const fixture = fixtures.get(route)!
  await page.route('http://installation-app.test/**', request => {
    const path = new URL(request.request().url()).pathname
    const file = resolve(fixture.root, '.' + (path === '/' ? '/index.html' : path))
    if (!file.startsWith(fixture.root + '/')) return request.abort()
    const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm' }
    return request.fulfill({ body: readFileSync(file), contentType: types[extname(file)] ?? 'application/octet-stream' })
  })
  await page.goto('http://installation-app.test/')
  if (route === '/lit') {
    const element = page.locator('my-element')
    const button = element.getByRole('button', { name: 'Hello Lit' })
    await expect(button).toHaveCSS('padding-top', '12px')
    await expect.poll(() => element.evaluate((host: any) => Boolean(host.masterCSSRuntime?.snapshot().observing))).toBe(true)
    expect(await button.evaluate(button => button.getRootNode() instanceof ShadowRoot)).toBe(true)
    const color = await button.evaluate(button => getComputedStyle(button).backgroundColor)
    expect(color).not.toBe('rgba(0, 0, 0, 0)')
    await button.evaluate(button => button.setAttribute('class', 'px:control-x py:control-y r:control bg:control-hover fg:white'))
    await expect.poll(() => button.evaluate(button => getComputedStyle(button).backgroundColor)).not.toBe(color)
    expect(await element.evaluate((host: any) => {
      (window as any).installationHost = host
      host.remove()
      return host.masterCSSRuntime === undefined
    })).toBe(true)
    await page.evaluate(() => document.body.append((window as any).installationHost))
    await expect.poll(() => element.evaluate((host: any) => Boolean(host.masterCSSRuntime?.snapshot().observing))).toBe(true)
    await expect(button).toHaveCSS('padding-top', '12px')
    await button.focus()
    await expect(button).toBeFocused()
  } else {
    const heading = page.getByRole('heading', { name: 'Hello World' })
    await expect(heading).toHaveAttribute('class', 'm:md italic font:3xl font:heavy text:strong')
    await expect(heading).toHaveCSS('font-style', 'italic')
    await expect(heading).toHaveCSS('margin-top', '16px')
  }
  expect(errors).toEqual([])
})

test('shadow-root gallery keeps stylesheet boundaries and keyboard focus', async ({ page }, info) => {
  await page.goto('/en/design-system#project-style-recipes')
  const demo = page.locator('[data-project-style="shadow-root-gallery"]')
  const frame = await ready(demo)
  const button = frame.getByRole('button', { name: 'Hello Lit' })
  await expect(button).toHaveCSS('padding-top', '12px')
  expect(await button.evaluate(button => button.getRootNode() instanceof ShadowRoot)).toBe(true)
  await button.focus()
  await expect(button).toBeFocused()
  await page.evaluate(() => document.fonts.ready)
  await demo.screenshot({ path: info.outputPath('shadow-root.png'), scale: 'css', style: 'nav.app-wrapper,nextjs-portal{visibility:hidden}' })
})
