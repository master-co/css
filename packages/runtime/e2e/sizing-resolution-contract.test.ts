import { expect, test } from '@playwright/test'
import preset from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { renderClassNamesSync } from '@master/css/node'
import { createServerRenderer } from '@master/css-server'
import { getRuntimeLoaderURL } from './init'

const parameterMixin = (name: string, property: string) => ({
  name: `--${name}`, parameters: [{ name: '--value' }], body: [{ type: 'declaration' as const, property, value: [{ type: 'function' as const, name: 'var', value: [{ type: 'text' as const, value: '--value' }] }] }]
})
const manifest = { ...preset, mixins: [...preset.mixins,
  parameterMixin('tile', 'width'), parameterMixin('box', 'width'), parameterMixin('tile', 'height')
] } as unknown as MasterCSSManifest
const classes = ['width:20px height:20px', 'size:99px', 'tile(40px)', 'box(30px)', 'display:flex', 'flex:1', 'display:flex:hover'].flatMap(value => value.split(' '))

for (const mode of ['static', 'ssr', 'runtime', 'progressive'] as const) {
  test(`${mode}: independent mixin replacement and explicit paired dimensions survive hydration and updates`, async ({ page }) => {
    const html = '<!doctype html><html><head><style>@layer theme,base,defaults,components,utilities;</style></head><body><div id="pair" class="width:20px height:20px"></div><div id="fallback" class="size:99px"></div><div id="native" style="size:99px"></div><div id="alias" class="tile(40px) box(30px)"></div><div id="display" class="display:flex flex:1"></div></body></html>'
    const rendered = renderClassNamesSync(classes, { manifest })
    expect(rendered.cssText).toContain('size:99px')
    expect(rendered.cssText).not.toContain('width:99px')
    expect(rendered.cssText).not.toContain('width:40px')
    if (mode === 'static') await page.setContent(html.replace('</head>', `<style>${rendered.cssText}</style></head>`))
    else if (mode === 'runtime') await page.setContent(html)
    else {
      using server = createServerRenderer({ manifest })
      await page.setContent(server.renderHTML(html, { hydrationManifest: 'inject' }).html)
    }
    if (mode === 'runtime' || mode === 'progressive') await page.evaluate(async ({ loader, manifest }) => {
      const { startCSSRuntime } = await import(loader)
      await startCSSRuntime({ manifest })
    }, { loader: await getRuntimeLoaderURL(), manifest })
    expect(await page.locator('#fallback').evaluate(el => [getComputedStyle(el).width, getComputedStyle(el).height])).toEqual(await page.locator('#native').evaluate(el => [getComputedStyle(el).width, getComputedStyle(el).height]))
    await expect(page.locator('#pair')).toHaveCSS('width', '20px')
    await expect(page.locator('#pair')).toHaveCSS('height', '20px')
    await expect(page.locator('#alias')).toHaveCSS('width', '30px')
    await expect(page.locator('#alias')).toHaveCSS('height', '40px')
    await expect(page.locator('#display')).toHaveCSS('display', 'flex')
    await expect(page.locator('#display')).toHaveCSS('flex-grow', '1')
    if (mode === 'runtime' || mode === 'progressive') {
      await page.locator('#pair').evaluate(el => { el.className = 'width:28px height:28px' })
      await expect(page.locator('#pair')).toHaveCSS('width', '28px')
      await expect(page.locator('#pair')).toHaveCSS('height', '28px')
      await page.locator('#alias').evaluate(el => { el.className = 'box(35px)' })
      await expect(page.locator('#alias')).toHaveCSS('width', '35px')
      await expect(page.locator('#alias')).toHaveCSS('height', '0px')
    }
  })
}
