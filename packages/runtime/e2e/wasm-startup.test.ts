import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getRuntimeLoaderURL } from './init'

const __dirname = dirname(fileURLToPath(import.meta.url))
const wasm = readFileSync(resolve(__dirname, '../artifacts/mastercss_wasm_runtime_bg.wasm'))
const wasmRequest = /mastercss_wasm_runtime_bg\.wasm(?:\?.*)?$/

async function gotoRuntimeOrigin(page: Page, loaderURL: string) {
  const blankURL = new URL('/__master-css-runtime-wasm-startup.html', loaderURL).href
  await page.route(blankURL, route => route.fulfill({
    contentType: 'text/html',
    body: '<!doctype html><html hidden><head></head><body><p class="block"></p></body></html>'
  }))
  await page.goto(blankURL)
}

async function startAndCaptureFailure(page: Page, loaderURL: string, startupTimeoutMs?: number) {
  return await page.evaluate(async ({ loaderURL, startupTimeoutMs }) => {
    const { startCSSRuntimeAsync } = await import(loaderURL)
    try {
      await startCSSRuntimeAsync({ startupTimeoutMs })
    } catch (error) {
      return {
        code: (error as { code?: string }).code,
        hidden: document.documentElement.hasAttribute('hidden'),
        runtimeStarted: Boolean(globalThis.__MASTER_CSS_RUNTIME_TEST__)
      }
    }
    throw new Error('Expected runtime startup to fail.')
  }, { loaderURL, startupTimeoutMs })
}

test('falls back to ArrayBuffer instantiation for an incorrect Wasm MIME type', async ({ page }) => {
  const loaderURL = await getRuntimeLoaderURL()
  const warnings: string[] = []
  let wasmRequests = 0
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text())
  })
  await page.route(wasmRequest, route => {
    wasmRequests++
    return route.fulfill({
      contentType: 'application/octet-stream',
      body: wasm
    })
  })
  await gotoRuntimeOrigin(page, loaderURL)

  const result = await page.evaluate(async ({ loaderURL }) => {
    const { startCSSRuntimeAsync } = await import(loaderURL)
    const runtime = await startCSSRuntimeAsync()
    return {
      backend: runtime.backend,
      hidden: document.documentElement.hasAttribute('hidden'),
      text: runtime.snapshot().cssText
    }
  }, { loaderURL })

  expect(wasmRequests).toBe(1)
  expect(warnings.some(message => message.includes('Falling back to `WebAssembly.instantiate`'))).toBe(true)
  expect(result).toEqual({
    backend: 'wasm',
    hidden: false,
    text: '@layer utilities{.block{display:block}}'
  })
})

test('fails open when the Wasm asset returns 404', async ({ page }) => {
  const loaderURL = await getRuntimeLoaderURL()
  await page.route(wasmRequest, route => route.fulfill({
    status: 404,
    contentType: 'text/plain',
    body: 'not found'
  }))
  await gotoRuntimeOrigin(page, loaderURL)

  expect(await startAndCaptureFailure(page, loaderURL)).toEqual({
    code: 'WASM_LOAD_FAILED',
    hidden: false,
    runtimeStarted: false
  })
})

test('fails open when Wasm startup exceeds the configured timeout', async ({ page }) => {
  const loaderURL = await getRuntimeLoaderURL()
  await page.route(wasmRequest, async route => {
    await new Promise(resolve => setTimeout(resolve, 150))
    await route.fulfill({
      contentType: 'application/wasm',
      body: wasm
    })
  })
  await gotoRuntimeOrigin(page, loaderURL)

  expect(await startAndCaptureFailure(page, loaderURL, 25)).toEqual({
    code: 'RUNTIME_STARTUP_TIMEOUT',
    hidden: false,
    runtimeStarted: false
  })
  await page.waitForTimeout(175)
  expect(await page.evaluate(() => Boolean(globalThis.__MASTER_CSS_RUNTIME_TEST__))).toBe(false)
})
