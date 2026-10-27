import { test, expect } from '@playwright/test'
import { compileRenderedStylesheet, createRuntimeStylesheetAsset } from '@master/css-compiler/stylesheet'
import { createCompilerSync } from '@master/css-compiler/node'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { getRuntimeLoaderURL } from '../init'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

// Astro builds its runtime in a client bundle that never sees the page CSS, so
// that bundle's emitted globals are empty while the server's list the tokens
// the linked stylesheet already defines.
test('hydrates tokens a linked stylesheet emits when the runtime bundle does not know them', async ({ page }) => {
  const href = 'https://owned.example/app.css'
  const result = await compileRenderedStylesheet('/app.css', '@layer components{.card{color:var(--color-text-body)}}', {
    baseManifest: defaultManifest, classes: []
  })
  expect(result.emittedGlobals.variables['color-text-body']).toBeGreaterThan(0)
  using compiler = createCompilerSync()
  const { renderHTML } = await import('@master/css-server')
  const rendered = renderHTML(`<html><head><link rel="stylesheet" href="${href}"></head><body><main id="probe" class="card fg-text-body margin-top:12px">Probe</main></body></html>`, {
    manifest: result.manifest,
    emittedGlobals: result.emittedGlobals,
    stylesheets: [{ href, asset: createRuntimeStylesheetAsset(compiler, result.css, href, [href]) }],
    hydrationManifest: 'inject'
  })
  expect(rendered.cssText).not.toContain('--color-text-body:')
  expect(rendered.hydrationManifest?.resourceOrder.variables).toEqual([])
  expect(rendered.hydrationManifest?.emittedGlobals?.variables?.['color-text-body']).toBeGreaterThan(0)

  const loader = await getRuntimeLoaderURL()
  const documentURL = new URL('/stylesheet-emitted-globals.html', loader).href
  await page.route(documentURL, route => route.fulfill({ contentType: 'text/html', body: '<html><head></head><body></body></html>' }))
  await page.route('https://owned.example/**', route => route.fulfill({ status: 404 }))
  await page.goto(documentURL)
  await page.setContent(rendered.html)
  const prerendered = await page.locator('style#master-css').textContent()
  const color = await page.locator('#probe').evaluate(element => getComputedStyle(element).color)
  const warnings: string[] = []
  page.on('console', message => { if (message.type() === 'warning') warnings.push(message.text()) })

  await page.evaluate(async ({ loader, manifest }) => {
    const { startCSSRuntime } = await import(loader)
    await startCSSRuntime({ manifest, emittedGlobals: {}, stylesheetDelivery: { base: 'https://owned.example/' } })
  }, { loader, manifest: result.manifest })

  expect(warnings).toEqual([])
  expect(await page.evaluate(() => globalThis.masterCSSRuntime.snapshot().hydration)).toEqual({ state: 'progressive', manifestLoaded: true })
  expect(await page.locator('style#master-css').textContent()).toBe(prerendered)
  // The linked stylesheet keeps owning the token as its users come and go.
  await page.locator('#probe').evaluate(element => element.classList.remove('fg-text-body', 'card'))
  await page.locator('#probe').evaluate(element => element.classList.add('fg-text-body'))
  await expect.poll(() => page.locator('#probe').evaluate(element => getComputedStyle(element).color)).toBe(color)
  expect(await page.evaluate(() => globalThis.masterCSSRuntime.snapshot().cssText)).not.toContain('--color-text-body:')
})
