import { test, expect } from '@playwright/test'
import { compileRenderedStylesheet, createRuntimeStylesheetAsset } from '@master/css-compiler/stylesheet'
import { createCompilerSync } from '@master/css-compiler/node'
import { getRuntimeLoaderURL } from './init'

test('compiler-owned cross-origin CSS stays writable at its original position with qualified imports and resource URLs', async ({ page }) => {
  const result = await compileRenderedStylesheet('/owned.css', '@prune native;@layer{@keyframes probe{to{opacity:.25;background-image:url("./animated.svg")}}}', {
    baseManifest: { version: 6, languageVersion: 16 }, classes: []
  })
  const assets = new Map([
    ['/entry.css', '@import "./child.css" layer;#probe{background-image:url("./pixel.svg")}'],
    ['/child.css', result.nativeCSS]
  ])
  using compiler = createCompilerSync()
  const descriptors = new Map([...assets].map(([href, css]) => [href + '.master-css.json', createRuntimeStylesheetAsset(compiler, css, href, [...assets.keys()])]))
  await page.route('https://owned.example/**', async route => {
    const path = new URL(route.request().url()).pathname
    const descriptor = descriptors.get(path)
    await route.fulfill({
      status: 200, headers: { 'access-control-allow-origin': '*' },
      contentType: descriptor ? 'application/json' : path.endsWith('.svg') ? 'image/svg+xml' : 'text/css',
      body: descriptor ? JSON.stringify(descriptor) : assets.get(path) ?? '<svg xmlns="http://www.w3.org/2000/svg"/>'
    })
  })
  await page.setContent('<link rel="stylesheet" href="https://owned.example/entry.css"><style id="after">@layer after;</style><div id="probe"></div>')
  await page.evaluate(() => {
    const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL)
    const tracked = (globalThis as any).ownedBlobURLs = { created: [] as string[], revoked: [] as string[] }
    URL.createObjectURL = value => { const url = create(value); tracked.created.push(url); return url }
    URL.revokeObjectURL = url => { tracked.revoked.push(url); revoke(url) }
  })
  expect(await page.evaluate(() => {
    try { return [...document.querySelector('link')!.sheet!.cssRules].length >= 0 } catch { return false }
  })).toBe(false)
  await page.evaluate(async ({ loader, manifest, emittedGlobals }) => {
    const { startCSSRuntime } = await import(loader)
    await startCSSRuntime({ manifest, emittedGlobals, stylesheetDelivery: { base: 'https://owned.example/' } })
  }, { loader: await getRuntimeLoaderURL(), manifest: result.manifest, emittedGlobals: result.emittedGlobals })
  await page.locator('#probe').evaluate(element => { element.className = 'animation:probe|1ms|both' })
  await expect.poll(() => page.locator('#probe').evaluate(element => getComputedStyle(element).opacity)).toBe('0.25')
  expect(await page.locator('#probe').evaluate(element => getComputedStyle(element).backgroundImage)).toContain('https://owned.example/animated.svg')
  expect(await page.evaluate(() => document.querySelector('style[data-master-css-stylesheet]')!.nextElementSibling?.localName)).toBe('link')
  expect(await page.locator('link').evaluate(link => (link as HTMLLinkElement).disabled)).toBe(true)
  await page.locator('#probe').evaluate(element => { element.className = '' })
  await expect.poll(() => page.evaluate(() => {
    const style = document.querySelector<HTMLStyleElement>('style[data-master-css-stylesheet]')!
    const imported = style.sheet!.cssRules[0] as CSSImportRule
    const count = (rules: CSSRuleList): number => [...rules].reduce((n, rule) => n + (rule.constructor.name === 'CSSKeyframesRule' ? 1 : 'cssRules' in rule ? count((rule as CSSGroupingRule).cssRules) : 0), 0)
    return count(imported.styleSheet!.cssRules)
  })).toBe(0)
  await page.evaluate(() => globalThis.masterCSSRuntime.dispose())
  expect(await page.locator('style[data-master-css-stylesheet]').count()).toBe(0)
  expect(await page.locator('link').evaluate(link => (link as HTMLLinkElement).disabled)).toBe(false)
  expect(await page.evaluate(() => (globalThis as any).ownedBlobURLs.revoked)).toEqual(await page.evaluate(() => (globalThis as any).ownedBlobURLs.created))
})

test('SSR materializes qualified imports before startup and hydration adopts the same native layer', async ({ page }) => {
  const { renderHTML } = await import('@master/css-server')
  const result = await compileRenderedStylesheet('/ssr-owned.css', '@prune native;@layer{@keyframes probe{to{opacity:.2;background-image:url("./image.svg")}}}', {
    baseManifest: { version: 6, languageVersion: 16 }, classes: []
  })
  const assets = new Map([
    ['https://owned.example/root.css', '@import "./child.css" layer;'],
    ['https://owned.example/child.css', result.nativeCSS]
  ])
  using compiler = createCompilerSync()
  const stylesheets = [...assets].map(([href, css]) => ({ href, asset: createRuntimeStylesheetAsset(compiler, css, href, [...assets.keys()]) }))
  const loader = await getRuntimeLoaderURL()
  const published = new Map<string, string>()
  const rendered = renderHTML('<html><head><link rel="stylesheet" href="https://owned.example/root.css"></head><body><div id="probe" class="animation:probe|1ms|both"></div></body></html>', {
    manifest: result.manifest, emittedGlobals: result.emittedGlobals, stylesheets, hydrationManifest: 'inject',
    stylesheetImportSource(css) { const url = new URL(`/ssr-owned/${published.size}.css`, loader).href; published.set(url, css); return url }
  })
  const requested: string[] = []
  await page.route('https://owned.example/**', async route => {
    requested.push(route.request().url())
    await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg"/>' })
  })
  await page.route('**/ssr-owned/*.css', route => route.fulfill({ contentType: 'text/css', body: published.get(route.request().url())! }))
  const documentURL = new URL('/ssr-owned-document.html', loader).href
  await page.route(documentURL, route => route.fulfill({ contentType: 'text/html', body: '<html><head></head><body></body></html>' }))
  await page.goto(documentURL)
  await page.setContent(rendered.html)
  await expect.poll(() => page.locator('#probe').evaluate(element => getComputedStyle(element).opacity)).toBe('0.2')
  expect(await page.locator('#probe').evaluate(element => getComputedStyle(element).backgroundImage)).toContain('https://owned.example/image.svg')
  await page.evaluate(() => {
    const sheet = document.querySelector<HTMLStyleElement>('style[data-master-css-stylesheet]')!.sheet!
    ;(globalThis as any).ssrOwnedLayer = (sheet.cssRules[0] as CSSImportRule).styleSheet!.cssRules[0]
  })
  await page.evaluate(async ({ loader, manifest, emittedGlobals }) => {
    const { startCSSRuntime } = await import(loader)
    await startCSSRuntime({ manifest, emittedGlobals, stylesheetDelivery: { base: 'https://owned.example/' } })
  }, { loader: await getRuntimeLoaderURL(), manifest: result.manifest, emittedGlobals: result.emittedGlobals })
  expect(await page.locator('style[data-master-css-stylesheet]').count()).toBe(1)
  expect(await page.evaluate(() => {
    const sheet = document.querySelector<HTMLStyleElement>('style[data-master-css-stylesheet]')!.sheet!
    return (sheet.cssRules[0] as CSSImportRule).styleSheet!.cssRules[0] === (globalThis as any).ssrOwnedLayer
  })).toBe(true)
  expect(requested.some(url => url.endsWith('.master-css.json'))).toBe(false)
  await page.locator('#probe').evaluate(element => { element.className = '' })
  await expect.poll(() => page.evaluate(() => ((globalThis as any).ssrOwnedLayer.cssRules[0] as CSSMediaRule).cssRules.length)).toBe(1)
})
