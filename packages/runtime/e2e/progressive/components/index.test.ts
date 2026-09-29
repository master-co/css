import { expect, test } from '@playwright/test'
import init from '../../init'
import manifest from './manifest'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

test('components', async ({ page }) => {
  const generatedCSS = readFileSync(resolve(__dirname, 'generated.css'), 'utf-8')
  const prerenderHTML = readFileSync(resolve(__dirname, 'prerender.html'), 'utf-8')
  await page.evaluate((html) => document.body.innerHTML = html, prerenderHTML)
  await init(page, generatedCSS, manifest, 'auto')
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().hydration.state)).toBe('progressive')
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.componentsLayer.native?.cssRules.length)).toEqual(2)
  expect((await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.rules)).map(({ name }) => name)).toEqual(['theme', 'components'])
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.componentsLayer.rules.find((rule) => rule.name === 'btn@component')?.text))
    .toBe('.btn\\@component{background-color:var(--color-foo)}')
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.componentsLayer.rules.find((rule) => rule.name === 'btn@component')?.selectorText))
    .toBe('.btn\\@component')
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.componentsLayer.rules.find((rule) => rule.name === 'btn@component')?.native?.cssText))
    .toBe('.btn\\@component { background-color: var(--color-foo); }')
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.componentsLayer.rules.find((rule) => rule.name === 'btn@component@sm')?.text))
    .toBe('@media (width >= 52.125rem){.btn\\@component\\@sm{background-color:var(--color-foo)}}')
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.componentsLayer.rules.find((rule) => rule.name === 'btn@component@sm')?.selectorText))
    .toBe('.btn\\@component\\@sm')
  expect(await page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.componentsLayer.rules.find((rule) => rule.name === 'btn@component@sm')?.native?.cssText))
    .toBe('@media (width >= 52.125rem) {\n  .btn\\@component\\@sm { background-color: var(--color-foo); }\n}')
})
