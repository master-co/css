import { expect, test } from '@playwright/test'
import { compileManifestSync } from '@master/css-compiler/node'
import { renderClassNamesSync } from '@master/css/node'
import { createServerRenderer } from '@master/css-server'
import { getRuntimeLoaderURL } from './init'

const compiled = compileManifestSync(`
@utilities {
  fallback { display:block; display:made-up-value; padding-left:20px; padding:10px; padding-left:30px; }
}
@layer components {
  .native { display:block; display:made-up-value; padding-left:20px; padding:10px; padding-left:30px; }
  .composed { @compose color:red; @compose color:blue; }
  .same-list { @compose color:red color:blue; }
  .reversed-list { @compose color:blue color:red; }
  .unused { color:green; }
  .z-first { color:red; } .a-last { color:blue; }
  .override { height:10px; }
}
`, {})
const classes = ['fallback', 'height:48px']
for (const mode of ['static', 'ssr', 'runtime', 'progressive'] as const) {
  test(`${mode}: ordered fallbacks and native components retain the browser cascade`, async ({ page }) => {
    const html = `<!doctype html><html><head><style>@layer theme,base,defaults,components,utilities;${compiled.css}</style></head><body>
      <span id="fallback" class="fallback">Utility</span><span id="native" class="native">Native</span>
      <div id="composed" class="composed"></div><div id="same" class="same-list"></div><div id="reversed" class="reversed-list"></div>
      <div id="order" class="z-first a-last"></div><div id="override" class="override height:48px"></div><div id="later"></div></body></html>`
    const rendered = renderClassNamesSync(classes, { manifest: compiled.manifest })
    expect(rendered.hydrationManifest.rules.find(rule => rule.className === 'fallback')!.nodes!.length).toBeGreaterThan(1)
    if (mode === 'static') await page.setContent(html.replace('</head>', `<style>${rendered.cssText}</style></head>`))
    else if (mode === 'runtime') await page.setContent(html)
    else {
      using server = createServerRenderer({ manifest: compiled.manifest })
      await page.setContent(server.renderHTML(html, { hydrationManifest: 'inject' }).html)
    }
    if (mode === 'runtime' || mode === 'progressive') await page.evaluate(async ({ loader, manifest }) => {
      const { startCSSRuntime } = await import(loader)
      await startCSSRuntime({ manifest })
    }, { loader: await getRuntimeLoaderURL(), manifest: compiled.manifest })
    for (const id of ['native', 'fallback']) {
      await expect(page.locator(`#${id}`)).toHaveCSS('display', 'block')
      await expect(page.locator(`#${id}`)).toHaveCSS('padding-left', '30px')
    }
    await expect(page.locator('#composed')).toHaveCSS('color', 'rgb(0, 0, 255)')
    await expect(page.locator('#order')).toHaveCSS('color', 'rgb(0, 0, 255)')
    await expect(page.locator('#override')).toHaveCSS('height', '48px')
    expect(await page.locator('#same').evaluate(el => getComputedStyle(el).color)).toBe(await page.locator('#reversed').evaluate(el => getComputedStyle(el).color))
    await page.locator('#later').evaluate(el => { el.className = 'unused' })
    await expect(page.locator('#later')).toHaveCSS('color', 'rgb(0, 128, 0)')
    if (mode === 'runtime' || mode === 'progressive') {
      await page.locator('#fallback').evaluate(el => { el.className = '' })
      await expect(page.locator('#fallback')).toHaveCSS('display', 'inline')
      await page.locator('#fallback').evaluate(el => { el.className = 'fallback' })
      await expect(page.locator('#fallback')).toHaveCSS('padding-left', '30px')
    }
  })
}
