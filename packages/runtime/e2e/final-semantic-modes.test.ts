import { expect, test } from '@playwright/test'
import { compileManifestSync } from '@master/css-compiler/node'
import { renderClassNamesSync } from '@master/css/node'
import { createServerRenderer } from '@master/css-server'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { getRuntimeLoaderURL } from './init'

const manifest = compileManifestSync(`
@mode light {
  @media (prefers-color-scheme: light) { :root:not([data-theme]) { @slot; } }
  [data-theme="light"] { @slot; }
}
@mode dark {
  @media (prefers-color-scheme: dark) { :root:not([data-theme]) { @slot; } }
  [data-theme="dark"] { @slot; }
}
@mode ocean {
  [data-theme="ocean"] { @slot; }
  :host([data-theme="ocean"]) { @slot; }
}
@theme { --color-probe: white; }
@theme dark { --color-probe: black; }
@theme ocean { --color-probe: blue; }
`, { baseManifest: defaultManifestJSON as unknown as MasterCSSManifest }).manifest
const classes = ['bg-probe', 'padding:11px@dark', 'color:red@ocean', 'padding:9px@media((width>=800px))@media((hover:hover))']
const html = '<!doctype html><html class="bg-probe padding:11px@dark"><head><style>@layer theme,base,defaults,components,utilities;</style></head><body>'
  + '<div id="outside" class="bg-probe padding:11px@dark">Outside</div>'
  + '<section data-theme="ocean" id="ocean" class="bg-probe color:red@ocean"><div id="nested" class="bg-probe padding:11px@dark color:red@ocean">Nested</div></section>'
  + '<div id="query" class="padding:9px@media((width>=800px))@media((hover:hover))">Query</div></body></html>'

for (const mode of ['static', 'ssr', 'runtime', 'progressive'] as const) {
  test(`${mode}: explicit mode branches, inheritance and repeated query wrappers`, async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 700 })
    await page.emulateMedia({ colorScheme: 'dark' })
    const generated = renderClassNamesSync(classes, { manifest })
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
      await page.evaluate(async ({ loader, manifest }) => {
        const { startCSSRuntime } = await import(loader)
        await startCSSRuntime({ manifest })
      }, { loader: await getRuntimeLoaderURL(), manifest })
    }
    await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(0, 0, 0)')
    await expect(page.locator('html')).toHaveCSS('padding', '11px')
    await expect(page.locator('#outside')).toHaveCSS('background-color', 'rgb(0, 0, 0)')
    await expect(page.locator('#ocean')).toHaveCSS('background-color', 'rgb(0, 0, 255)')
    await expect(page.locator('#ocean')).toHaveCSS('color', 'rgb(255, 0, 0)')
    await expect(page.locator('#nested')).toHaveCSS('background-color', 'rgb(0, 0, 255)')
    // An ancestor's dark guard continues to match inside an ocean theme.
    await expect(page.locator('#nested')).toHaveCSS('padding', '11px')
    await expect(page.locator('#query')).toHaveCSS('padding', '9px')
    await page.locator('html').evaluate(element => element.setAttribute('data-theme', 'light'))
    await expect(page.locator('#outside')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
    await expect(page.locator('#outside')).toHaveCSS('padding', '0px')
    await page.setViewportSize({ width: 700, height: 700 })
    await expect(page.locator('#query')).toHaveCSS('padding', '0px')
  })
}

test('explicit host mode guards apply to shadow descendants without crossing boundaries', async ({ page }) => {
  const generated = renderClassNamesSync(['bg-probe', 'color:red@ocean'], { manifest })
  await page.setContent('<div id="host" data-theme="ocean"></div><div id="outside">Outside</div>')
  await page.locator('#host').evaluate((element, css) => {
    const root = element.attachShadow({ mode: 'open' })
    root.innerHTML = `<style>${css}</style><div id="inside" class="bg-probe color:red@ocean">Inside</div>`
  }, generated.cssText)
  await expect(page.locator('#inside')).toHaveCSS('background-color', 'rgb(0, 0, 255)')
  await expect(page.locator('#inside')).toHaveCSS('color', 'rgb(255, 0, 0)')
  await expect(page.locator('#outside')).not.toHaveCSS('color', 'rgb(255, 0, 0)')
  await page.locator('#host').evaluate(element => element.removeAttribute('data-theme'))
  await expect(page.locator('#inside')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
})
