import { it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { $fetch } from '@nuxt/test-utils'
import { createPage } from '@nuxt/test-utils/e2e'
import { dirname, resolve } from 'node:path'
import { fetchDeliveredStylesheet, setupNuxtTest } from './setup-test'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, './fixtures/static/')

setupNuxtTest({ rootDir })

it('should contain stylesheet link and CSS with specific class', async () => {
  const html = await $fetch('/') as string
  const match = html.match(/<link rel="stylesheet" href="([^"]+\.css)"[^>]*>/)
  expect(match).toBeTruthy()
  if (!match) throw new Error('Expected a stylesheet link in Nuxt static HTML.')
  const href = match[1]
  if (!href) throw new Error('Expected Nuxt static stylesheet link to include an href.')
  expect(href).toMatch(/\/_nuxt\/.*\.css/)
  const css = await fetchDeliveredStylesheet(href)
  expect(typeof css).toBe('string')
  expect(css).toContain('.box')
  expect(css).toMatch(/\.box\s*{[^}]*display:\s*flex/)
  expect(css).toMatch(/\.box\s*{[^}]*font-size:\s*1em/)
  expect(css).toMatch(/\.probe\[data-v-[^\]]+\]\s*\{/)
  expect(css).toContain('--color-probe:#123456')
  expect(css).toContain('--color-probe:#abcdef')
  expect(css).not.toContain('@reference')
  expect(css).not.toContain('master-css-local-')
})

it('delivers referenced native variables through a scoped Vue style', async () => {
  const page = await createPage('/')
  try {
    for (const [colorScheme, expected] of [['light', 'rgb(18, 52, 86)'], ['dark', 'rgb(171, 205, 239)']] as const) {
      await page.emulateMedia({ colorScheme })
      expect(await page.locator('.probe').evaluate(element => getComputedStyle(element).color)).toBe(expected)
    }
  } finally {
    await page.close()
  }
})
