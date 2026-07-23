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

  await page.evaluate(() => {
    const baseHost = document.createElement('div')
    baseHost.className = 'block_button@base'
    baseHost.innerHTML = '<button id="selectorless-base-descendant">Base descendant</button>'

    const defaultsHost = document.createElement('div')
    defaultsHost.id = 'selectorless-default-host'
    defaultsHost.className = '{flex;rel}_:is(h4,.app-nav)@default'
    defaultsHost.innerHTML = '<h4 id="selectorless-default-descendant">Default descendant</h4>'

    document.body.append(baseHost, defaultsHost)
  })

  await expect.poll(() => page.evaluate(() => ({
    base: globalThis.masterCSSRuntime.baseLayer.rules.find((rule) => rule.name === 'block_button@base')?.text,
    defaults: globalThis.masterCSSRuntime.defaultsLayer.rules.find(
      (rule) => rule.name === '{flex;rel}_:is(h4,.app-nav)@default'
    )?.text
  }))).toEqual({
    base: '.block_button\\@base button{display:block}',
    defaults: '.\\{flex\\;rel\\}_\\:is\\(h4\\,\\.app-nav\\)\\@default :is(h4,.app-nav){display:flex;position:relative}'
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
