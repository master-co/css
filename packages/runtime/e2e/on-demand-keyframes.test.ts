import { test, expect, type Page } from '@playwright/test'
import { compileRenderedStylesheet } from '@master/css-compiler/stylesheet'
import { compileProgram, getRuntimeLoaderURL } from './init'

const baseManifest = { version: 6 as const, languageVersion: 18 as const }
const definitions = '@layer before;@layer motion{@keyframes probe{to{opacity:.2}}@media(width>600px){@keyframes probe{to{opacity:.4}}}}@supports(display:grid){@keyframes probe{to{opacity:.6}}}@keyframes probe{to{opacity:.8}}'
const source = '@prune native;' + definitions

/** Delivers a stylesheet as a build does, then starts the runtime with its emitted globals. */
async function setup(page: Page, css = source) {
  const result = await compileRenderedStylesheet('/motion.css', css, { baseManifest, classes: [] })
  await page.setContent('<style id="native"></style><div id="probe"></div>')
  await page.locator('#native').evaluate((style, text) => { style.textContent = text }, result.css)
  await page.evaluate(async ({ loader, manifest, emittedGlobals }) => {
    const { startCSSRuntime } = await import(loader)
    await startCSSRuntime({ manifest, emittedGlobals })
  }, { loader: await getRuntimeLoaderURL(), manifest: result.manifest, emittedGlobals: result.emittedGlobals })
  return result
}

/** The keyframes names of a stylesheet, or of every stylesheet in the document. */
async function frames(page: Page, selector?: string) {
  return page.evaluate((selector) => {
    const names: string[] = []
    const visit = (rules: CSSRuleList) => {
      for (const rule of rules) {
        if (rule.constructor.name === 'CSSKeyframesRule') names.push((rule as CSSKeyframesRule).name)
        else if ('cssRules' in rule) visit((rule as CSSGroupingRule).cssRules)
      }
    }
    const sheets = selector ? [document.querySelector<HTMLStyleElement>(selector)!.sheet!] : [...document.styleSheets]
    for (const sheet of sheets) visit(sheet.cssRules)
    return names
  }, selector)
}

test('on-demand definitions join the runtime stylesheet in their containers and leave with the last use', async ({ page }) => {
  const result = await setup(page)
  expect(result.nativeCSS).not.toContain('@keyframes')
  expect(await frames(page)).toEqual([])
  await page.evaluate(() => globalThis.masterCSSRuntime.ensureClassRules(['(animation-name:probe)', '(animation:probe|1s)']))
  expect(await frames(page, '#master-css')).toEqual(['probe', 'probe', 'probe', 'probe'])
  expect(await page.locator('#master-css').evaluate(style => [...(style as HTMLStyleElement).sheet!.cssRules].map(rule => rule.cssText).join('')))
    .toMatch(/@layer motion \{\s*@keyframes probe[^]*@media \(width > 600px\)/)
  await page.evaluate(() => globalThis.masterCSSRuntime.deleteClassRules(['(animation-name:probe)']))
  expect(await frames(page)).toHaveLength(4)
  await page.evaluate(() => globalThis.masterCSSRuntime.deleteClassRules(['(animation:probe|1s)']))
  expect(await frames(page)).toEqual([])
})

for (const width of [390, 1280]) {
  test(`same-name definitions resolve as they would natively at width ${width}`, async ({ page }) => {
    const conditional = definitions + '@media(width>600px){@keyframes probe{to{opacity:.9}}}'
    const opacity = () => page.locator('#probe').evaluate(element => {
      const animation = element.getAnimations()[0]
      animation.pause(); animation.currentTime = 1000
      return getComputedStyle(element).opacity
    })
    await page.setViewportSize({ width, height: 800 })
    await setup(page, '@prune native;' + conditional)
    await page.locator('#probe').evaluate(element => { element.className = '(animation:probe|1s|linear|both)' })
    await expect.poll(() => frames(page)).toHaveLength(5)
    const onDemand = await opacity()
    await page.setContent(`<style>${conditional}</style><div id="probe" style="animation:probe 1s linear both"></div>`)
    expect(onDemand).toBe(await opacity())
    expect(onDemand).toBe(width > 600 ? '0.9' : '0.8')
  })
}

test('safelisted definitions are delivered with the stylesheet and survive the last DOM consumer', async ({ page }) => {
  const result = await setup(page, '@prune native;@safelist keyframes "probe";@keyframes probe{to{opacity:.5}}')
  expect(result.nativeCSS).not.toContain('@keyframes')
  expect(await frames(page)).toEqual(['probe'])
  await page.evaluate(() => {
    globalThis.masterCSSRuntime.ensureClassRules(['(animation-name:probe)'])
    globalThis.masterCSSRuntime.deleteClassRules(['(animation-name:probe)'])
  })
  expect(await frames(page)).toEqual(['probe'])
})

test('native keyframes stay in their stylesheet and are never emitted again', async ({ page }) => {
  await setup(page, '@keyframes probe{to{opacity:.5}}')
  expect(await frames(page, '#native')).toEqual(['probe'])
  await page.locator('#probe').evaluate(element => { element.className = '(animation:probe|1s)' })
  await expect.poll(() => page.evaluate(() => globalThis.masterCSSRuntime.snapshot().cssText)).toContain('animation:probe 1s')
  expect(await frames(page)).toEqual(['probe'])
})

test('the last DOM consumer releases animation resources independently of the warm utility cache', async ({ page }) => {
  await setup(page)
  await page.locator('#probe').evaluate(element => { element.className = '(animation-name:probe)' })
  await expect.poll(() => frames(page)).toHaveLength(4)
  await page.locator('#probe').evaluate(element => { element.className = '' })
  await expect.poll(() => frames(page)).toEqual([])
  expect(await page.evaluate(() => globalThis.masterCSSRuntime.snapshot().classRules['(animation-name:probe)']?.retained)).not.toBe(true)
  await page.locator('#probe').evaluate(element => { element.className = '(animation-name:probe)' })
  await expect.poll(() => frames(page)).toHaveLength(4)
})

test('HMR atomically replaces definitions, conditions, names and retention policies', async ({ page }) => {
  await setup(page)
  await page.evaluate(() => globalThis.masterCSSRuntime.ensureClassRules(['(animation-name:probe)', '(animation-name:replacement)']))
  const next = await compileRenderedStylesheet('/motion.css', '@prune native;@media(width>600px){@keyframes replacement{to{opacity:.25}}}', { baseManifest, classes: [] })
  await page.evaluate(({ css, program, emittedGlobals }) => {
    document.querySelector<HTMLStyleElement>('#native')!.textContent = css
    globalThis.masterCSSRuntime.refresh(program, emittedGlobals)
  }, { css: next.nativeCSS, program: compileProgram(next.manifest), emittedGlobals: next.emittedGlobals })
  expect(await frames(page, '#master-css')).toEqual(['replacement'])
  const empty = await compileRenderedStylesheet('/motion.css', '', { baseManifest, classes: [] })
  await page.evaluate(({ program, emittedGlobals }) => {
    document.querySelector<HTMLStyleElement>('#native')!.textContent = ''
    globalThis.masterCSSRuntime.refresh(program, emittedGlobals)
  }, { program: compileProgram(empty.manifest), emittedGlobals: empty.emittedGlobals })
  expect(await frames(page)).toEqual([])
})

test('SSR hydration adopts the pre-rendered definitions and releases them', async ({ page }) => {
  const { renderHTML } = await import('@master/css-server')
  const compiled = await compileRenderedStylesheet('/ssr-motion.css', source, { baseManifest, classes: [] })
  const rendered = renderHTML(`<html><head><style id="native">${compiled.nativeCSS}</style></head><body><div id="probe" class="(animation:probe|1ms|both)"></div></body></html>`, {
    manifest: compiled.manifest, emittedGlobals: compiled.emittedGlobals, hydrationManifest: 'inject'
  })
  expect(rendered.cssText).toContain('@layer motion{@keyframes probe')
  await page.setContent(rendered.html)
  expect(await frames(page, '#master-css')).toHaveLength(4)
  await page.evaluate(() => {
    ;(globalThis as any).ssrFrame = [...document.querySelector<HTMLStyleElement>('#master-css')!.sheet!.cssRules]
      .find(rule => rule.constructor.name === 'CSSLayerBlockRule' && (rule as CSSLayerBlockRule).name === 'motion')
  })
  await page.evaluate(async ({ loader, manifest, emittedGlobals }) => {
    const { startCSSRuntime } = await import(loader)
    await startCSSRuntime({ manifest, emittedGlobals })
  }, { loader: await getRuntimeLoaderURL(), manifest: compiled.manifest, emittedGlobals: compiled.emittedGlobals })
  expect(await page.evaluate(() => globalThis.masterCSSRuntime.snapshot().hydration.state)).toBe('progressive')
  expect(await frames(page)).toHaveLength(4)
  expect(await page.evaluate(() => [...document.querySelector<HTMLStyleElement>('#master-css')!.sheet!.cssRules].includes((globalThis as any).ssrFrame))).toBe(true)
  await page.locator('#probe').evaluate(element => { element.className = '' })
  await expect.poll(() => frames(page)).toEqual([])
})

test('Shadow DOM roots receive on-demand definitions in their own runtime stylesheet', async ({ page }) => {
  const compiled = await compileRenderedStylesheet('/shadow.css', '@prune native;@layer motion{@keyframes probe{to{opacity:.25}}}', { baseManifest, classes: [] })
  await page.setContent('<div id="host"></div>')
  await page.evaluate(async ({ loader, manifest, emittedGlobals }) => {
    const { startCSSRuntime } = await import(loader)
    const root = document.querySelector('#host')!.attachShadow({ mode: 'open' })
    root.innerHTML = '<div id="probe" class="(animation:probe|1ms|both)"></div>'
    await startCSSRuntime({ root, manifest, emittedGlobals })
  }, { loader: await getRuntimeLoaderURL(), ...compiled })
  await expect.poll(() => page.locator('#host #probe').evaluate(element => getComputedStyle(element).opacity)).toBe('0.25')
  await page.locator('#host #probe').evaluate(element => { element.className = '' })
  await expect.poll(() => page.evaluate(() => document.querySelector('#host')!.shadowRoot!.querySelector('#master-css')!.textContent + [...(document.querySelector('#host')!.shadowRoot!.querySelector<HTMLStyleElement>('#master-css')!.sheet!.cssRules)].map(rule => rule.cssText).join(''))).not.toContain('@keyframes')
})
