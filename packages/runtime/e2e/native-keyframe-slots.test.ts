import { test, expect, type Page } from '@playwright/test'
import { compileRenderedStylesheet } from '@master/css-compiler/stylesheet'
import { getRuntimeLoaderURL } from './init'

const baseManifest = { version: 6 as const, languageVersion: 16 as const }
const source = '@prune native;@layer before;@layer{@keyframes probe{to{opacity:.2}}@media(width>600px){@keyframes probe{to{opacity:.4}}}}@supports(display:grid){@keyframes probe{to{opacity:.6}}}@keyframes probe{to{opacity:.8}}'

async function setup(page: Page, css = source) {
  const result = await compileRenderedStylesheet('/slots.css', css, { baseManifest, classes: [] })
  await page.setContent('<style id="owned"></style><div id="probe"></div>')
  await page.locator('#owned').evaluate((style, text) => { style.textContent = text }, result.nativeCSS)
  await page.evaluate(async ({ loader, manifest, emittedGlobals }) => {
    const { startCSSRuntime } = await import(loader)
    await startCSSRuntime({ manifest, emittedGlobals })
  }, { loader: await getRuntimeLoaderURL(), manifest: result.manifest, emittedGlobals: result.emittedGlobals })
  return result
}

async function frames(page: Page) {
  return page.evaluate(() => {
    const names: string[] = []
    const visit = (rules: CSSRuleList) => {
      for (const rule of rules) {
        if (rule.constructor.name === 'CSSKeyframesRule') names.push((rule as CSSKeyframesRule).name)
        else if ('cssRules' in rule) visit((rule as CSSGroupingRule).cssRules)
      }
    }
    for (const sheet of document.styleSheets) visit(sheet.cssRules)
    return names
  })
}

test('dynamic resources occupy original native slots and release without replacing anonymous layers', async ({ page }) => {
  await setup(page)
  expect(await frames(page)).toEqual([])
  await page.evaluate(() => {
    const owned = document.querySelector<HTMLStyleElement>('#owned')!.sheet!
    ;(globalThis as any).originalLayer = [...owned.cssRules].find(rule => rule.constructor.name === 'CSSLayerBlockRule')
    globalThis.masterCSSRuntime.ensureClassRules(['animation-name:probe', 'animation:probe|1s'])
  })
  expect(await frames(page)).toEqual(['probe', 'probe', 'probe', 'probe'])
  await page.evaluate(() => globalThis.masterCSSRuntime.deleteClassRules(['animation-name:probe']))
  expect(await frames(page)).toHaveLength(4)
  await page.evaluate(() => globalThis.masterCSSRuntime.deleteClassRules(['animation:probe|1s']))
  expect(await frames(page)).toEqual([])
  expect(await page.evaluate(() => [...document.querySelector<HTMLStyleElement>('#owned')!.sheet!.cssRules].includes((globalThis as any).originalLayer))).toBe(true)
  expect(await page.locator('#master-css').textContent()).not.toContain('@keyframes')
})

for (const width of [390, 1280]) {
  test(`native and compiled same-name competition agree at width ${width}`, async ({ page }) => {
    const conditionalSource = source + '@media(width>600px){@keyframes probe{to{opacity:.9}}}'
    await page.setViewportSize({ width, height: 800 })
    await setup(page, conditionalSource)
    await page.evaluate(() => globalThis.masterCSSRuntime.ensureClassRules(['animation:probe|1s|linear|both']))
    await page.locator('#probe').evaluate(element => { element.className = 'animation:probe|1s|linear|both' })
    const compiled = await page.locator('#probe').evaluate(element => {
      const animation = element.getAnimations()[0]
      animation.pause(); animation.currentTime = 1000
      return getComputedStyle(element).opacity
    })
    await page.locator('#owned').evaluate((style, css) => { style.textContent = css }, conditionalSource.replace('@prune native;', ''))
    const native = await page.locator('#probe').evaluate(element => {
      const animation = element.getAnimations()[0]
      animation.pause(); animation.currentTime = 1000
      return getComputedStyle(element).opacity
    })
    expect(compiled).toBe(native)
    expect(compiled).toBe(width > 600 ? '0.9' : '0.8')
  })
}

test('safelist and preserve roots survive the last DOM consumer', async ({ page }) => {
  await setup(page, '@prune native;@safelist keyframes "probe";@keyframes probe{to{opacity:.5}}')
  expect(await frames(page)).toEqual(['probe'])
  await page.evaluate(() => {
    globalThis.masterCSSRuntime.ensureClassRules(['animation-name:probe'])
    globalThis.masterCSSRuntime.deleteClassRules(['animation-name:probe'])
  })
  expect(await frames(page)).toEqual(['probe'])
})

test('the last DOM consumer releases animation resources independently of the warm utility cache', async ({ page }) => {
  await setup(page)
  await page.locator('#probe').evaluate(element => { element.className = 'animation-name:probe' })
  await expect.poll(() => frames(page)).toHaveLength(4)
  await page.locator('#probe').evaluate(element => { element.className = '' })
  await expect.poll(() => frames(page)).toEqual([])
  expect(await page.evaluate(() => globalThis.masterCSSRuntime.snapshot().classRules['animation-name:probe']?.retained)).not.toBe(true)
  await page.locator('#probe').evaluate(element => { element.className = 'animation-name:probe' })
  await expect.poll(() => frames(page)).toHaveLength(4)
})

test('HMR atomically replaces native owners, conditions, names and retention policies', async ({ page }) => {
  await setup(page)
  await page.evaluate(() => globalThis.masterCSSRuntime.ensureClassRules(['animation-name:probe']))
  const next = await compileRenderedStylesheet('/slots.css', '@preserve native;@media(width>600px){@keyframes replacement{to{opacity:.25}}}', { baseManifest, classes: [] })
  await page.evaluate(({ css, manifest, emittedGlobals }) => {
    document.querySelector<HTMLStyleElement>('#owned')!.textContent = css
    globalThis.masterCSSRuntime.refresh(manifest, emittedGlobals)
  }, { css: next.nativeCSS, manifest: next.manifest, emittedGlobals: next.emittedGlobals })
  expect(await frames(page)).toEqual(['replacement'])
  const empty = await compileRenderedStylesheet('/slots.css', '', { baseManifest, classes: [] })
  await page.evaluate(({ manifest, emittedGlobals }) => {
    document.querySelector<HTMLStyleElement>('#owned')!.textContent = ''
    globalThis.masterCSSRuntime.refresh(manifest, emittedGlobals)
  }, empty)
  expect(await frames(page)).toEqual([])
})

test('late stylesheet attachment and same-content HMR restore only active resources', async ({ page }) => {
  const result = await setup(page)
  await page.locator('#owned').evaluate(style => { style.remove() })
  await page.evaluate(() => globalThis.masterCSSRuntime.ensureClassRules(['animation-name:probe']))
  expect(await frames(page)).toEqual([])
  await page.evaluate(css => {
    const style = document.createElement('style')
    style.id = 'owned'
    style.textContent = css
    document.head.prepend(style)
  }, result.nativeCSS)
  await expect.poll(() => frames(page)).toHaveLength(4)
  await page.locator('#owned').evaluate((style, css) => { style.textContent = css }, result.nativeCSS)
  await expect.poll(() => frames(page)).toHaveLength(4)
  await page.evaluate(() => globalThis.masterCSSRuntime.deleteClassRules(['animation-name:probe']))
  expect(await frames(page)).toEqual([])
})

test('SSR hydration adopts native positions and releases the same definitions', async ({ page }) => {
  const { renderHTML } = await import('@master/css-server')
  const compiled = await compileRenderedStylesheet('/ssr-slots.css', source, { baseManifest, classes: [] })
  const rendered = renderHTML(`<html><head><style id="owned">${compiled.nativeCSS}</style></head><body><div id="probe" class="animation:probe|1ms|both"></div></body></html>`, {
    manifest: compiled.manifest, emittedGlobals: compiled.emittedGlobals, hydrationManifest: 'inject'
  })
  await page.setContent(rendered.html)
  expect(await frames(page)).toHaveLength(4)
  await page.evaluate(() => {
    const sheet = document.querySelector<HTMLStyleElement>('#owned')!.sheet!
    ;(globalThis as any).ssrLayer = [...sheet.cssRules].find(rule => rule.constructor.name === 'CSSLayerBlockRule')
  })
  await page.evaluate(async ({ loader, manifest, emittedGlobals }) => {
    const { startCSSRuntime } = await import(loader)
    await startCSSRuntime({ manifest, emittedGlobals })
  }, { loader: await getRuntimeLoaderURL(), manifest: compiled.manifest, emittedGlobals: compiled.emittedGlobals })
  expect(await frames(page)).toHaveLength(4)
  expect(await page.evaluate(() => [...document.querySelector<HTMLStyleElement>('#owned')!.sheet!.cssRules].includes((globalThis as any).ssrLayer))).toBe(true)
  await page.locator('#probe').evaluate(element => { element.className = '' })
  await expect.poll(() => frames(page)).toEqual([])
})

test('Shadow DOM uses explicitly bound constructable sheets and preserves native containers', async ({ page }) => {
  const compiled = await compileRenderedStylesheet('/shadow.css', '@prune native;@layer{@keyframes probe{to{opacity:.25}}}', { baseManifest, classes: [] })
  await page.setContent('<div id="host"></div>')
  await page.evaluate(async ({ loader, manifest, emittedGlobals, nativeCSS }) => {
    const { startCSSRuntime } = await import(loader)
    const root = document.querySelector('#host')!.attachShadow({ mode: 'open' })
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(nativeCSS)
    root.adoptedStyleSheets = [sheet]
    root.innerHTML = '<div id="probe" class="animation:probe|1ms|both"></div>'
    await startCSSRuntime({ root, manifest, emittedGlobals, stylesheets: () => [{ sheet, ownerIds: manifest.keyframes!.map(frame => frame.ownerId!) }] })
  }, { loader: await getRuntimeLoaderURL(), ...compiled })
  await expect.poll(() => page.locator('#host #probe').evaluate(element => getComputedStyle(element).opacity)).toBe('0.25')
  await page.locator('#host #probe').evaluate(element => { element.className = '' })
  await expect.poll(() => page.evaluate(() => {
    const sheet = document.querySelector('#host')!.shadowRoot!.adoptedStyleSheets[0]
    return ((sheet.cssRules[0] as CSSGroupingRule).cssRules[0] as CSSGroupingRule).cssRules.length
  })).toBe(1)
})
