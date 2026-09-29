import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import init from './init'

const nativePreset = readFileSync(new URL('../../preset/src/default-native.css', import.meta.url), 'utf8')

test('animation utilities emit only their managed keyframes', async ({ page }) => {
  await page.setContent('<div class="animate-fade animation:zoom|1s"></div>')
  await init(page)
  const text = await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.text)
  expect(text).toContain('--animate-fade:fade 1s infinite')
  expect(text).toContain('.animate-fade{animation:var(--animate-fade)}')
  expect(text).toContain('animation:zoom 1s')
  expect(text).toContain('@keyframes fade')
  expect(text).toContain('@keyframes zoom')
  expect(text).not.toContain('@keyframes rotate')
})

test('the native preset delivers no managed animations and runtime releases unused ones', async ({ page }) => {
  await page.setContent(`<style id="native-preset">${nativePreset}</style><div class="animate-fade"></div>`)
  await init(page)
  const names = () => page.evaluate(() => [...document.querySelector<HTMLStyleElement>('#native-preset')!.sheet!.cssRules]
    .filter(rule => rule instanceof CSSKeyframesRule).map(rule => (rule as CSSKeyframesRule).name))
  const expected: string[] = []
  expect(await names()).toEqual(expected)
  await page.evaluate(() => {
    document.querySelector('div')!.className = ''
  })
  await expect.poll(() => page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts.has('animate-fade'))).toBe(false)
  await page.evaluate(() => {
    const runtime = globalThis.__MASTER_CSS_RUNTIME_TEST__
    runtime.deleteClassRules(['animate-fade'])
    runtime.refresh()
  })
  expect(await names()).toEqual(expected)
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.text)).not.toContain('@keyframes')
  await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.dispose())
  expect(await names()).toEqual(expected)
})

test('native animations keep running while generated classes are replaced', async ({ page }) => {
  await page.setContent('<style id="native">@keyframes steady{from{opacity:.5}to{opacity:.5}}</style><div id="target" class="animation:steady|1s|infinite"></div>')
  await init(page)
  await expect(page.locator('#target')).toHaveCSS('opacity', '0.5')
  await page.locator('#target').evaluate(element => { element.className = 'animation:steady|2s|infinite' })
  await expect(page.locator('#target')).toHaveCSS('animation-duration', '2s')
  await expect(page.locator('#target')).toHaveCSS('opacity', '0.5')
  expect(await page.locator('#native').textContent()).toContain('@keyframes steady')
})
