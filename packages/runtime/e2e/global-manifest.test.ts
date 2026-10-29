import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const RUNTIME_ASSET_BASE_URL = 'http://master-css-runtime.test'
const RUNTIME_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/@master/css-runtime@rc/dist/global.min.js'
const DEFAULT_PROGRAM_URL = 'https://cdn.jsdelivr.net/npm/@master/css-runtime@rc/dist/default-program.bin'
const PRESET_BASE_CSS_URL = 'https://cdn.jsdelivr.net/npm/@master/css-preset@rc/src/base.css'

type RuntimeAssetRouteOptions = {
  onDefaultProgramRequest?: () => void
}

async function routeRuntimeAssets(page: Page, options: RuntimeAssetRouteOptions = {}) {
  await page.route(RUNTIME_SCRIPT_URL, (route) => {
    route.fulfill({
      contentType: 'text/javascript',
      body: readFileSync(resolve(__dirname, '../dist/global.min.js'), 'utf8')
    })
  })
  await page.route(DEFAULT_PROGRAM_URL, (route) => {
    options.onDefaultProgramRequest?.()
    route.fulfill({
      contentType: 'application/octet-stream',
      headers: {
        'access-control-allow-origin': '*'
      },
      body: readFileSync(resolve(__dirname, '../dist/default-program.bin'))
    })
  })
}

async function startGlobalRuntime(page: Page) {
  await routeRuntimeAssets(page)
  await page.addScriptTag({ url: RUNTIME_SCRIPT_URL })
  await page.waitForFunction(() => globalThis.masterCSSRuntime?.snapshot().observing)
}

test('repository CDN example renders with current package artifacts', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await routeRuntimeAssets(page)
  await page.route(PRESET_BASE_CSS_URL, route => route.fulfill({
    contentType: 'text/css',
    headers: { 'access-control-allow-origin': '*' },
    body: readFileSync(resolve(__dirname, '../../preset/src/base.css'), 'utf8')
  }))
  await page.route(`${RUNTIME_ASSET_BASE_URL}/`, route => route.fulfill({
    contentType: 'text/html',
    body: readFileSync(resolve(__dirname, '../../../examples/cdn/iife.html'), 'utf8')
  }))

  await page.goto(`${RUNTIME_ASSET_BASE_URL}/`)
  await page.waitForFunction(() => globalThis.masterCSSRuntime?.snapshot().observing)
  expect(errors).toEqual([])
  expect(await page.locator('html').getAttribute('hidden')).toBeNull()
  expect(await page.locator('h1').evaluate(element => {
    const style = getComputedStyle(element)
    return { color: style.color, fontSize: style.fontSize, fontStyle: style.fontStyle, fontWeight: style.fontWeight, marginTop: style.marginTop }
  })).toEqual({ color: 'rgb(17, 24, 39)', fontSize: '40px', fontStyle: 'italic', fontWeight: '800', marginTop: '48px' })
})

test('uses the default preset program', async ({ page }) => {
  await startGlobalRuntime(page)

  const snapshot = await page.evaluate(() => {
    globalThis.masterCSSRuntime!.ensureClassRules(['font-bold', 'fg-white'])
    return globalThis.masterCSSRuntime!.snapshot()
  })
  expect(snapshot.cssText).toContain('--font-weight-bold:700')
  expect(snapshot.cssText).toContain('.fg-white{color:var(--color-white)}')
  expect(snapshot.classRules['font-bold']?.rules).not.toHaveLength(0)
  expect(snapshot.classRules['fg-white']?.rules).not.toHaveLength(0)
})

test('uses the preloaded default program', async ({ page }) => {
  let defaultProgramRequests = 0
  let presetCSSRequests = 0
  const consoleMessages: string[] = []
  let assetBase = ''
  page.on('console', message => {
    if (message.type() === 'warning' || message.type() === 'error') consoleMessages.push(message.text())
  })
  // Playwright routing disables HTTP caching. Serve real responses so this test
  // observes browser preload reuse rather than interception-specific behavior.
  const assets = new Map([
    ['/global.min.js', { type: 'text/javascript', body: readFileSync(resolve(__dirname, '../dist/global.min.js')) }],
    ['/default-program.bin', { type: 'application/octet-stream', body: readFileSync(resolve(__dirname, '../dist/default-program.bin')) }],
    ['/base.css', { type: 'text/css', body: readFileSync(resolve(__dirname, '../../preset/src/base.css')) }]
  ])
  const server = createServer((request, response) => {
    if (request.url === '/default-program.bin') defaultProgramRequests++
    if (request.url === '/base.css') presetCSSRequests++
    const asset = assets.get(request.url ?? '')
    response.writeHead(200, { 'content-type': asset?.type ?? 'text/html', 'cache-control': 'public, max-age=3600', 'access-control-allow-origin': '*' })
    response.end(asset?.body ?? `<!doctype html><html hidden><head>
      <link rel="preload" as="style" href="${assetBase}/base.css">
      <link rel="preload" as="fetch" crossorigin href="${assetBase}/default-program.bin">
      <link rel="stylesheet" href="${assetBase}/base.css">
      <script src="${assetBase}/global.min.js"></script>
      </head><body><h1 class="font-size:40px">Hello</h1></body></html>`)
  })
  try {
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Missing preload fixture server address')
    assetBase = `http://localhost:${address.port}`
    await page.goto(`http://127.0.0.1:${address.port}/`)
    await page.waitForFunction(() => globalThis.masterCSSRuntime?.snapshot().observing)
    expect(defaultProgramRequests).toBe(1)
    expect(presetCSSRequests).toBe(1)
    expect(consoleMessages).toEqual([])
    expect(await page.locator('h1').evaluate(element => getComputedStyle(element).fontSize)).toBe('40px')
    expect(await page.evaluate(() => {
      globalThis.masterCSSRuntime!.ensureClassRules(['font-bold'])
      return globalThis.masterCSSRuntime!.snapshot().cssText
    })).toContain('--font-weight-bold:700')
  } finally {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  }
})

test('ignores global manifest override', async ({ page }) => {
  const manifest = {
    version: 1,
    variables: [
      { name: 'primary', key: 'primary', type: 'string', values: [{ path: [':root,:host'], value: '#000000' }] }
    ]
  } as const
  await page.evaluate(({ manifest }) => {
    (globalThis as typeof globalThis & { masterCSSManifest?: unknown }).masterCSSManifest = manifest
  }, { manifest })
  await startGlobalRuntime(page)

  const snapshot = await page.evaluate(() => {
    globalThis.masterCSSRuntime!.ensureClassRules(['font-bold'])
    return globalThis.masterCSSRuntime!.snapshot()
  })
  expect(snapshot.cssText).toContain('--font-weight-bold:700')
  expect(snapshot.cssText).not.toContain('--primary:#000000')
})

test('fails open when the cross-origin default program request is blocked', async ({ page }) => {
  const consumerURL = 'http://master-css-consumer.test/'
  let programRequests = 0
  await routeRuntimeAssets(page)
  await page.unroute(DEFAULT_PROGRAM_URL)
  await page.route(DEFAULT_PROGRAM_URL, (route) => {
    programRequests++
    route.abort()
  })
  await page.route(consumerURL, route => route.fulfill({
    contentType: 'text/html',
    body: `<!doctype html><html hidden><head><script src="${RUNTIME_SCRIPT_URL}"></script></head><body></body></html>`
  }))

  await page.goto(consumerURL)
  await expect.poll(() => page.evaluate(() => document.documentElement.hasAttribute('hidden'))).toBe(false)

  expect(programRequests).toBe(1)
  expect(await page.evaluate(() => Boolean(globalThis.masterCSSRuntime))).toBe(false)
})

test('renders under a strict CSP that disallows Wasm compilation', async ({ page }) => {
  const consumerURL = 'http://master-css-csp-consumer.test/'
  const requests: string[] = []
  page.on('request', request => requests.push(request.url()))
  await routeRuntimeAssets(page)
  await page.route(consumerURL, route => route.fulfill({
    contentType: 'text/html',
    headers: {
      'content-security-policy': "default-src 'none'; script-src https://cdn.jsdelivr.net; connect-src https://cdn.jsdelivr.net; style-src 'unsafe-inline'"
    },
    body: `<!doctype html><html hidden><head><script src="${RUNTIME_SCRIPT_URL}"></script></head><body><h1 class="font-size:40px">Hello</h1></body></html>`
  }))

  await page.goto(consumerURL)
  await page.waitForFunction(() => globalThis.masterCSSRuntime?.snapshot().observing)

  expect(await page.locator('html').getAttribute('hidden')).toBeNull()
  expect(await page.locator('h1').evaluate(element => getComputedStyle(element).fontSize)).toBe('40px')
  expect(await page.evaluate(() => globalThis.masterCSSRuntime!.binding)).toBe('js')
  expect(requests.filter(url => url.endsWith('.wasm'))).toEqual([])
})
