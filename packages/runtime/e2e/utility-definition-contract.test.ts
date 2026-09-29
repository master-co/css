import { expect, test } from '@playwright/test'
import { compileManifestSync } from '@master/css-compiler/node'
import { renderClassNamesSync } from '@master/css/node'
import { createServerRenderer } from '@master/css-server'
import { getRuntimeLoaderURL } from './init'

const compiled = compileManifestSync(`
@theme { :root, :host { --color-obsolete: red; } }
@mixin --panel { @media all { padding:5px; display:block; } width:var(--dimension); height:var(--dimension); }
@mixin --cleared { color:var(--color-obsolete); &:hover { padding:100px; } }
@mixin --cleared { }
@mixin --aligned-start { text-align:left; }
@mixin --aligned-end { text-align:right; }
@mixin --aligned-end { text-align:center; }
@mixin --aligned-start { text-align:justify; }
@mixin --aligned-end { text-align:left; }
@layer base { .stroke { color:blue; -webkit-text-stroke:3px red; } }
`, {})
const classes = ['panel', 'cleared', 'aligned-start', 'aligned-end', "-webkit-text-stroke:1px", "-webkit-text-stroke-width:1px"]

for (const mode of ["static", 'ssr', 'runtime', 'progressive'] as const) {
  test(`${mode}: fixed utility intent, replacement and vendor reset semantics`, async ({ page }) => {
    const html = `<!doctype html><html><head><style>@layer theme,base,defaults,components,utilities;${compiled.css}</style></head><body>
    <span id="panel" style="--dimension:24px" class="panel">Panel</span>
    <span id="empty" class="cleared">Empty</span><div id="replaced" class="aligned-start"></div><div id="static" class="aligned-end"></div>
    <span id="shorthand" class="stroke -webkit-text-stroke:1px">A</span><span id="longhand" class="stroke -webkit-text-stroke-width:1px">B</span></body></html>`
    const rendered = renderClassNamesSync(classes, { manifest: compiled.manifest })
    expect(rendered.cssText).not.toContain('--color-obsolete')
    expect(rendered.cssText).not.toContain('padding:100px')
    expect(rendered.hydrationManifest.languageVersion).toBe(9)
    if (mode === "static") await page.setContent(html.replace('</head>', `<style>${rendered.cssText}</style></head>`))
    else if (mode === 'runtime') await page.setContent(html)
    else {
      using server = createServerRenderer({ manifest: compiled.manifest })
      await page.setContent(server.renderHTML(html, { hydrationManifest: 'inject' }).html)
    }
    if (mode === 'runtime' || mode === 'progressive') await page.evaluate(async ({ loader, manifest }) => {
      const { startCSSRuntime } = await import(loader)
      await startCSSRuntime({ manifest })
    }, { loader: await getRuntimeLoaderURL(), manifest: compiled.manifest })
    await expect(page.locator('#panel')).toHaveCSS('display', 'block')
    await expect(page.locator('#panel')).toHaveCSS('width', '24px')
    await expect(page.locator('#panel')).toHaveCSS('padding', '5px')
    await expect(page.locator('#empty')).toHaveCSS('padding', '0px')
    await expect(page.locator('#replaced')).toHaveCSS('text-align', 'justify')
    await expect(page.locator('#static')).toHaveCSS('text-align', 'left')
    await expect(page.locator('#shorthand')).toHaveCSS('-webkit-text-stroke-color', 'rgb(0, 0, 255)')
    await expect(page.locator('#longhand')).toHaveCSS('-webkit-text-stroke-color', 'rgb(255, 0, 0)')
    await page.locator('#panel').evaluate(el => (el as HTMLElement).style.setProperty('--dimension', '32px'))
    await expect(page.locator('#panel')).toHaveCSS('width', '32px')
    if (mode === 'runtime' || mode === 'progressive') {
      await page.locator('#panel').evaluate(el => { el.className = '' })
      await expect(page.locator('#panel')).toHaveCSS('display', 'inline')
      await page.locator('#panel').evaluate(el => { el.className = 'panel' })
      await expect(page.locator('#panel')).toHaveCSS('width', '32px')
    }
  })
}
