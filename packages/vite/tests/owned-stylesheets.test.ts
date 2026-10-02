import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { build, preview, createServer } from 'vite'
import { chromium } from '@playwright/test'
import { expect, test } from 'vitest'
import masterCSS from '../src/core'

test('runtime build publishes final CSS ownership and keeps dynamic keyframe assets usable', async () => {
  const parent = join(process.cwd(), 'tmp')
  mkdirSync(parent, { recursive: true })
  const root = mkdtempSync(join(parent, 'owned-stylesheets-'))
  let server: Awaited<ReturnType<typeof preview>> | undefined
  const browser = await chromium.launch()
  try {
    writeFileSync(join(root, 'index.html'), '<html><head></head><body><div id="probe"></div><script type="module" src="/main.js"></script></body></html>')
    writeFileSync(join(root, 'main.js'), 'import "./app.css"')
    writeFileSync(join(root, 'app.css'), '@import "@master/css";@prune native;@theme{--animate-probe:probe 1ms both}@layer{@keyframes probe{to{opacity:.3;background-image:url("./pixel.svg")}}}')
    writeFileSync(join(root, 'pixel.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><path fill="red" d="M0 0h2v2H0z"/></svg>')
    await build({ root, configFile: false, logLevel: 'silent', base: '/app/', plugins: masterCSS({ mode: 'runtime' }), build: { assetsInlineLimit: 0 } })
    const assets = readdirSync(join(root, 'dist/assets'))
    for (const css of assets.filter(file => file.endsWith('.css'))) {
      expect(assets).toContain(css + '.master-css.json')
      expect(JSON.parse(readFileSync(join(root, 'dist/assets', css + '.master-css.json'), 'utf8')).version).toBe(1)
    }
    server = await preview({ root, configFile: false, base: '/app/', logLevel: 'silent', preview: { host: '127.0.0.1', port: 0 } })
    const page = await browser.newPage()
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    await page.goto(server.resolvedUrls!.local[0])
    await expect.poll(() => page.evaluate(() => Boolean((globalThis as any).masterCSSRuntime))).toBe(true)
    await page.locator('#probe').evaluate(element => { element.setAttribute('class', 'animate-probe') })
    await expect.poll(() => page.locator('#probe').evaluate(element => getComputedStyle(element).opacity)).toBe('0.3')
    const image = await page.locator('#probe').evaluate(element => getComputedStyle(element).backgroundImage)
    const ownership = await page.evaluate(() => ({ css: (globalThis as any).masterCSSRuntime.snapshot().cssText, styles: [...document.querySelectorAll('style[data-master-css-stylesheet]')].map(style => style.textContent) }))
    expect(image, JSON.stringify(ownership)).toMatch(/\/app\/assets\/master-css-resource-.*\.svg/)
    await page.locator('#probe').evaluate(element => { element.setAttribute('class', '') })
    await expect.poll(() => page.locator('#probe').evaluate(element => getComputedStyle(element).opacity)).toBe('1')
    expect(errors).toEqual([])
  } finally {
    await browser.close()
    if (server) await new Promise<void>((resolve, reject) => server!.httpServer.close(error => error ? reject(error) : resolve()))
    rmSync(root, { recursive: true, force: true })
  }
}, 60_000)


test('development startup and keyframe-only HMR preserve native slots and ownership', async () => {
  const parent = join(process.cwd(), 'tmp')
  mkdirSync(parent, { recursive: true })
  const root = mkdtempSync(join(parent, 'owned-dev-'))
  const browser = await chromium.launch()
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  const source = (opacity: string) => `@import "@master/css";@prune native;@theme{--animate-probe:probe 1ms both}@layer{@keyframes probe{to{opacity:${opacity}}}}`
  try {
    writeFileSync(join(root, 'index.html'), '<html><head></head><body><div id="probe"></div><script type="module" src="/main.js"></script></body></html>')
    writeFileSync(join(root, 'main.js'), 'import "./app.css"')
    writeFileSync(join(root, 'app.css'), source('.3'))
    server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'runtime' }), server: { host: '127.0.0.1', port: 0 } })
    await server.listen()
    const page = await browser.newPage()
    await page.goto(server.resolvedUrls!.local[0])
    await expect.poll(() => page.evaluate(() => Boolean((globalThis as any).masterCSSRuntime))).toBe(true)
    await page.locator('#probe').evaluate(element => { element.setAttribute('class', 'animate-probe') })
    await expect.poll(() => page.locator('#probe').evaluate(element => getComputedStyle(element).opacity)).toBe('0.3')
    await expect.poll(() => page.locator('#master-css').evaluate(element => [...(element as HTMLStyleElement).sheet!.cssRules].map(rule => rule.cssText).join(''))).not.toContain('@keyframes')
    writeFileSync(join(root, 'app.css'), source('.6'))
    await expect.poll(() => page.locator('#probe').evaluate(element => getComputedStyle(element).opacity), { timeout: 15000 }).toBe('0.6')
    await page.locator('#probe').evaluate(element => { element.setAttribute('class', '') })
    await expect.poll(() => page.locator('#probe').evaluate(element => getComputedStyle(element).opacity)).toBe('1')
  } finally {
    await browser.close()
    await server?.close()
    rmSync(root, { recursive: true, force: true })
  }
}, 60_000)

test('progressive build renders animation in the linked stylesheet position before JavaScript', async () => {
  const parent = join(process.cwd(), 'tmp')
  mkdirSync(parent, { recursive: true })
  const root = mkdtempSync(join(parent, 'owned-ssr-'))
  let server: Awaited<ReturnType<typeof preview>> | undefined
  const browser = await chromium.launch()
  try {
    writeFileSync(join(root, 'index.html'), '<html><head></head><body><div id="probe" class="animate-probe"></div><script type="module" src="/main.js"></script></body></html>')
    writeFileSync(join(root, 'main.js'), 'import "./app.css"')
    writeFileSync(join(root, 'app.css'), '@import "@master/css";@prune native;@theme{--animate-probe:probe 1ms both}@layer{@keyframes probe{to{opacity:.4}}}')
    await build({ root, configFile: false, logLevel: 'silent', base: '/app/', plugins: masterCSS({ mode: 'progressive' }) })
    server = await preview({ root, configFile: false, base: '/app/', logLevel: 'silent', preview: { host: '127.0.0.1', port: 0 } })
    const page = await browser.newPage({ javaScriptEnabled: false })
    await page.goto(server.resolvedUrls!.local[0])
    await expect.poll(() => page.locator('#probe').evaluate(element => getComputedStyle(element).opacity)).toBe('0.4')
    expect(await page.locator('style[data-master-css-stylesheet]').count()).toBeGreaterThan(0)
    const hydrated = await browser.newPage()
    await hydrated.goto(server.resolvedUrls!.local[0])
    await expect.poll(() => hydrated.evaluate(() => Boolean((globalThis as any).masterCSSRuntime))).toBe(true)
    await expect.poll(() => hydrated.locator('#probe').evaluate(element => getComputedStyle(element).opacity)).toBe('0.4')
    await hydrated.locator('#probe').evaluate(element => element.removeAttribute('class'))
    await expect.poll(() => hydrated.locator('#probe').evaluate(element => getComputedStyle(element).opacity)).toBe('1')
  } finally {
    await browser.close()
    if (server) await new Promise<void>((resolve, reject) => server!.httpServer.close(error => error ? reject(error) : resolve()))
    rmSync(root, { recursive: true, force: true })
  }
}, 60_000)


test.each(['runtime', 'progressive'] as const)('%s reference-only keyframes retain rebased resources', async mode => {
  const parent = join(process.cwd(), 'tmp')
  mkdirSync(parent, { recursive: true })
  const root = mkdtempSync(join(parent, 'owned-stylesheets-'))
  let server: Awaited<ReturnType<typeof preview>> | undefined
  const browser = await chromium.launch()
  try {
    writeFileSync(join(root, 'index.html'), `<html><head></head><body><div id="probe" class="${mode === 'progressive' ? 'animate-probe' : ''}"></div><script type="module" src="/main.js"></script></body></html>`)
    writeFileSync(join(root, 'main.js'), 'import "./app.css"')
    writeFileSync(join(root, 'app.css'), '@import "@master/css";@reference "./frames.css";@theme{--animate-probe:probe 1ms both}')
    writeFileSync(join(root, 'frames.css'), '@layer reference-layer{@keyframes probe{to{opacity:.3;background-image:url("./pixel.svg")}}}')
    writeFileSync(join(root, 'pixel.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><path fill="red" d="M0 0h2v2H0z"/></svg>')
    await build({ root, configFile: false, logLevel: 'silent', base: '/app/', plugins: masterCSS({ mode }), build: { assetsInlineLimit: 0 } })
    const assets = readdirSync(join(root, 'dist/assets'))
    for (const css of assets.filter(file => file.endsWith('.css'))) {
      expect(assets).toContain(css + '.master-css.json')
      expect(JSON.parse(readFileSync(join(root, 'dist/assets', css + '.master-css.json'), 'utf8')).version).toBe(1)
    }
    server = await preview({ root, configFile: false, base: '/app/', logLevel: 'silent', preview: { host: '127.0.0.1', port: 0 } })
    if (mode === 'progressive') {
      const staticPage = await browser.newPage({ javaScriptEnabled: false })
      await staticPage.goto(server.resolvedUrls!.local[0])
      await expect.poll(() => staticPage.locator('#probe').evaluate(element => getComputedStyle(element).opacity)).toBe('0.3')
      expect(await staticPage.locator('#probe').evaluate(element => getComputedStyle(element).backgroundImage)).toMatch(/\/app\/assets\/master-css-resource-.*\.svg/)
      await staticPage.close()
    }
    const page = await browser.newPage()
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    await page.goto(server.resolvedUrls!.local[0])
    await expect.poll(() => page.evaluate(() => Boolean((globalThis as any).masterCSSRuntime))).toBe(true)
    if (mode === 'progressive') {
      const hydration = await page.evaluate(() => (globalThis as any).masterCSSRuntime.snapshot().hydration)
      expect(hydration.state, JSON.stringify(hydration)).toBe('progressive')
    }
    await page.locator('#probe').evaluate(element => { element.setAttribute('class', 'animate-probe') })
    await expect.poll(() => page.locator('#probe').evaluate(element => getComputedStyle(element).opacity)).toBe('0.3')
    const image = await page.locator('#probe').evaluate(element => getComputedStyle(element).backgroundImage)
    const ownership = await page.evaluate(() => ({ css: (globalThis as any).masterCSSRuntime.snapshot().cssText, styles: [...document.querySelectorAll('style[data-master-css-stylesheet]')].map(style => style.textContent) }))
    expect(image, JSON.stringify(ownership)).toMatch(/\/app\/assets\/master-css-resource-.*\.svg/)
    await page.locator('#probe').evaluate(element => { element.setAttribute('class', '') })
    await expect.poll(() => page.locator('#probe').evaluate(element => getComputedStyle(element).opacity)).toBe('1')
    expect(errors).toEqual([])
  } finally {
    await browser.close()
    if (server) await new Promise<void>((resolve, reject) => server!.httpServer.close(error => error ? reject(error) : resolve()))
    rmSync(root, { recursive: true, force: true })
  }
}, 60_000)
