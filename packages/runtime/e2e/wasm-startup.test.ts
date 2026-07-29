import { expect, test, type Page } from '@playwright/test'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getRuntimeLoaderURL } from './init'

const __dirname = dirname(fileURLToPath(import.meta.url))
const wasm = readFileSync(resolve(__dirname, '../artifacts/mastercss_binding_wasm_engine_bg.wasm'))
const wasmRequest = /mastercss_binding_wasm_engine_bg\.wasm(?:\?.*)?$/
const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

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
      binding: runtime.binding,
      hidden: document.documentElement.hasAttribute('hidden'),
      text: runtime.snapshot().cssText
    }
  }, { loaderURL })

  expect(wasmRequests).toBe(1)
  expect(warnings.some(message => message.includes('Falling back to `WebAssembly.instantiate`'))).toBe(true)
  expect(result).toEqual({
    binding: 'wasm',
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

test('disposes an engine that resolves before hydration startup times out', async ({ page }) => {
  const loaderURL = await getRuntimeLoaderURL()
  const hydrationURL = new URL('/slow-hydration.json', loaderURL).href
  await page.route(hydrationURL, async route => {
    await new Promise(resolve => setTimeout(resolve, 150))
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ version: 1, rules: [], resourceOrder: [] })
    })
  })
  await gotoRuntimeOrigin(page, loaderURL)

  const result = await page.evaluate(async ({ hydrationURL, loaderURL, manifest }) => {
    await import(loaderURL)
    const style = document.createElement('style')
    style.id = 'master-css'
    style.setAttribute('data-master-css-hydration-manifest', hydrationURL)
    document.head.append(style)
    let disposals = 0
    const engine = {
      binding: 'wasm' as const,
      ensureClassRules: () => ({ version: 1, mutations: [] }),
      deleteClassRules: () => ({ version: 1, mutations: [] }),
      registerEmittedGlobals: () => ({ version: 1, mutations: [] }),
      refresh: () => ({ version: 1, mutations: [] }),
      inspect: (className: string) => ({ version: 1, className, valid: false, rules: [] }),
      snapshot: () => ({
        version: 1,
        rules: [],
        resources: { variables: [], animations: [] },
        text: ''
      }),
      dispose: () => { disposals++ },
      [Symbol.dispose]: () => { disposals++ }
    }
    const binding = {
      kind: 'wasm' as const,
      createEngine: async () => engine
    }
    let code: string | undefined
    try {
      await globalThis.MasterCSSRuntime.start({
        manifest,
        binding,
        startupTimeoutMs: 25
      } as never)
    } catch (error) {
      code = (error as { code?: string }).code
    }
    style.remove()
    const retry = await globalThis.MasterCSSRuntime.start({ manifest })
    const retryBinding = retry.binding
    retry.dispose()
    return { code, disposals, retryBinding }
  }, { hydrationURL, loaderURL, manifest: defaultManifest })

  expect(result).toEqual({
    code: 'RUNTIME_STARTUP_TIMEOUT',
    disposals: 1,
    retryBinding: 'wasm'
  })
})

test('rejects every pending caller and disposes when emitted globals registration fails', async ({ page }) => {
  const loaderURL = await getRuntimeLoaderURL()
  await gotoRuntimeOrigin(page, loaderURL)

  const result = await page.evaluate(async ({ loaderURL, manifest }) => {
    await import(loaderURL)
    let disposals = 0
    const engine = {
      binding: 'wasm' as const,
      ensureClassRules: () => ({ version: 1, mutations: [] }),
      deleteClassRules: () => ({ version: 1, mutations: [] }),
      registerEmittedGlobals: () => {
        throw new Error('invalid emitted globals')
      },
      refresh: () => ({ version: 1, mutations: [] }),
      inspect: (className: string) => ({ version: 1, className, valid: false, rules: [] }),
      snapshot: () => ({
        version: 1,
        rules: [],
        resources: { variables: [], animations: [] },
        text: ''
      }),
      dispose: () => { disposals++ },
      [Symbol.dispose]: () => { disposals++ }
    }
    const binding = {
      kind: 'wasm' as const,
      createEngine: async () => {
        await new Promise(resolve => setTimeout(resolve, 25))
        return engine
      }
    }
    const first = globalThis.MasterCSSRuntime.start({ manifest, binding } as never)
    const second = globalThis.MasterCSSRuntime.start({
      manifest,
      emittedGlobals: { variables: { invalid: 1 } }
    })
    const failures = await Promise.allSettled([first, second])
    const retry = await globalThis.MasterCSSRuntime.start({ manifest })
    const retryBinding = retry.binding
    retry.dispose()
    return {
      disposals,
      failures: failures.map(settled => ({
        status: settled.status,
        message: settled.status === 'rejected' ? String(settled.reason) : undefined
      })),
      retryBinding
    }
  }, { loaderURL, manifest: defaultManifest })

  expect(result).toEqual({
    disposals: 1,
    failures: [
      { status: 'rejected', message: 'Error: invalid emitted globals' },
      { status: 'rejected', message: 'Error: invalid emitted globals' }
    ],
    retryBinding: 'wasm'
  })
})
