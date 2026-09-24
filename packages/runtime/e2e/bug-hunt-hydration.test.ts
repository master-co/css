import { expect, test } from '@playwright/test'
import { getRuntimeLoaderURL } from './init'

test('BH-0008: external hydration works with modules and Wasm allowed but unsafe-eval denied', async ({ page }) => {
  const loaderURL = await getRuntimeLoaderURL()
  const manifestURL = new URL('/audit-hydration.json', loaderURL).href
  await page.route(manifestURL, (route) => route.fulfill({
    contentType: 'application/json',
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ version: 1, languageVersion: 2, rules: [], resourceOrder: [] })
  }))
  await page.setContent(`<html><head>
    <meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' http://127.0.0.1:*">
    <style id="master-css" data-master-css-hydration-manifest="${manifestURL}"></style>
    </head><body class="block"></body></html>`)
  const result = await page.evaluate(async ({ loaderURL, manifestURL }) => {
    const response = await fetch(manifestURL)
    const directImport = await import(manifestURL, { with: { type: 'json' } })
    try {
      const { startCSSRuntime } = await import(loaderURL)
      const runtime = await startCSSRuntime()
      runtime.dispose()
      return { fetchOK: response.ok, importVersion: directImport.default.version, error: null }
    } catch (cause) {
      const error = cause as Error & { cause?: Error }
      return { fetchOK: response.ok, importVersion: directImport.default.version, error: error.message, cause: error.cause?.message }
    }
  }, { loaderURL, manifestURL })
  expect(result).toEqual({ fetchOK: true, importVersion: 1, error: null })
})
