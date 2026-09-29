import { expect, test } from '@playwright/test'
import { renderClassNamesSync } from '@master/css/node'
import { createServerRenderer } from '@master/css-server'
import { getRuntimeLoaderURL } from './init'
import defaultManifest from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'

const manifest = defaultManifest as unknown as MasterCSSManifest

const invalid = ['{p-md;animation:float|1s}', '{display:block}:hover!', 'color:red:of(.active)', 'color:red:is(:of(.active))']
const classes = [...invalid, 'padding:11px', "content:':of(x)'::after"]
const html = `<html><head></head><body class="active"><div id="probe" class="${classes.join(' ')}"></div></body></html>`

for (const mode of ['static', 'ssr', 'runtime', 'progressive'] as const) {
  test(`${mode}: retired classes produce no rules or resources`, async ({ page }) => {
    const generated = renderClassNamesSync(classes, { manifest })
    expect(generated.cssText).toBe(renderClassNamesSync(classes.slice(invalid.length), { manifest }).cssText)
    if (mode === 'static') {
      await page.setContent(html.replace('</head>', `<style>${generated.cssText}</style></head>`))
    } else if (mode === 'runtime') {
      await page.setContent(html)
    } else {
      using renderer = createServerRenderer({ manifest })
      const rendered = renderer.renderHTML(html, { hydrationManifest: 'inject' })
      expect(rendered.cssText).toBe(generated.cssText)
      await page.setContent(rendered.html)
    }
    if (mode === 'runtime' || mode === 'progressive') {
      const text = await page.evaluate(async (loader) => {
        const { startCSSRuntime } = await import(loader)
        const runtime = await startCSSRuntime()
        return runtime.snapshot().cssText
      }, await getRuntimeLoaderURL())
      expect(text).toBe(generated.cssText)
    }
    await expect(page.locator('#probe')).toHaveCSS('padding', '11px')
    await expect(page.locator('#probe')).toHaveCSS('color', 'rgb(0, 0, 0)')
  })
}

test('language 7 hydration is rejected by the existing validation path', async ({ page }) => {
  await page.setContent(`<style id="master-css"></style><script id="master-css-hydration-manifest" type="application/json">${JSON.stringify({ version: 3, languageVersion: 7, rules: [], resourceOrder: { variables: [], keyframes: [] } })}</script>`)
  const error = await page.evaluate(async (loader) => {
    try {
      const { startCSSRuntime } = await import(loader)
      const runtime = await startCSSRuntime()
      runtime.dispose()
      return null
    } catch (error) {
      return String(error)
    }
  }, await getRuntimeLoaderURL())
  expect(error).toMatch(/hydration|version/i)
})
