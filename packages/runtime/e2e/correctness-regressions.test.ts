import { expect, test, type Page } from '@playwright/test'
import { createServerRenderer } from '@master/css-server'
import defaultManifest from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import init, { getRuntimeLoaderURL } from './init'

const preset = defaultManifest as unknown as MasterCSSManifest
const mixin = (name: string, declarations: Record<string, string>) => ({
  name: `--${name}`,
  body: Object.entries(declarations).map(([property, value]) => ({ type: 'declaration' as const, property, value: [{ type: 'text' as const, value }] }))
})

async function startRendered(page: Page, html: string, manifest: MasterCSSManifest) {
  await page.setContent(html)
  await page.evaluate(async ({ loader, manifest }) => {
    const { startCSSRuntime } = await import(loader)
    await startCSSRuntime({ manifest })
  }, { loader: await getRuntimeLoaderURL(), manifest })
}

test('refresh creates rules for previously unknown DOM classes and removes obsolete rules', async ({ page }) => {
  await page.setContent('<div id="target" class="new-custom"></div>')
  await init(page)
  const added = await page.evaluate((manifest) => {
    const runtime = globalThis.__MASTER_CSS_RUNTIME_TEST__
    runtime.refresh(manifest)
    return { ruleCount: runtime.snapshot().classRules['new-custom'].rules.length, display: getComputedStyle(document.querySelector('#target')!).display }
  }, { ...preset, mixins: [...(preset.mixins || []), mixin('new-custom', { display: 'none' })] })
  expect(added).toEqual({ ruleCount: 1, display: 'none' })
  const removed = await page.evaluate((manifest) => {
    const runtime = globalThis.__MASTER_CSS_RUNTIME_TEST__
    runtime.refresh(manifest)
    return { ruleCount: runtime.snapshot().classRules['new-custom'].rules.length, display: getComputedStyle(document.querySelector('#target')!).display }
  }, preset)
  expect(removed).toEqual({ ruleCount: 0, display: 'block' })
})

for (const invalid of [false, true]) {
  test(`refresh preserves pending DOM additions when the manifest is ${invalid ? 'invalid' : 'valid'}`, async ({ page }) => {
    await init(page)
    const result = await page.evaluate(async (invalid) => {
      const runtime = globalThis.__MASTER_CSS_RUNTIME_TEST__
      document.body.className = "display:none"
      await Promise.resolve()
      let threw = false
      try {
        if (invalid) runtime.refresh({ version: 2 } as unknown as MasterCSSManifest)
        else runtime.refresh()
      } catch { threw = true }
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
      return { threw, usageCount: runtime.snapshot().usageCounts['display:none'], ruleCount: runtime.snapshot().classRules['display:none'].rules.length, display: getComputedStyle(document.body).display }
    }, invalid)
    expect(result).toEqual({ threw: invalid, usageCount: 1, ruleCount: 1, display: 'none' })
  })
}

for (const change of ['none', 'reverse', 'extra', 'duplicate', 'missing'] as const) {
  test(`hydration validates utility CSSOM positions: ${change}`, async ({ page }) => {
    using renderer = createServerRenderer({ manifest: preset })
    const rendered = renderer.renderHTML("<html><head></head><body><div id=\"target\" class=\"display:block display:none\"></div></body></html>", { hydrationManifest: 'inject' })
    const rules = rendered.hydrationManifest!.rules.map(rule => rule.text)
    const css = change === 'none' ? rendered.cssText
      : change === 'reverse' ? `@layer utilities{${[...rules].reverse().join('')}}`
        : change === 'extra' ? `@layer utilities{.foreign{color:red}${rules.join('')}}`
          : change === 'duplicate' ? rendered.cssText + rendered.cssText
            : `@layer utilities{${rules[0]}}`
    await startRendered(page, rendered.html.replace(rendered.cssText, css), preset)
    const result = await page.evaluate(() => {
      const runtime = globalThis.__MASTER_CSS_RUNTIME_TEST__
      const hydration = runtime.snapshot().hydration.state
      runtime.deleteClassRules(["display:block"])
      const css = [...(document.querySelector<HTMLStyleElement>('#master-css')!.sheet!.cssRules)].map(rule => rule.cssText).join('')
      return { hydration, css, snapshot: runtime.snapshot().cssText, display: getComputedStyle(document.querySelector('#target')!).display }
    })
    expect(result.hydration).toBe(change === 'none' ? 'progressive' : 'runtime')
    expect(result.css).toContain(".display\\:none")
    expect(result.css).not.toContain(".display\\:block")
    expect(result.css).not.toContain('.foreign')
    expect(result.snapshot).toContain(".display\\:none")
    expect(result.display).toBe('none')
  })
}

test('hydrates shared resource dependencies from actual server output without fallback', async ({ page }) => {
  const manifest: MasterCSSManifest = { theme: [{ type: 'rule', prelude: ':root,:host', children: [{ type: 'declaration', name: 'x', value: 'red' }, { type: 'declaration', name: 'y', value: 'blue' }, { type: 'declaration', name: 'a', value: 'linear-gradient(var(--x),var(--y))' }, { type: 'declaration', name: 'z', value: 'green' }] }],
    version: 3, languageVersion: 5,
    variables: { '': [
      { name: 'x', key: 'x', values: [{ path: [':root,:host'], value: 'red' }] },
      { name: 'y', key: 'y', values: [{ path: [':root,:host'], value: 'blue' }] },
      { name: 'a', key: 'a', values: [{ path: [':root,:host'], value: 'linear-gradient(var(--x),var(--y))' }], dependencies: ['x', 'y'] },
      { name: 'z', key: 'z', values: [{ path: [':root,:host'], value: 'green' }] }
    ] },
    mixins: [
      mixin('a', { 'background-image': 'var(--a)' }),
      mixin('b', { color: 'var(--x)', 'border-color': 'var(--z)' }),
      mixin('c', { color: 'var(--x)' })
    ]
  }
  using renderer = createServerRenderer({ manifest })
  const rendered = renderer.renderHTML('<html><head></head><body><div id="target" class="c a b"></div></body></html>', { hydrationManifest: 'inject' })
  await startRendered(page, rendered.html, manifest)
  const result = await page.evaluate(() => ({
    hydration: globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().hydration.state,
    css: globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().cssText,
    color: getComputedStyle(document.querySelector('#target')!).color
  }))
  expect(result).toEqual({ hydration: 'progressive', css: rendered.cssText, color: 'rgb(255, 0, 0)' })
})

test('reordered theme buckets cannot silently change the dark-mode cascade', async ({ page }) => {
  const manifest: MasterCSSManifest = {
    version: 3, languageVersion: 5,
    theme: ['light', 'dark'].map((name, index) => ({ type: 'rule', prelude: `.${name}`, children: [{ type: 'declaration', name: 'primary', value: index ? '#ffffff' : '#000000' }] })),
    variables: { '': [{ name: 'primary', key: 'primary', values: [{ path: ['.light'], value: '#000000' }, { path: ['.dark'], value: '#ffffff' }] }] },
    mixins: [mixin('theme-color', { color: 'var(--primary)' })]
  }
  using renderer = createServerRenderer({ manifest })
  const rendered = renderer.renderHTML('<html class="dark"><head></head><body><div id="target" class="theme-color"></div></body></html>', { hydrationManifest: 'inject' })
  const reversed = rendered.html.replace(
    '.light{--primary:#000000}.dark{--primary:#ffffff}',
    '.dark{--primary:#ffffff}.light{--primary:#000000}'
  )
  expect(reversed).not.toBe(rendered.html)
  await startRendered(page, reversed, manifest)
  expect(await page.evaluate(() => ({
    hydration: globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().hydration.state,
    color: getComputedStyle(document.querySelector('#target')!).color
  }))).toEqual({ hydration: 'runtime', color: 'rgb(255, 255, 255)' })
})

test('decimal media queries and quoted attribute values match in the browser', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 600 })
  await page.setContent("<div id=\"responsive\" class=\"display:none@media((width>=600.5px))\"></div><div id=\"literal\" data-state=\":first\"></div><div id=\"different\" data-state=\":first-child\"></div>")
  await page.evaluate(() => {
    for (const id of ['literal', 'different']) document.getElementById(id)!.className = 'display:none[data-state=":first"]'
  })
  await init(page)
  await expect(page.locator('#responsive')).toHaveCSS('display', 'none')
  await expect(page.locator('#literal')).toHaveCSS('display', 'none')
  await expect(page.locator('#different')).toHaveCSS('display', 'block')
  await page.setViewportSize({ width: 600, height: 600 })
  await expect(page.locator('#responsive')).toHaveCSS('display', 'block')
})

for (const change of ['none', 'reverse', 'extra', 'duplicate'] as const) {
  test(`hydration validates multiple CSSOM nodes per rule across all utility layers: ${change}`, async ({ page }) => {
    const manifest: MasterCSSManifest = {
      version: 3, languageVersion: 5,
      variants: ['base', 'defaults', 'components', 'utilities'].map(layer => ({ token: `@${layer}` as const, branches: [{ layer: layer as 'base' | 'defaults' | 'components' | 'utilities' }] })),
      mixins: ['base', 'defaults', 'components', 'utilities'].map(layer => ({
        name: `--${layer}`,
        body: [...mixin(layer, { color: 'red' }).body,
          { type: 'rule' as const, selector: '&[data-active]', body: mixin(layer, { display: 'none' }).body }]
      }))
    }
    using renderer = createServerRenderer({ manifest })
    const rendered = renderer.renderHTML('<html><head></head><body><div id="target" data-active class="base@base defaults@defaults components@components utilities@utilities"></div></body></html>', { hydrationManifest: 'inject' })
    expect(rendered.hydrationManifest!.rules.every(rule => rule.nodes.length === 2)).toBe(true)
    await page.setContent(rendered.html)
    await page.evaluate((change) => {
      const sheet = document.querySelector<HTMLStyleElement>('#master-css')!.sheet!
      for (const layer of [...sheet.cssRules] as CSSLayerBlockRule[]) {
        if (change === 'reverse') {
          const text = layer.cssRules[0].cssText
          layer.deleteRule(0)
          layer.insertRule(text, layer.cssRules.length)
        } else if (change === 'extra') layer.insertRule('.foreign { color: blue }', 0)
      }
      if (change === 'duplicate') sheet.insertRule(sheet.cssRules[0].cssText, sheet.cssRules.length)
    }, change)
    await page.evaluate(async ({ loader, manifest }) => {
      const { startCSSRuntime } = await import(loader)
      await startCSSRuntime({ manifest })
    }, { loader: await getRuntimeLoaderURL(), manifest })
    expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().hydration.state)).toBe(change === 'none' ? 'progressive' : 'runtime')
    await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.deleteClassRules(['base@base', 'defaults@defaults', 'components@components']))
    await expect(page.locator('#target')).toHaveCSS('display', 'none')
  })
}

test('hydration rejects CSSOM nodes dropped by the browser', async ({ page }) => {
  const manifest: MasterCSSManifest = {
    ...preset,
    mixins: [...(preset.mixins || []), {
      ...mixin('dropped', { display: 'block' }),
      body: [{ type: 'rule', selector: '&:mastercss-unknown-pseudo', body: mixin('dropped', { display: 'block' }).body }]
    }]
  }
  using renderer = createServerRenderer({ manifest })
  const rendered = renderer.renderHTML("<html><head></head><body><div id=\"target\" class=\"dropped display:none\"></div></body></html>", { hydrationManifest: 'inject' })
  expect(rendered.hydrationManifest!.rules).toHaveLength(2)
  await startRendered(page, rendered.html, manifest)
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().hydration.state)).toBe('runtime')
  await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.deleteClassRules(['dropped']))
  await expect(page.locator('#target')).toHaveCSS('display', 'none')
})
