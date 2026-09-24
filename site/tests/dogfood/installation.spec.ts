import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { installationRoutes, installationSource } from '../installation-examples'
import { deliveryFences } from '../delivery-examples'
import { ready } from './interactions-helpers'

const previous = JSON.parse(readFileSync(new URL('../installation-heading-ids.json', import.meta.url), 'utf8')) as Record<string, { id: string }[]>
const captureStyle = 'nav.app-wrapper,nextjs-portal{visibility:hidden}'
function errorsFor(page: Page) {
  const errors: string[] = []
  page.on('pageerror', event => errors.push(event.message))
  page.on('console', event => { if (event.type() === 'error') errors.push(event.text()) })
  return errors
}

for (const route of installationRoutes) test(`complete installation guide ${route || 'quick start'}`, async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.goto(`/en/guide/installation${route}`)
  await expect(page.locator('article h1').first()).toBeVisible()
  if (route.startsWith('/blazor') || route.startsWith('/angular') || route.startsWith('/nextjs') || route.startsWith('/nuxtjs')) {
    const selected = page.locator('article nav a[aria-current="page"]')
    await expect(selected).toHaveCount(1)
    await expect(selected).toHaveText(route.startsWith('/angular') || route.startsWith('/nextjs') || route.startsWith('/nuxtjs')
      ? route.endsWith('/static-rendering') ? 'Static' : route.endsWith('/runtime-rendering') ? 'Runtime' : route.startsWith('/angular') ? 'Quick start' : 'Progressive'
      : route.endsWith('/static-rendering') ? 'Static Rendering' : 'Runtime Rendering')
  }
  if (route.startsWith('/react-router') || route.startsWith('/tanstack-start')) {
    await expect(page.locator('article nav a[aria-current="page"]')).toHaveText(route.endsWith('/static-rendering') ? 'Static' : 'Runtime')
  }
  if (route.startsWith('/astro')) {
    const tabs = page.locator('nav').filter({ has: page.getByRole('link', { name: 'Runtime', exact: true }) })
    await expect(tabs).toHaveCount(1)
    const bounds = (await tabs.boundingBox())!
    for (const tab of await tabs.getByRole('link').all()) {
      const box = (await tab.boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(bounds.x)
      expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1)
    }
  }
  for (const heading of previous[`/guide/installation${route}`]) await expect(page.locator(`[id="${heading.id}"]`)).toHaveCount(1)
  for (const code of await page.locator('article pre').all()) {
    await expect(code).not.toHaveText('')
  }
  // Package-manager tabs retain inactive source blocks in the DOM.
  for (const code of await page.locator('article pre:visible').all()) {
    const firstLine = code.locator('code .line').first()
    await firstLine.scrollIntoViewIfNeeded()
    await expect(firstLine).toBeVisible()
    await expect(firstLine).toBeInViewport()
  }
  for (const step of await page.locator('.doc-step:has(> .doc-step-text)').all()) {
    const boxes = await step.evaluate(element => {
      const text = element.querySelector('.doc-step-text')!.getBoundingClientRect()
      const body = element.querySelector('.doc-step-body')!.getBoundingClientRect()
      return { text: text.toJSON(), body: body.toJSON() }
    })
    if (boxes.body.left === boxes.text.left) expect(boxes.body.top - boxes.text.bottom).toBeGreaterThanOrEqual(15)
    else expect(boxes.body.left - boxes.text.right).toBeGreaterThanOrEqual(15)
    const tabs = step.locator('.doc-step-body > .codeTabs:first-child')
    if (await tabs.count()) await expect(tabs).toHaveCSS('margin-top', '0px')
  }
  const demo = page.locator('[data-project-style^="installation-"]')
  if (await demo.count()) {
    const frame = await ready(demo)
    if (route === '/lit') {
      const button = frame.getByRole('button', { name: 'Hello Lit' })
      await expect(button).toHaveAttribute('class', 'fg-white bg:control px:control-x py:control-y r:control')
      await expect(button).toHaveCSS('padding-top', '12px')
      expect(await button.evaluate(element => element.getRootNode() instanceof ShadowRoot)).toBe(true)
    } else {
      const heading = frame.getByRole('heading', { name: 'Hello World' })
      await expect(heading).toHaveAttribute('class', 'm-md italic font-3xl font-heavy text-strong')
      await expect(heading).toHaveCSS('font-style', 'italic')
      await expect(heading).toHaveCSS('margin-top', '16px')
      const actual = await heading.evaluate(element => element.outerHTML)
      expect(installationSource(route)).toContain(actual)
    }
    await demo.screenshot({ path: info.outputPath('utility-preview.png'), scale: 'css', style: captureStyle })
  }
  if (route === '/vscode') {
    await expect(page.getByRole('link', { name: 'Install Master CSS', exact: true })).toHaveAttribute('href', 'vscode:extension/masterco.master-css')
    await expect(page.getByRole('link', { name: 'Install ESLint', exact: true })).toHaveAttribute('href', 'vscode:extension/dbaeumer.vscode-eslint')
    await expect(page.locator('article')).toContainText('"source.fixAll.eslint": "explicit"')
  }
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() => scrollTo(0, 0))
  // Let scrolling and loaded webfonts paint before capturing the full document.
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: info.outputPath('page.png'), fullPage: true, scale: 'css', style: captureStyle })
  if (route.startsWith('/nextjs')) {
    const manual = page.getByRole('link', { name: 'manual setup', exact: true })
    await expect(manual).not.toHaveAttribute('target', '_blank')
    await manual.focus()
    await manual.press('Enter')
    await expect(page).toHaveURL(/#existing-projects-and-srcapp$/)
    await expect(page.locator('#existing-projects-and-srcapp')).toBeInViewport()
  }
  if (route.startsWith('/nuxtjs')) {
    const label = route.endsWith('/static-rendering') ? 'Progressive' : 'Static'
    const next = page.locator('article nav').getByRole('link', { name: label, exact: true })
    await next.focus()
    await next.press('Enter')
    await expect(page.locator('article nav a[aria-current="page"]')).toHaveText(label)
  }
  if (route.startsWith('/react-router') || route.startsWith('/tanstack-start')) {
    const label = route.endsWith('/static-rendering') ? 'Runtime' : 'Static'
    const next = page.locator('article nav').getByRole('link', { name: label, exact: true })
    await next.focus()
    await next.press('Enter')
    await expect(page.locator('article nav a[aria-current="page"]')).toHaveText(label)
  }
  expect(errors).toEqual([])
})

test('document steps gallery has a stable reading order and container-based columns', async ({ page }, info) => {
  const errors = errorsFor(page)
  await page.goto('/en/design-system#document-steps')
  const gallery = page.locator('[data-steps-gallery]')
  await expect(gallery).toBeVisible()
  await expect(gallery.locator('h3')).toHaveText(['Create an entry', 'Connect the stylesheet'])
  await expect(gallery.locator('.doc-step-number')).toHaveCount(2)
  for (const number of await gallery.locator('.doc-step-number').all()) await expect(number).toHaveAttribute('aria-hidden', 'true')
  await page.evaluate(() => document.fonts.ready)
  await gallery.scrollIntoViewIfNeeded()
  expect(await gallery.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
  const columns = await gallery.locator('.doc-step[data-columns]').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length)
  const width = (await gallery.boundingBox())!.width
  expect(columns).toBe(width >= 704 ? 2 : 1)
  await gallery.screenshot({ path: info.outputPath('steps.png'), scale: 'css', style: captureStyle })
  const modes = page.locator('article nav').filter({ has: page.getByRole('link', { name: 'Runtime Rendering', exact: true }) })
  const runtimeLink = modes.getByRole('link', { name: 'Runtime Rendering', exact: true })
  await runtimeLink.focus()
  await runtimeLink.press('Enter')
  await expect(page).toHaveURL(/\/guide\/installation\/blazor$/)
  await expect(page.locator('article nav a[aria-current="page"]')).toHaveText('Runtime Rendering')
  // Leaving the gallery tears down many measured iframes at once. Queued
  // readings must not inspect the detached windows during route transition.
  expect(errors).toEqual([])
})

const asset = (path: string) => readFileSync(new URL(`../../../packages/${path}`, import.meta.url))
const runtime = 'https://cdn.master.co/css-runtime@rc'
const consumer = 'https://installation.test/'
const html = deliveryFences(installationSource('/cdn')).find(f => f.name === 'index.html')!.text
async function baseStyles(page: Page) {
  await page.route('https://cdn.master.co/css@rc/base.css', route => route.fulfill({ contentType: 'text/css', body: asset('preset/src/base.css') }))
  await page.route(consumer, route => route.fulfill({ contentType: 'text/html', body: html }))
}

test('authored CDN markup starts the real runtime with its split manifest', async ({ page }) => {
  const errors = errorsFor(page)
  await baseStyles(page)
  await page.route(runtime, route => route.fulfill({ contentType: 'text/javascript', body: asset('runtime/dist/global.min.js') }))
  await page.route(runtime + '/default-manifest.json', route => route.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: asset('runtime/dist/default-manifest.json') }))
  await page.route('**/mastercss_binding_wasm_engine_bg.wasm', route => route.fulfill({ contentType: 'application/wasm', headers: { 'access-control-allow-origin': '*' }, body: asset('runtime/artifacts/mastercss_binding_wasm_engine_bg.wasm') }))
  await page.goto(consumer)
  await expect.poll(() => page.evaluate(() => Boolean((globalThis as any).masterCSSRuntime?.snapshot().observing))).toBe(true)
  await expect(page.getByRole('heading', { name: 'Hello World' })).toHaveCSS('font-style', 'italic')
  await expect(page.getByRole('heading', { name: 'Hello World' })).toHaveCSS('margin-top', '16px')
  expect(errors).toEqual([])
})

test('CDN content remains visible after load failure and without JavaScript', async ({ page, browser }) => {
  await baseStyles(page)
  await page.route(runtime, route => route.abort())
  await page.goto(consumer)
  await expect(page.getByRole('heading', { name: 'Hello World' })).toBeVisible()
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: page.viewportSize()! })
  try {
    const noScript = await context.newPage()
    await baseStyles(noScript)
    await noScript.goto(consumer)
    await expect(noScript.getByRole('heading', { name: 'Hello World' })).toBeVisible()
  } finally { await context.close() }
})
