import { readFileSync } from 'node:fs'
import { chromium, firefox, webkit } from '@playwright/test'
import { expect, test } from 'vitest'
import { createTestCSS } from '../tests/helpers/rust-engine'
import manifest from '../src/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'

const base = readFileSync(new URL('../src/default-native.css', import.meta.url), 'utf8')
for (const browserType of [chromium, firefox, webkit]) {
  test(`${browserType.name()}: preset leaves document sizing, selection and font rasterization to the project`, async () => {
    const browser = await browserType.launch()
    const css = createTestCSS(manifest as unknown as MasterCSSManifest)
    try {
      css.ensureClassRules('user-select:none', 'min-height:100dvh')
      const page = await browser.newPage({ viewport: { width: 900, height: 700 } })
      await page.setContent('<!doctype html><html><body><button>Selectable label</button><div style="height:40px">Short content</div></body></html>')
      const inherited = await page.evaluate(() => ({
        text: getComputedStyle(document.body).textRendering,
        smoothing: getComputedStyle(document.body).getPropertyValue('-webkit-font-smoothing'),
        selection: getComputedStyle(document.querySelector('button')!).userSelect
      }))
      await page.addStyleTag({ content: base + css.text })
      const actual = await page.evaluate(() => ({
        bodyHeight: document.body.getBoundingClientRect().height,
        text: getComputedStyle(document.body).textRendering,
        smoothing: getComputedStyle(document.body).getPropertyValue('-webkit-font-smoothing'),
        selection: getComputedStyle(document.querySelector('button')!).userSelect,
        boxSizing: getComputedStyle(document.querySelector('button')!).boxSizing
      }))
      expect(actual.bodyHeight).toBeLessThan(150)
      expect(actual).toMatchObject({ ...inherited, boxSizing: 'border-box' })
      await page.evaluate(() => { document.body.className = 'min-height:100dvh'; document.querySelector('button')!.className = 'user-select:none' })
      expect(await page.locator('body').evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(700)
      expect(await page.locator('button').evaluate(element => getComputedStyle(element).userSelect)).toBe('none')
      await page.setViewportSize({ width: 390, height: 500 })
      expect(await page.locator('body').evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(500)
    } finally { await browser.close() }
  })
}
