import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { renderClassNamesSync } from '@master/css/node'
import { flattenMasterCSSManifestVariables, type MasterCSSManifest } from '@master/css-schema/manifest'
import defaultManifest from '@master/css-preset/default-manifest.json' with { type: 'json' }
import init from './init'

const manifest = defaultManifest as unknown as MasterCSSManifest
const nativeCSS = readFileSync(new URL('../../preset/src/default-native.css', import.meta.url), 'utf8')
const surfaces = ['base', 'inset', 'raised', 'floating']
const textTokens = flattenMasterCSSManifestVariables(manifest.variables)
  .filter(({ namespace, key }) => namespace === 'color-text' && !['muted', 'disabled', 'inverse'].includes(key))
  .map(({ key }) => key)
const classes = ['fg-text-body', 'surface-base', 'shadow-sm', 'surface-floating/.8', 'fg-blue', "color:red@dark",
  'b-control', 'fg-text-muted', ...surfaces.map(key => `surface-${key}`), ...textTokens.map(key => `fg-text-${key}`)]
const rendered = renderClassNamesSync(classes, { manifest })

for (const mode of ['light', 'dark'] as const) {
  test(`native ${mode} color scheme, nesting, shadow inheritance and contrast`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: mode })
    await page.setContent(`<style>${nativeCSS}${rendered.cssText}</style>
      <div id="sample" class="surface-base fg-text-body shadow-sm">Body</div>
      <div data-theme="light"><div id="nested" data-theme="dark" class="surface-base fg-text-body">Nested</div><div id="host"></div></div>
      <div id="variant" class="color:red@dark">System variant</div>`)
    const data = await page.evaluate(({ surfaces, textTokens, css }) => {
      const sample = document.querySelector<HTMLElement>('#sample')!
      const read = (element: Element) => { const s = getComputedStyle(element); return { fg: s.color, bg: s.backgroundColor, shadow: s.boxShadow, scheme: s.colorScheme } }
      const system = read(sample)
      document.documentElement.dataset.theme = 'light'
      const light = read(sample)
      document.documentElement.dataset.theme = 'dark'
      const dark = read(sample)
      const nested = read(document.querySelector('#nested')!)
      const host = document.querySelector<HTMLElement>('#host')!
      const root = host.attachShadow({ mode: 'open' })
      root.innerHTML = `<style>${css}</style><div class="surface-base fg-text-body shadow-sm">Shadow</div>`
      const inherited = read(root.querySelector('div')!)
      host.dataset.theme = 'dark'
      const explicitHost = read(root.querySelector('div')!)
      sample.style.colorScheme = 'light'
      const direct = read(sample)
      sample.style.setProperty('--color-text-body', 'light-dark(rgb(1, 2, 3), rgb(4, 5, 6))')
      const override = read(sample)
      const canvas = document.createElement('canvas'), context = canvas.getContext('2d')!
      function luminance(color: string) {
        context.clearRect(0, 0, 1, 1); context.fillStyle = color; context.fillRect(0, 0, 1, 1)
        const rgb = Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3).map(x => x / 255)
        return rgb.reduce((total, x, i) => total + (x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4) * [.2126, .7152, .0722][i], 0)
      }
      const matrix: { scheme: string, surface: string, token: string, ratio: number }[] = []
      const probe = document.createElement('div'); document.body.append(probe)
      for (const scheme of ['light', 'dark']) for (const surface of surfaces) {
        probe.style.colorScheme = scheme
        for (const token of [...textTokens, 'muted', 'control']) {
          if (token === 'muted' && surface === 'floating') continue
          probe.className = `surface-${surface} ${token === 'control' ? 'b-control' : `fg-text-${token}`}`
          const s = getComputedStyle(probe), a = luminance(token === 'control' ? s.borderTopColor : s.color), b = luminance(s.backgroundColor)
          matrix.push({ scheme, surface, token, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) })
        }
      }
      probe.className = 'surface-floating/.8'
      const transparent = getComputedStyle(probe).backgroundColor
      return { system, light, dark, nested, inherited, explicitHost, direct, override, matrix, transparent, variant: read(document.querySelector('#variant')!) }
    }, { surfaces, textTokens, css: `${nativeCSS}${rendered.cssText}` })
    expect(data.light.bg).not.toBe(data.dark.bg)
    expect(data.light.shadow).not.toBe(data.dark.shadow)
    expect(data.system).toMatchObject(mode === 'light' ? { fg: data.light.fg, bg: data.light.bg } : { fg: data.dark.fg, bg: data.dark.bg })
    expect(data.nested.bg).toBe(data.dark.bg)
    expect(data.inherited.bg).toBe(data.light.bg)
    expect(data.explicitHost.bg).toBe(data.dark.bg)
    expect(data.direct.bg).toBe(data.light.bg)
    expect(data.override.fg).toBe('rgb(1, 2, 3)')
    expect(data.variant.fg === 'rgb(255, 0, 0)').toBe(mode === 'dark')
    expect(data.transparent).toMatch(/\/ 0\.8\)/)
    for (const row of data.matrix) expect(row.ratio, JSON.stringify(row)).toBeGreaterThanOrEqual(row.token === 'control' ? 3 : 4.5)
  })
}

test('SSR hydration and runtime use the same CSS through manual theme switches', async ({ page }) => {
  await page.setContent(`<style>${nativeCSS}</style><p id="sample" class="surface-base fg-text-body shadow-sm">Hydrated</p>`)
  const ssr = renderClassNamesSync(['surface-base', 'fg-text-body', 'shadow-sm'], { manifest })
  await init(page, ssr.cssText, undefined, ssr.hydrationManifest)
  const before = await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.text)
  const colors = await page.evaluate(() => {
    const sample = document.querySelector('#sample')!
    document.documentElement.dataset.theme = 'light'
    const light = getComputedStyle(sample).color
    document.documentElement.dataset.theme = 'dark'
    return [light, getComputedStyle(sample).color]
  })
  expect(colors[0]).not.toBe(colors[1])
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.text)).toBe(before)
})
