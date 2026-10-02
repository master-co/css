import { expect, test } from '@playwright/test'
import { compileManifestSync } from '@master/css-compiler/node'
import { renderClassNamesSync } from '@master/css/node'
import { createServerRenderer } from '@master/css-server'
import defaultManifest from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { getRuntimeLoaderURL } from './init'

const manifest = compileManifestSync('@mixin --layout { display:flex; } @utility layout { display:flex; }', { baseManifest: defaultManifest as unknown as MasterCSSManifest }).manifest
const cases = [
  { classes: "p-md padding:8px", padding: '8px' },
  { classes: "padding:8px p-md", padding: '8px' },
  { classes: "p-md! padding:8px", padding: '16px' },
  { classes: "p-md! padding:8px!", padding: '8px' },
  { classes: "padding:8px@layer(base)! padding:12px!", padding: '8px' },
  { classes: "padding:8px@layer(base) padding:12px", padding: '12px' },
  { classes: "outside padding:8px", padding: '32px' },
  { classes: "outside padding:8px!", padding: '8px' },
  { classes: "component padding:8px", padding: '8px' },
  { classes: "component-important padding:8px!", padding: '24px' },
  { classes: "padding:8px padding-top:12px", padding: '8px' },
  { classes: "p-md padding-top:12px padding:8px", padding: '8px' }
]
const classes = [...cases.flatMap(item => item.classes.split(' ')), 'display:block', 'layout']
const html = `<!doctype html><html><head><style>
@layer theme,base,defaults,components,utilities;
html { font-size:16px; }
.outside { padding:32px; }
@layer components { .component { padding:24px; } .component-important { padding:24px!important; } }
</style></head><body>
${cases.map((item, index) => `<div id="case-${index}" class="${item.classes}"></div>`).join('')}
<div id="raw" class="display:block layout"></div><div id="named" class="layout display:block"></div>
</body></html>`

for (const mode of ["static", 'ssr', 'runtime', 'progressive'] as const) {
  test(`${mode}: value priority respects native importance and layer boundaries`, async ({ page }) => {
    const generated = renderClassNamesSync(classes, { manifest })
    if (mode === "static") {
      await page.setContent(html.replace('</head>', `<style>${generated.cssText}</style></head>`))
    } else if (mode === 'runtime') {
      await page.setContent(html)
    } else {
      using server = createServerRenderer({ manifest })
      const rendered = server.renderHTML(html, { hydrationManifest: 'inject' })
      expect(rendered.cssText).toBe(generated.cssText)
      await page.setContent(rendered.html)
    }
    if (mode === 'runtime' || mode === 'progressive') {
      await page.evaluate(async ({ loader, manifest }) => {
        const { startCSSRuntime } = await import(loader)
        await startCSSRuntime({ manifest })
      }, { loader: await getRuntimeLoaderURL(), manifest })
    }
    for (const [index, item] of cases.entries()) {
      await expect(page.locator(`#case-${index}`)).toHaveCSS('padding', item.padding)
    }
    // A direct property overrides a recipe regardless of markup order.
    await expect(page.locator('#raw')).toHaveCSS('display', 'block')
    await expect(page.locator('#named')).toHaveCSS('display', 'block')
    if (mode === 'runtime' || mode === 'progressive') {
      // Observe a full withdrawal before re-inserting in reverse order, so this
      // exercises incremental CSSOM updates rather than only HTML class order.
      await page.locator('#case-11').evaluate(element => { element.className = '' })
      await expect(page.locator('#case-11')).toHaveCSS('padding', '0px')
      await page.locator('#case-11').evaluate(element => { element.className = "padding:8px padding-top:12px p-md" })
      await expect(page.locator('#case-11')).toHaveCSS('padding', '8px')
    }
  })
}
