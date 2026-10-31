import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { build, preview, createServer } from 'vite'
import { chromium, type Page } from '@playwright/test'
import { expect, test } from 'vitest'
import masterCSS from '../src/core'

const opacity = (page: Page) => page.locator('#probe').evaluate(element => getComputedStyle(element).opacity)
const runtimeCSS = (page: Page) => page.locator('#master-css').evaluate(element => [...(element as HTMLStyleElement).sheet!.cssRules].map(rule => rule.cssText).join(''))

function fixture(name: string, html: string, css: Record<string, string>) {
  const parent = join(process.cwd(), 'tmp')
  mkdirSync(parent, { recursive: true })
  const root = mkdtempSync(join(parent, name))
  writeFileSync(join(root, 'index.html'), `<html><head></head><body>${html}<script type="module" src="/main.js"></script></body></html>`)
  writeFileSync(join(root, 'main.js'), 'import "./app.css"')
  for (const [file, source] of Object.entries(css)) writeFileSync(join(root, file), source)
  return root
}

async function close(server: Awaited<ReturnType<typeof preview>> | undefined) {
  if (server) await new Promise<void>((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()))
}

test('runtime builds deliver plain CSS and insert on-demand keyframes in their layer on first use', async () => {
  const root = fixture('on-demand-runtime-', '<div id="probe"></div>', {
    'app.css': '@import "@master/css";@prune native;@theme{--animate-probe:probe 1ms both}@layer motion{@keyframes probe{to{opacity:.3}}}'
  })
  let server: Awaited<ReturnType<typeof preview>> | undefined
  const browser = await chromium.launch()
  try {
    await build({ root, configFile: false, logLevel: 'silent', base: '/app/', plugins: masterCSS({ mode: 'runtime' }) })
    const assets = readdirSync(join(root, 'dist/assets'))
    expect(assets.filter(file => file.endsWith('.json'))).toEqual([])
    for (const css of assets.filter(file => file.endsWith('.css'))) {
      const text = readFileSync(join(root, 'dist/assets', css), 'utf8')
      expect(text).not.toMatch(/master-css-(keyframe|slot)/)
      expect(text).not.toContain('@keyframes probe')
    }
    server = await preview({ root, configFile: false, base: '/app/', logLevel: 'silent', preview: { host: '127.0.0.1', port: 0 } })
    const page = await browser.newPage()
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    await page.goto(server.resolvedUrls!.local[0])
    await expect.poll(() => page.evaluate(() => Boolean((globalThis as any).masterCSSRuntime))).toBe(true)
    expect(await runtimeCSS(page)).not.toContain('@keyframes')
    await page.locator('#probe').evaluate(element => { element.setAttribute('class', 'animate-probe') })
    await expect.poll(() => opacity(page)).toBe('0.3')
    expect(await runtimeCSS(page)).toMatch(/@layer motion \{\s*@keyframes probe/)
    await page.locator('#probe').evaluate(element => { element.setAttribute('class', '') })
    await expect.poll(() => opacity(page)).toBe('1')
    await expect.poll(() => runtimeCSS(page)).not.toContain('@keyframes')
    expect(errors).toEqual([])
  } finally {
    await browser.close()
    await close(server)
    rmSync(root, { recursive: true, force: true })
  }
}, 60_000)

test('development HMR replaces on-demand keyframes in use', async () => {
  const source = (value: string) => `@import "@master/css";@prune native;@theme{--animate-probe:probe 1ms both}@layer motion{@keyframes probe{to{opacity:${value}}}}`
  const root = fixture('on-demand-dev-', '<div id="probe"></div>', { 'app.css': source('.3') })
  const browser = await chromium.launch()
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'runtime' }), server: { host: '127.0.0.1', port: 0 } })
    await server.listen()
    const page = await browser.newPage()
    await page.goto(server.resolvedUrls!.local[0])
    await expect.poll(() => page.evaluate(() => Boolean((globalThis as any).masterCSSRuntime))).toBe(true)
    await page.locator('#probe').evaluate(element => { element.setAttribute('class', 'animate-probe') })
    await expect.poll(() => opacity(page)).toBe('0.3')
    writeFileSync(join(root, 'app.css'), source('.6'))
    await expect.poll(() => opacity(page), { timeout: 15000 }).toBe('0.6')
    await page.locator('#probe').evaluate(element => { element.setAttribute('class', '') })
    await expect.poll(() => opacity(page)).toBe('1')
  } finally {
    await browser.close()
    await server?.close()
    rmSync(root, { recursive: true, force: true })
  }
}, 60_000)

test.each([
  ['progressive', 'declared', { 'app.css': '@import "@master/css";@prune native;@theme{--animate-probe:probe 1ms both}@layer motion{@keyframes probe{to{opacity:.4}}}' }],
  ['progressive', 'referenced', { 'app.css': '@import "@master/css";@reference "./frames.css";@theme{--animate-probe:probe 1ms both}', 'frames.css': '@layer motion{@keyframes probe{to{opacity:.4}}}' }]
] as const)('%s builds pre-render %s on-demand keyframes and hydrate them', async (mode, _kind, css) => {
  const root = fixture('on-demand-ssr-', '<div id="probe" class="animate-probe"></div>', css)
  let server: Awaited<ReturnType<typeof preview>> | undefined
  const browser = await chromium.launch()
  try {
    await build({ root, configFile: false, logLevel: 'silent', base: '/app/', plugins: masterCSS({ mode }) })
    const html = readFileSync(join(root, 'dist/index.html'), 'utf8')
    expect(html).toMatch(/<style id="master-css"[^>]*>[^<]*@layer motion\{@keyframes probe/)
    server = await preview({ root, configFile: false, base: '/app/', logLevel: 'silent', preview: { host: '127.0.0.1', port: 0 } })
    const staticPage = await browser.newPage({ javaScriptEnabled: false })
    await staticPage.goto(server.resolvedUrls!.local[0])
    await expect.poll(() => opacity(staticPage)).toBe('0.4')
    const page = await browser.newPage()
    await page.goto(server.resolvedUrls!.local[0])
    await expect.poll(() => page.evaluate(() => Boolean((globalThis as any).masterCSSRuntime))).toBe(true)
    await expect.poll(() => opacity(page)).toBe('0.4')
    await page.locator('#probe').evaluate(element => element.removeAttribute('class'))
    await expect.poll(() => opacity(page)).toBe('1')
  } finally {
    await browser.close()
    await close(server)
    rmSync(root, { recursive: true, force: true })
  }
}, 60_000)
