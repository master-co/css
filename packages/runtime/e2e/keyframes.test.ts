import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import init from './init'

const nativePreset = readFileSync(new URL('../../preset/src/default-native.css', import.meta.url), 'utf8')

test('animation shorthand tokens preserve preset timing and support direct overrides', async ({ page }) => {
  const names = ['fade', 'flash', 'float', 'heart', 'jump', 'ping', 'pulse', 'rotate', 'shake', 'zoom']
  await page.setContent(names.map(name => `<div id="${name}" class="animate-${name}"></div>`).join(''))
  await init(page)
  for (const name of names) {
    const target = page.locator(`#${name}`)
    await expect(target).toHaveCSS('animation-name', name)
    await expect(target).toHaveCSS('animation-duration', name === 'float' ? '3s' : '1s')
    await expect(target).toHaveCSS('animation-timing-function', name === 'float' ? 'ease-in-out' : name === 'rotate' ? 'linear' : 'ease')
    await expect(target).toHaveCSS('animation-iteration-count', 'infinite')
  }
  const target = page.locator('#fade')
  await target.evaluate(element => { element.className = 'animate-fade animation-fast' })
  await expect.poll(() => page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts.has('animation-fast'))).toBe(true)
  await expect(target).toHaveCSS('animation-duration', '1s')
  await target.evaluate(element => { element.className = 'animate-fade animation-duration:var(--duration-fast) animation-iteration-count:1' })
  await expect(target).toHaveCSS('animation-duration', '0.15s')
  await expect(target).toHaveCSS('animation-iteration-count', '1')
})

test('custom animation shorthand uses native defaults through hydration and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.setContent('<div id="entry" class="animate-entry@motion-safe"></div><div id="bare" class="animate-bare"></div>')
  await init(page, undefined, { variables: [
    { name: 'animate-entry', namespace: 'animate', key: 'entry', values: [{ path: [':root'], value: 'fade var(--duration-fast) ease-out both' }], dependencies: ['duration-fast'] },
    { name: 'animate-bare', namespace: 'animate', key: 'bare', values: [{ path: [':root'], value: 'fade' }], dependencies: [] }
  ] }, 'auto')
  await expect(page.locator('#entry')).toHaveCSS('animation-duration', '0.15s')
  await expect(page.locator('#entry')).toHaveCSS('animation-iteration-count', '1')
  await expect(page.locator('#entry')).toHaveCSS('animation-fill-mode', 'both')
  await expect(page.locator('#bare')).toHaveCSS('animation-duration', '0s')
  await expect(page.locator('#bare')).toHaveCSS('animation-iteration-count', '1')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('#entry')).toHaveCSS('animation-name', 'none')
})

test('animation utilities emit only their managed keyframes', async ({ page }) => {
  await page.setContent('<div class="animate-fade animation:zoom|1s"></div>')
  await init(page)
  const text = await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.text)
  expect(text).toContain('--animate-fade:fade')
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
