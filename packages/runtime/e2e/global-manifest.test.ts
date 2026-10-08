import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const RUNTIME_ASSET_BASE_URL = 'http://master-css-runtime.test'
const RUNTIME_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/@master/css-runtime@rc/dist/global.min.js'
const DEFAULT_MANIFEST_URL = 'https://cdn.jsdelivr.net/npm/@master/css-runtime@rc/dist/default-manifest.json'
const RUNTIME_WASM_URL = 'https://cdn.jsdelivr.net/npm/@master/css-runtime@rc/artifacts/mastercss_binding_wasm_engine_bg.wasm'
const PRESET_BASE_CSS_URL = 'https://cdn.jsdelivr.net/npm/@master/css-preset@rc/src/base.css'

type RuntimeAssetRouteOptions = {
  onDefaultManifestRequest?: () => void
  onWasmRequest?: () => void
}

async function routeRuntimeAssets(page: Page, options: RuntimeAssetRouteOptions = {}) {
  await page.route(RUNTIME_SCRIPT_URL, (route) => {
    route.fulfill({
      contentType: 'text/javascript',
      body: readFileSync(resolve(__dirname, '../dist/global.min.js'), 'utf8')
    })
  })
  await page.route(DEFAULT_MANIFEST_URL, (route) => {
    options.onDefaultManifestRequest?.()
    route.fulfill({
      contentType: 'application/json',
      headers: {
        'access-control-allow-origin': '*'
      },
      body: readFileSync(resolve(__dirname, '../dist/default-manifest.json'), 'utf8')
    })
  })
  await page.route(RUNTIME_WASM_URL, (route) => {
    options.onWasmRequest?.()
    route.fulfill({
      contentType: 'application/wasm',
      headers: {
        'access-control-allow-origin': '*'
      },
      body: readFileSync(resolve(__dirname, '../artifacts/mastercss_binding_wasm_engine_bg.wasm'))
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

test('uses split bundled preset manifest', async ({ page }) => {
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

test('uses modulepreloaded default manifest', async ({ page }) => {
  let defaultManifestRequests = 0
  let presetCSSRequests = 0
  const consoleMessages: string[] = []

  await routeRuntimeAssets(page, {
    onDefaultManifestRequest: () => {
      defaultManifestRequests++
    }
  })
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') {
      consoleMessages.push(message.text())
    }
  })
  await page.route(PRESET_BASE_CSS_URL, route => {
    presetCSSRequests++
    route.fulfill({
      contentType: 'text/css',
      headers: { 'access-control-allow-origin': '*' },
      body: readFileSync(resolve(__dirname, '../../preset/src/base.css'), 'utf8')
    })
  })

  await page.route(`${RUNTIME_ASSET_BASE_URL}/`, (route) => route.fulfill({
    contentType: 'text/html',
    body: `
      <!doctype html>
      <html hidden>
      <head>
        <link rel="preload" as="style" href="${PRESET_BASE_CSS_URL}">
        <link rel="modulepreload" as="json" crossorigin href="${DEFAULT_MANIFEST_URL}">
        <link rel="stylesheet" href="${PRESET_BASE_CSS_URL}">
        <script src="${RUNTIME_SCRIPT_URL}"></script>
      </head>
      <body><h1 class="font-size:40px">Hello</h1></body>
      </html>
    `
  }))
  await page.goto(`${RUNTIME_ASSET_BASE_URL}/`)
  await page.waitForFunction(() => globalThis.masterCSSRuntime?.snapshot().observing)

  expect(defaultManifestRequests).toBe(1)
  expect(presetCSSRequests).toBe(1)
  expect(consoleMessages).toEqual([])
  expect(await page.locator('h1').evaluate(element => getComputedStyle(element).fontSize)).toBe('40px')
  expect(await page.evaluate(() => {
    globalThis.masterCSSRuntime!.ensureClassRules(['font-bold'])
    return globalThis.masterCSSRuntime!.snapshot().cssText
  })).toContain('--font-weight-bold:700')
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

test('fails open when a cross-origin Wasm request is blocked', async ({ page }) => {
  const consumerURL = 'http://master-css-consumer.test/'
  let wasmRequests = 0
  await routeRuntimeAssets(page)
  await page.unroute(RUNTIME_WASM_URL)
  await page.route(RUNTIME_WASM_URL, (route) => {
    wasmRequests++
    route.abort()
  })
  await page.route(consumerURL, route => route.fulfill({
    contentType: 'text/html',
    body: `<!doctype html><html hidden><head><script src="${RUNTIME_SCRIPT_URL}"></script></head><body></body></html>`
  }))

  await page.goto(consumerURL)
  await expect.poll(() => page.evaluate(() => document.documentElement.hasAttribute('hidden'))).toBe(false)

  expect(wasmRequests).toBe(1)
  expect(await page.evaluate(() => Boolean(globalThis.masterCSSRuntime))).toBe(false)
})

test('fails open when strict CSP disallows Wasm compilation', async ({ page }) => {
  const consumerURL = 'http://master-css-csp-consumer.test/'
  let wasmRequests = 0
  await routeRuntimeAssets(page, {
    onWasmRequest: () => {
      wasmRequests++
    }
  })
  await page.route(consumerURL, route => route.fulfill({
    contentType: 'text/html',
    headers: {
      'content-security-policy': "default-src 'none'; script-src https://cdn.jsdelivr.net; connect-src https://cdn.jsdelivr.net"
    },
    body: `<!doctype html><html hidden><head><script src="${RUNTIME_SCRIPT_URL}"></script></head><body></body></html>`
  }))

  await page.goto(consumerURL)
  await expect.poll(() => page.evaluate(() => document.documentElement.hasAttribute('hidden'))).toBe(false)

  expect(wasmRequests).toBe(1)
  expect(await page.evaluate(() => Boolean(globalThis.masterCSSRuntime))).toBe(false)
})
