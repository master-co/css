import { expect, test } from '@playwright/test'
import init from '../../init'
import manifest from './manifest'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

test('selectors', async ({ page }) => {
  const generatedCSS = readFileSync(resolve(__dirname, 'generated.css'), 'utf-8')
  const prerenderHTML = readFileSync(resolve(__dirname, 'prerender.html'), 'utf-8')
  await page.evaluate((html) => document.body.innerHTML = html, prerenderHTML)
  await init(page, generatedCSS, manifest, 'auto')
  expect((await page.evaluate(() => globalThis.masterCSSRuntime.rules)).map(({ name }) => name)).toEqual(['theme', 'utilities'])
  expect(await page.evaluate(() => globalThis.masterCSSRuntime.utilitiesLayer.rules.find((rule) => rule.name === 'block::before,::after')?.selectorText))
    .toBe('.block\\:\\:before\\,\\:\\:after::before,.block\\:\\:before\\,\\:\\:after::after')

  expect(await page.evaluate(() => globalThis.masterCSSRuntime.utilitiesLayer.rules.find((rule) => rule.name === 'block::before,::after')?.text))
    .toBe('.block\\:\\:before\\,\\:\\:after::before,.block\\:\\:before\\,\\:\\:after::after{display:block}')
  expect(await page.evaluate(() => globalThis.masterCSSRuntime.utilitiesLayer.rules.find((rule) => rule.name === 'block::before,::after')?.native?.cssText))
    .toBe('.block\\:\\:before\\,\\:\\:after::before, .block\\:\\:before\\,\\:\\:after::after { display: block; }')

  expect(await page.evaluate(() => globalThis.masterCSSRuntime.utilitiesLayer.rules.find((rule) => rule.name === 'hidden::slider-thumb')?.text))
    .toBe('.hidden\\:\\:slider-thumb::-webkit-slider-thumb{display:none}')
  expect(await page.evaluate(() => globalThis.masterCSSRuntime.utilitiesLayer.rules.find((rule) => rule.name === 'hidden::slider-thumb')?.native?.cssText))
    .toBe('.hidden\\:\\:slider-thumb::-webkit-slider-thumb { display: none; }')
})
