import { expect, test, type Page } from '@playwright/test'
import preset from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { renderClassNamesSync } from '@master/css/node'
import { createServerRenderer } from '@master/css-server'
import { getRuntimeLoaderURL } from './init'

const manifest = preset as unknown as MasterCSSManifest

/** Elements whose classes compete for one property family, each in both class orders. */
const CASES: [id: string, classes: string][] = [
  ['side-over-token', 'm-md mt(0)'],
  ['token-side-over-function', 'm(4) mt-md'],
  ['axis-over-token', 'm-md mx-auto'],
  ['three-coverages', 'm(8) mx(4) ml(0)'],
  ['border-families', 'b(2) bt(0) b-solid b-red-60'],
  ['function-over-token', 'm-md m(4)'],
  ['native-over-function', 'm(4) (margin:2rem)'],
  ['logical-and-physical', 'mxs(10) ml(0)']
]
const reversed = (classes: string) => classes.split(' ').reverse().join(' ')
const classes = [...new Set(CASES.flatMap(([, value]) => value.split(' ')).concat(['truncate', 'select-none', '(color:red)#target', 'flex', 'w(100)', 'w(300)']))]

function html(direction: string, writingMode: string) {
  // Flex items keep their specified margins: a block box would report used margins
  // that over-constrained layout adjusts differently across browsers.
  const elements = CASES.flatMap(([id, value]) => [
    `<div class="flex w(300)"><div id="${id}" class="w(100) ${value}">x</div></div>`,
    `<div class="flex w(300)"><div id="${id}-reversed" class="w(100) ${reversed(value)}">x</div></div>`
  ]).join('')
  return `<!doctype html><html dir="${direction}" style="writing-mode:${writingMode}"><head><style>@layer theme,base,defaults,components,utilities;</style></head><body>${elements}`
    + '<div style="width:80px"><p id="truncate" class="truncate">A very long file name that should not widen its column</p></div>'
    + '<p id="select" class="select-none">Fixed</p><p id="target" class="(color:red)#target">Target</p></body></html>'
}

async function load(page: Page, mode: 'static' | 'ssr' | 'runtime' | 'progressive', source: string) {
  if (mode === 'static') await page.setContent(source.replace('</head>', `<style>${renderClassNamesSync(classes, { manifest }).cssText}</style></head>`))
  else if (mode === 'runtime') await page.setContent(source)
  else {
    using server = createServerRenderer({ manifest })
    await page.setContent(server.renderHTML(source, { hydrationManifest: 'inject' }).html)
  }
  if (mode === 'runtime' || mode === 'progressive') await page.evaluate(async ({ loader, manifest }) => {
    const { startCSSRuntime } = await import(loader)
    await startCSSRuntime({ manifest })
  }, { loader: await getRuntimeLoaderURL(), manifest })
}

const margins = (page: Page, id: string) => page.locator(`#${id}`).evaluate((element) => {
  const style = getComputedStyle(element)
  return [style.marginTop, style.marginRight, style.marginBottom, style.marginLeft]
})

for (const mode of ['static', 'ssr', 'runtime', 'progressive'] as const) {
  test(`${mode}: atomic utilities override by family coverage in either class order`, async ({ page }) => {
    await load(page, mode, html('ltr', 'horizontal-tb'))
    for (const suffix of ['', '-reversed']) {
      expect(await margins(page, `side-over-token${suffix}`)).toEqual(['0px', '16px', '16px', '16px'])
      expect(await margins(page, `token-side-over-function${suffix}`)).toEqual(['16px', '4px', '4px', '4px'])
      expect(await margins(page, `axis-over-token${suffix}`)).toEqual(['16px', '100px', '16px', '100px'])
      expect(await margins(page, `three-coverages${suffix}`)).toEqual(['8px', '4px', '8px', '0px'])
      expect(await margins(page, `function-over-token${suffix}`)).toEqual(['4px', '4px', '4px', '4px'])
      expect(await margins(page, `native-over-function${suffix}`)).toEqual(['32px', '32px', '32px', '32px'])
      expect(await page.locator(`#border-families${suffix}`).evaluate((element) => {
        const style = getComputedStyle(element)
        return [style.borderTopWidth, style.borderRightWidth, style.borderTopStyle, style.borderLeftStyle, style.borderRightColor === style.borderLeftColor]
      })).toEqual(['0px', '2px', 'solid', 'solid', true])
    }
    await expect(page.locator('#truncate')).toHaveCSS('overflow-x', 'hidden')
    await expect(page.locator('#truncate')).toHaveCSS('text-overflow', 'ellipsis')
    await expect(page.locator('#truncate')).toHaveCSS('white-space', 'nowrap')
    expect(await page.locator('#truncate').evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true)
    await expect(page.locator('#select')).toHaveCSS('user-select', 'none')
    await expect(page.locator('#target')).toHaveCSS('color', 'rgb(255, 0, 0)')
  })
}

// Logical and physical members of one coverage keep a stable property order, never a
// guessed writing mode: `margin-left` follows `margin-inline-start` in every direction.
for (const [direction, writingMode, expected] of [
  ['ltr', 'horizontal-tb', ['0px', '0px', '0px', '0px']],
  ['rtl', 'horizontal-tb', ['0px', '10px', '0px', '0px']],
  ['ltr', 'vertical-rl', ['10px', '0px', '0px', '0px']]
] as const) {
  test(`${direction} ${writingMode}: logical and physical sides resolve by computed style`, async ({ page }) => {
    for (const mode of ['static', 'runtime'] as const) {
      await load(page, mode, html(direction, writingMode))
      for (const suffix of ['', '-reversed']) {
        expect(await margins(page, `logical-and-physical${suffix}`)).toEqual(expected)
        expect((await margins(page, `three-coverages${suffix}`))[3]).toBe('0px')
      }
    }
  })
}
