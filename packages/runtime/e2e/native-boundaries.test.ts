import { expect, test } from '@playwright/test'
import { compileManifestSync } from '@master/css-compiler/node'
import { renderClassNamesSync } from '@master/css/node'
import { createServerRenderer } from '@master/css-server'
import preset from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { getRuntimeLoaderURL } from './init'

const compiled = compileManifestSync(`
@mode ocean { .ocean,.blue { @slot; } }
@theme { --color-probe: white; }
@theme ocean { --color-probe: blue; }
@custom-variant amp { &[data-label="&"] { @slot; } }
.native { --pipe:a|b; --money:$100; }
`, { baseManifest: preset as unknown as MasterCSSManifest })
const manifest = compiled.manifest
const classes = ['p-md@media((width>=1px))', 'p:8px@media((min-width:1px))', 'color:red@amp', 'bg-probe', 'margin:3px@ocean']
const html = '<!doctype html><html><head><style>@layer theme,base,defaults,components,utilities;</style></head><body>'
  + `<div id="probe" class="native ${classes.slice(0, 3).join(' ')}" data-label="&">Probe</div>`
  + '<section class="blue bg-probe margin:3px@ocean" id="mode"><div class="bg-probe margin:3px@ocean" id="child">Child</div></section>'
  + '</body></html>'

for (const mode of ['static', 'ssr', 'runtime', 'progressive'] as const) {
  test(`${mode}: native streams, literal ampersand, selector lists and equivalent-query cascade`, async ({ page }) => {
    const generated = renderClassNamesSync(classes, { manifest })
    const content = html.replace('</head>', `<style>${compiled.nativeCSS}</style></head>`)
    if (mode === 'static') await page.setContent(content.replace('</head>', `<style>${generated.cssText}</style></head>`))
    else if (mode === 'runtime') await page.setContent(content)
    else {
      using renderer = createServerRenderer({ manifest })
      const rendered = renderer.renderHTML(content, { hydrationManifest: 'inject' })
      expect(rendered.cssText).toBe(generated.cssText)
      await page.setContent(rendered.html)
    }
    if (mode === 'runtime' || mode === 'progressive') await page.evaluate(async ({ loader, manifest }) => {
      const { startCSSRuntime } = await import(loader)
      await startCSSRuntime({ manifest })
    }, { loader: await getRuntimeLoaderURL(), manifest })
    await expect(page.locator('#probe')).toHaveCSS('padding', '8px')
    await expect(page.locator('#probe')).toHaveCSS('color', 'rgb(255, 0, 0)')
    expect(await page.locator('#probe').evaluate(element => {
      const style = getComputedStyle(element)
      return [style.getPropertyValue('--pipe').trim(), style.getPropertyValue('--money').trim()]
    })).toEqual(['a|b', '$100'])
    for (const id of ['mode', 'child']) {
      await expect(page.locator(`#${id}`)).toHaveCSS('background-color', 'rgb(0, 0, 255)')
      await expect(page.locator(`#${id}`)).toHaveCSS('margin', '3px')
    }
    await page.locator('#probe').evaluate(element => { element.className = element.className.split(' ').reverse().join(' ') })
    await expect(page.locator('#probe')).toHaveCSS('padding', '8px')
    if (mode === 'runtime' || mode === 'progressive') {
      await page.locator('#probe').evaluate(element => { element.className = 'p:9px@media((width>=1px))' })
      await expect(page.locator('#probe')).toHaveCSS('padding', '9px')
      await page.locator('#mode').evaluate(element => { element.classList.remove('blue') })
      await expect(page.locator('#child')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
    }
  })
}

test('old hydration priorities are rejected before hydration', async ({ page }) => {
  const rendered = renderClassNamesSync(['p:8px@media((width>=1px))'], { manifest })
  const old = structuredClone(rendered.hydrationManifest)
  delete (old.rules[0].priority as Partial<typeof old.rules[0]['priority']>).features
  await page.setContent('<div class="p:8px@media((width>=1px))"></div>')
  const error = await page.evaluate(async ({ loader, manifest, old }) => {
    const { startCSSRuntime } = await import(loader)
    try { await startCSSRuntime({ manifest, hydrationManifest: old }); return null }
    catch (error) { return String(error) }
  }, { loader: await getRuntimeLoaderURL(), manifest, old })
  expect(error).toContain('Recompile')
})
