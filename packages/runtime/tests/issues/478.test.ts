import { expect, test } from '@playwright/test'
import { renderClassNamesSync } from '@master/css/node'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import init from '../../e2e/init'

const manifest = defaultManifestJSON as unknown as MasterCSSManifest
const states = [
  { classes: ['animate-fade'], duration: '1s', iterations: 'infinite' },
  { classes: ['animate-fade', 'animation-fast'], duration: '0.15s', iterations: 'infinite' },
  {
    classes: ['animate-fade', 'animation-fast', '(animation-duration:var(--duration-slow))', '(animation-iteration-count:1)'],
    duration: '0.3s', iterations: '1'
  },
  { classes: ['animate-fade', 'animation-fast'], duration: '0.15s', iterations: 'infinite' },
  { classes: ['animate-fade'], duration: '1s', iterations: 'infinite' }
]

test('animation overrides agree between static CSS and runtime insertion/removal', async ({ page, context }) => {
  // A separate document keeps the static baseline from styling runtime targets.
  const staticPage = await context.newPage()
  await page.setContent('<div id="target" class="animate-fade"></div>')
  await init(page)
  for (const { classes, duration, iterations } of states) {
    const { cssText } = renderClassNamesSync(classes, { manifest })
    if (classes.includes('animation-fast')) {
      expect(cssText.indexOf('.animation-fast{')).toBeGreaterThan(cssText.indexOf('.animate-fade{'))
    }
    await staticPage.setContent(`<style>${cssText}</style><div id="target" class="${classes.join(' ')}"></div>`)
    await page.locator('#target').evaluate((element, classes) => { element.className = classes.join(' ') }, classes)
    for (const target of [staticPage.locator('#target'), page.locator('#target')]) {
      await expect(target).toHaveCSS('animation-name', 'fade')
      await expect(target).toHaveCSS('animation-duration', duration)
      await expect(target).toHaveCSS('animation-iteration-count', iterations)
    }
    // Compare the installed CSSOM rules as well as the computed values. This
    // catches waiting on classCounts before the runtime's insertion has run.
    await expect.poll(() => page.evaluate(classes => {
      const sheet = document.querySelector<HTMLStyleElement>('style#master-css')!.sheet!
      const selectors = [...sheet.cssRules].flatMap(rule => rule instanceof CSSLayerBlockRule
        ? [...rule.cssRules].flatMap(child => child instanceof CSSStyleRule ? [child.selectorText] : [])
        : [])
      const indexes = classes.map(className => selectors.indexOf(`.${CSS.escape(className)}`))
      return indexes.every((index, position) => index >= 0 && (position === 0 || indexes[position - 1] < index))
    }, classes)).toBe(true)
  }
  await staticPage.close()
})
