import { test, expect } from '@playwright/test'
import { compileManifestSync } from '@master/css-compiler/node'
import { createServerRenderer } from '@master/css-server'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { getRuntimeLoaderURL } from './init'

const manifest = defaultManifestJSON as unknown as MasterCSSManifest
const ambiguous = compileManifestSync('@theme { --font-family-sm: monospace; }', { baseManifest: manifest }).manifest
const html = `<!doctype html><html><head><style>@layer theme,base,defaults,components,utilities;html{font-size:16px}</style></head><body>
<p id="type" class="font-sans font-sm font-bold">Typography</p>
<div id="motion" class="animation-name:fade animation-fast animation-smooth transition-fast transition-smooth">Timing</div>
<div id="shorthand" class="animate-fade animation-fast animation-smooth">Shorthand</div>
</body></html>`

for (const mode of ['runtime', 'progressive'] as const) {
  test(`${mode} resolves shared prefixes, native resets and ambiguity refresh`, async ({ page }) => {
    using renderer = createServerRenderer({ manifest })
    const rendered = renderer.renderHTML(html, { hydrationManifest: 'inject' })
    await page.setContent(mode === 'progressive' ? rendered.html : html)
    await page.evaluate(async ({ loader, manifest }) => {
      const { startCSSRuntime } = await import(loader)
      await startCSSRuntime({ manifest })
    }, { loader: await getRuntimeLoaderURL(), manifest })
    await expect(page.locator('#type')).toHaveCSS('font-size', '14px')
    await expect(page.locator('#type')).toHaveCSS('font-weight', '700')
    expect(await page.locator('#type').evaluate(element => getComputedStyle(element).fontFamily)).toContain('sans-serif')
    for (const property of ['animation-duration', 'transition-duration']) await expect(page.locator('#motion')).toHaveCSS(property, '0.15s')
    for (const property of ['animation-timing-function', 'transition-timing-function']) await expect(page.locator('#motion')).toHaveCSS(property, 'cubic-bezier(0.4, 0, 0.2, 1)')
    await expect(page.locator('#shorthand')).toHaveCSS('animation-duration', '1s')
    await expect(page.locator('#shorthand')).toHaveCSS('animation-timing-function', 'ease')
    if (mode === 'progressive') expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().hydration.state)).toBe('progressive')
    await page.evaluate(manifest => globalThis.__MASTER_CSS_RUNTIME_TEST__.refresh(manifest), ambiguous)
    await expect(page.locator('#type')).toHaveCSS('font-size', '16px')
    expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.text)).not.toContain('.font-sm{')
    await page.evaluate(manifest => globalThis.__MASTER_CSS_RUNTIME_TEST__.refresh(manifest), manifest)
    await expect(page.locator('#type')).toHaveCSS('font-size', '14px')
    await page.locator('#type').evaluate(element => { element.className = 'font-mono font-lg font-regular' })
    await expect(page.locator('#type')).toHaveCSS('font-size', '18px')
    await expect(page.locator('#type')).toHaveCSS('font-weight', '400')
    await page.locator('#type').evaluate(element => { element.remove() })
    await expect.poll(() => page.evaluate(() => {
      globalThis.__MASTER_CSS_RUNTIME_TEST__.flushRetainedClassRules()
      return globalThis.__MASTER_CSS_RUNTIME_TEST__.text
    })).not.toContain('--font-size-lg:')
  })
}
