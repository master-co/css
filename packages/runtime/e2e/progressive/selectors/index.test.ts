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
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().hydration.state)).toBe('progressive')
  expect((await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.rules)).map(({ name }) => name)).toEqual(['theme', 'utilities'])
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.utilitiesLayer.rules.find((rule) => rule.name === "display:block::before,::after")?.selectorText))
    .toBe(".display\\:block\\:\\:before\\,\\:\\:after::before,.display\\:block\\:\\:before\\,\\:\\:after::after")

  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.utilitiesLayer.rules.find((rule) => rule.name === "display:block::before,::after")?.text))
    .toBe(".display\\:block\\:\\:before\\,\\:\\:after::before,.display\\:block\\:\\:before\\,\\:\\:after::after{display:block}")
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.utilitiesLayer.rules.find((rule) => rule.name === "display:block::before,::after")?.native?.cssText))
    .toBe(".display\\:block\\:\\:before\\,\\:\\:after::before, .display\\:block\\:\\:before\\,\\:\\:after::after { display: block; }")

  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.utilitiesLayer.rules.find((rule) => rule.name === "display:none::-webkit-slider-thumb")?.text))
    .toBe(".display\\:none\\:\\:-webkit-slider-thumb::-webkit-slider-thumb{display:none}")
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.utilitiesLayer.rules.find((rule) => rule.name === "display:none::-webkit-slider-thumb")?.native?.cssText))
    .toBe(".display\\:none\\:\\:-webkit-slider-thumb::-webkit-slider-thumb { display: none; }")

  await page.evaluate(() => {
    const baseHost = document.createElement('div')
    baseHost.className = "display:block_button@layer(base)"
    baseHost.innerHTML = '<button id="selectorless-base-descendant">Base descendant</button>'

    const defaultsHost = document.createElement('div')
    defaultsHost.id = 'selectorless-default-host'
    defaultsHost.className = 'display:flex_:is(h4,.app-nav)@layer(defaults) position:relative_:is(h4,.app-nav)@layer(defaults)'
    defaultsHost.innerHTML = '<h4 id="selectorless-default-descendant">Default descendant</h4>'

    document.body.append(baseHost, defaultsHost)
  })

  await expect.poll(() => page.evaluate(() => ({
    base: globalThis.__MASTER_CSS_RUNTIME_TEST__.baseLayer.rules.find((rule) => rule.name === "display:block_button@layer(base)")?.text,
    defaults: globalThis.__MASTER_CSS_RUNTIME_TEST__.defaultsLayer.rules.filter(
      (rule) => ['display:flex_:is(h4,.app-nav)@layer(defaults)', 'position:relative_:is(h4,.app-nav)@layer(defaults)'].includes(rule.name)
    ).map(rule => rule.text)
  }))).toEqual({
    base: '.display\\:block_button\\@layer\\(base\\) button{display:block}',
    defaults: [
      '.display\\:flex_\\:is\\(h4\\,\\.app-nav\\)\\@layer\\(defaults\\) :is(h4,.app-nav){display:flex}',
      '.position\\:relative_\\:is\\(h4\\,\\.app-nav\\)\\@layer\\(defaults\\) :is(h4,.app-nav){position:relative}'
    ]
  })

  expect(await page.evaluate(() => {
    const hostStyle = getComputedStyle(document.getElementById('selectorless-default-host')!)
    const baseDescendantStyle = getComputedStyle(document.getElementById('selectorless-base-descendant')!)
    const defaultDescendantStyle = getComputedStyle(document.getElementById('selectorless-default-descendant')!)
    return {
      baseDescendantDisplay: baseDescendantStyle.display,
      defaultDescendantDisplay: defaultDescendantStyle.display,
      defaultDescendantPosition: defaultDescendantStyle.position,
      hostDisplay: hostStyle.display
    }
  })).toEqual({
    baseDescendantDisplay: 'block',
    defaultDescendantDisplay: 'flex',
    defaultDescendantPosition: 'relative',
    hostDisplay: 'block'
  })
})
