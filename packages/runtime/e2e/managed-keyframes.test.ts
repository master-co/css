import { test, expect } from '@playwright/test'
import { renderClassNamesSync } from '@master/css/node'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import init, { createRuntimeProjectManifest, getRuntimeLoaderURL } from './init'

const keyframes = [
  { id: 'first', name: 'first', text: '@keyframes first{to{opacity:.5}}' },
  { id: 'second', name: 'second', text: '@keyframes second{to{opacity:1}}' }
]
const manifest = createRuntimeProjectManifest({ keyframes })

async function names(page: import('@playwright/test').Page) {
  return page.evaluate(() => [...(document.querySelector<HTMLStyleElement>('#master-css')?.sheet?.cssRules || [])]
    .filter((rule): rule is CSSKeyframesRule => rule.constructor.name === 'CSSKeyframesRule').map(rule => rule.name))
}

test('retains keyframes in definition order and releases the last root', async ({ page }) => {
  await init(page, undefined, { keyframes })
  expect(await names(page)).toEqual([])
  await page.evaluate(() => globalThis.masterCSSRuntime.ensureClassRules(['animation-name:second', 'animation:second|1s', 'animation-name:first']))
  expect(await names(page)).toEqual(['first', 'second'])
  await page.evaluate(() => globalThis.masterCSSRuntime.deleteClassRules(['animation-name:second']))
  expect(await names(page)).toEqual(['first', 'second'])
  await page.evaluate(() => globalThis.masterCSSRuntime.deleteClassRules(['animation:second|1s', 'animation-name:first']))
  expect(await names(page)).toEqual([])
})

test('dynamic roots keep all and HMR replaces external ownership', async ({ page }) => {
  await init(page, undefined, { keyframes })
  await page.evaluate(() => globalThis.masterCSSRuntime.ensureClassRules(['animation-name:var(--external)']))
  expect(await names(page)).toEqual(['first', 'second'])
  await page.evaluate(manifest => globalThis.masterCSSRuntime.refresh(manifest, { keyframes: { first: 1 } }), manifest)
  expect(await names(page)).toEqual(['second'])
  await page.evaluate(manifest => globalThis.masterCSSRuntime.refresh(manifest, {}), manifest)
  expect(await names(page)).toEqual(['first', 'second'])
  await page.evaluate(() => globalThis.masterCSSRuntime.deleteClassRules(['animation-name:var(--external)']))
  expect(await names(page)).toEqual([])
})

test('hydrates top-level keyframes and updates their body', async ({ page }) => {
  const rendered = renderClassNamesSync(['animation-name:first'], { manifest })
  await page.setContent('<div class="animation-name:first"></div>')
  await init(page, rendered.cssText, { keyframes }, rendered.hydrationManifest)
  expect(await names(page)).toEqual(['first'])
  expect(await page.evaluate(() => globalThis.masterCSSRuntime.snapshot().hydration.failureReason)).toBeUndefined()
  await page.evaluate(manifest => globalThis.masterCSSRuntime.refresh(manifest), {
    ...manifest, keyframes: [{ id: 'first', name: 'first', text: '@keyframes first{to{opacity:.25}}' }]
  })
  expect(await page.evaluate(() => document.querySelector<HTMLStyleElement>('#master-css')!.sheet!.cssRules.item(1)!.cssText)).toContain('0.25')
})

test('rejected keyframe insertions never delete neighboring rules', async ({ page }) => {
  const invalid = { id: 'invalid', name: 'invalid', text: '@keyframes invalid{' }
  await init(page, undefined, { keyframes: [invalid, ...keyframes] })
  await page.evaluate(() => {
    const original = CSSStyleSheet.prototype.insertRule
    CSSStyleSheet.prototype.insertRule = function (text, index) {
      if (text.startsWith('@keyframes invalid')) throw new DOMException('Unsupported rule', 'SyntaxError')
      return original.call(this, text, index)
    }
    globalThis.masterCSSRuntime.ensureClassRules(['animation-name:invalid', 'animation-name:first', 'display:block'])
    globalThis.masterCSSRuntime.deleteClassRules(['animation-name:invalid'])
  })
  expect(await names(page)).toEqual(['first'])
  expect(await page.evaluate(() => document.querySelector<HTMLStyleElement>('#master-css')!.sheet!.cssRules.item(0)!.cssText)).toContain('display: block')
})

test('ShadowRoot tracks keyframes independently from Document', async ({ page }) => {
  await init(page, undefined, { keyframes })
  await page.evaluate(async ({ manifest, loader }) => {
    await import(loader)
    const host = document.createElement('section')
    document.body.append(host)
    const root = host.attachShadow({ mode: 'open' })
    root.innerHTML = '<div class="animation-name:first"></div>'
    const runtime = await globalThis.MasterCSSRuntime.start({ root, manifest })
    runtime.observe()
  }, { manifest: manifest as MasterCSSManifest, loader: await getRuntimeLoaderURL() })
  await expect.poll(() => page.evaluate(() => [...document.querySelector('section')!.shadowRoot!.querySelector<HTMLStyleElement>('#master-css')!.sheet!.cssRules]
    .filter(rule => rule.constructor.name === 'CSSKeyframesRule').length)).toBe(1)
  expect(await names(page)).toEqual([])
})

for (const width of [390, 1280]) {
  test(`pill radius preserves independent dimensions at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await page.setContent('<div class="width:96px height:48px r-pill"></div><img class="width:48px aspect-ratio:1/1 r-pill">')
    await init(page)
    await expect.poll(() => page.locator('div').evaluate(element => getComputedStyle(element).borderTopLeftRadius)).not.toBe('0px')
    expect(await page.locator('div').evaluate(element => [element.getBoundingClientRect().width, element.getBoundingClientRect().height])).toEqual([96, 48])
    expect(await page.locator('img').evaluate(element => [element.getBoundingClientRect().width, element.getBoundingClientRect().height])).toEqual([48, 48])
  })
}
