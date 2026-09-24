import { expect, test, type Page } from '@playwright/test'
import { renderClassNamesSync } from '@master/css/node'
import { createServerRenderer } from '@master/css-server'
import defaultManifest from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import init, { getRuntimeLoaderURL } from './init'

const manifest = defaultManifest as unknown as MasterCSSManifest
const classLists = [
  'p-md p:8px',
  'p:8px p-md',
  '{p-md;pt:12px} p:8px',
  'p:8px {pt:12px;p-md}',
  'p-md p:8px@sm',
  'font-mono font-family:mono',
  'bg-red background-color:transparent b-solid b:2px outline-solid outline:2px',
  'fg-red color:red',
  'bg-cover',
  'bg:transparent'
]
const html = '<!doctype html><html><head><style>@layer theme,base,defaults,components,utilities;html{font-size:16px}@layer defaults{#target-9{background-color:red;background-image:linear-gradient(red,blue);background-size:cover}}</style></head><body>'
  + classLists.map((classes, i) => `<div id="target-${i}" class="${classes}">test</div>`).join('') + '</body></html>'

async function computed(page: Page) {
  return page.evaluate(() => [...document.querySelectorAll('div')].map(element => {
    const style = getComputedStyle(element)
    return { padding: style.padding, fontFamily: style.fontFamily, backgroundColor: style.backgroundColor, backgroundImage: style.backgroundImage, backgroundSize: style.backgroundSize, borderStyle: style.borderStyle, outlineStyle: style.outlineStyle, color: style.color }
  }))
}

for (const mode of ['static', 'ssr', 'runtime', 'progressive'] as const) {
  test(`${mode} preserves named and native value priorities, groups and shorthand resets`, async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 720 })
    await page.emulateMedia({ colorScheme: 'light' })
    const classes = classLists.flatMap(value => value.split(' '))
    const generated = renderClassNamesSync(classes, { manifest })
    if (mode === 'static') {
      await page.setContent(html.replace('</head>', `<style>${generated.cssText}</style></head>`))
    } else if (mode === 'ssr' || mode === 'progressive') {
      using renderer = createServerRenderer({ manifest })
      const rendered = renderer.renderHTML(html, { hydrationManifest: 'inject' })
      expect(rendered.cssText).toBe(generated.cssText)
      await page.setContent(rendered.html)
      const before = await computed(page)
      if (mode === 'progressive') {
        await page.evaluate(async ({ loader, manifest }) => {
          const { startCSSRuntime } = await import(loader)
          await startCSSRuntime({ manifest })
        }, { loader: await getRuntimeLoaderURL(), manifest })
        expect(await computed(page)).toEqual(before)
        expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().hydration.state)).toBe('progressive')
      }
    } else {
      await page.setContent(html)
      await init(page)
    }
    const styles = await computed(page)
    expect(styles[0].padding).toBe('8px')
    expect(styles[1].padding).toBe('8px')
    expect(styles[2].padding).toBe('12px 8px 8px')
    expect(styles[3].padding).toBe('12px 8px 8px')
    expect(styles[4].padding).toBe('8px')
    expect(styles[5].fontFamily).toBe('mono')
    expect(styles[6]).toMatchObject({ backgroundColor: 'rgba(0, 0, 0, 0)', borderStyle: 'none', outlineStyle: 'none' })
    expect(styles[7].color).toBe('rgb(255, 0, 0)')
    expect(styles[8].backgroundSize).toBe('cover')
    expect(styles[9]).toMatchObject({ backgroundColor: 'rgba(0, 0, 0, 0)', backgroundImage: 'none', backgroundSize: 'auto' })
    await page.setViewportSize({ width: 500, height: 720 })
    expect((await computed(page))[4].padding).toBe('16px')
    if (mode === 'runtime' || mode === 'progressive') {
      await page.locator('#target-0').evaluate(element => { element.className = 'p-md p:10px' })
      await expect(page.locator('#target-0')).toHaveCSS('padding', '10px')
      await page.locator('#target-2').evaluate(element => { element.className = '{p-md;pt:14px} p:8px' })
      await expect(page.locator('#target-2')).toHaveCSS('padding-top', '14px')
      expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.text)).toContain('padding-top:14px')
    }
  })
}

test('native resolution descriptors survive runtime compilation', async ({ page }) => {
  const className = 'background-image:image-set(url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)|1x)'
  await page.setContent(`<div id="image" class="${className}"></div>`)
  await init(page)
  const css = await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.text)
  expect(css).toContain(' 1x)')
  expect(css).not.toContain('0.25rem')
  expect(await page.locator('#image').evaluate(element => getComputedStyle(element).backgroundImage)).toContain('image-set(')
})
