import { expect, test } from '@playwright/test'
import { renderClassNamesSync } from '@master/css/node'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import init, { createRuntimeProjectManifest } from './init'

const mixins: NonNullable<MasterCSSManifest['mixins']> = [
  { name: '--repeat', body: [
    { type: 'contents', fallback: [] },
    { type: 'rule', selector: '&:hover', body: [{ type: 'contents', fallback: [] }] }
  ] },
  { name: '--discard', body: [{ type: 'declaration', property: 'display', value: [{ type: 'text', value: 'block' }] }] }
]
const keyframes = [{ id: 'contents-fade', name: 'contents-fade', text: '@keyframes contents-fade{to{opacity:0}}' }]
const className = 'animation-name:contents-fade@apply(--repeat)@layer(components)'

test('wrapper nodes hydrate, survive refresh, and release resources on DOM removal', async ({ page }) => {
  const manifest = createRuntimeProjectManifest({ mixins, keyframes })
  const rendered = renderClassNamesSync([className], { manifest })
  await page.setContent(`<div class="${className}"></div>`)
  await init(page, rendered.cssText, { mixins, keyframes }, rendered.hydrationManifest)
  expect(await page.evaluate(() => globalThis.masterCSSRuntime.snapshot().hydration.failureReason)).toBeUndefined()
  const read = () => page.evaluate(() => globalThis.masterCSSRuntime.snapshot().cssText)
  expect(await read()).toContain('@layer components')
  expect(await read()).toContain(':hover')
  expect(await read()).toContain('@keyframes contents-fade')
  await page.evaluate(manifest => globalThis.masterCSSRuntime.refresh(manifest), manifest)
  expect(await read()).toBe(rendered.cssText)
  await page.locator('div').evaluate(element => element.removeAttribute('class'))
  await expect.poll(() => page.evaluate(() => {
    // Runtime intentionally caches unused rules; force its existing cleanup boundary.
    globalThis.__MASTER_CSS_RUNTIME_TEST__.flushRetainedClassRules()
    return globalThis.masterCSSRuntime.snapshot().cssText
  })).not.toContain('@keyframes contents-fade')
  await page.locator('div').evaluate(element => element.className = 'animation-name:contents-fade@apply(--discard)')
  await expect.poll(read).toContain('display:block')
  expect(await read()).not.toContain('@keyframes contents-fade')
  await page.locator('div').evaluate((element, name) => element.className = name, className)
  await expect.poll(read).toContain('@keyframes contents-fade')
})
