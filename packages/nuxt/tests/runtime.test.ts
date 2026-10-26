import { it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { $fetch } from '@nuxt/test-utils'
import { createPage } from '@nuxt/test-utils/e2e'
import { dirname, resolve } from 'node:path'
import { MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID } from '@master/css-schema/hydration-manifest'
import { createEngineSync } from '@master/css/node'
import { setupNuxtTest } from './setup-test'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, './fixtures/runtime/')

setupNuxtTest({ rootDir })

function getProgramPreloadHref(html: string) {
  return html.match(/<link\b(?=[^>]*\brel="preload")(?=[^>]*\bas="fetch")(?=[^>]*\bhref="([^"]*master-css-program[^"]*\.bin)")/i)?.[1]
}

it('does not pre-render style#master-css in runtime mode', async () => {
  const html = await $fetch('/') as string
  expect(html).toContain('class="box"')
  expect(html).not.toContain('style id="master-css"')
  expect(html).not.toContain(MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID)
})

it('preloads the runtime program in runtime mode', async () => {
  const html = await $fetch('/') as string
  const href = getProgramPreloadHref(html)

  expect(href).toMatch(/^\/_master-css\/program\/master-css-program\.[0-9a-f]{8}\.bin$/)
  const program = new Uint8Array(await $fetch(href || '', { responseType: 'arrayBuffer' }) as ArrayBuffer)
  using engine = createEngineSync({ program })
  expect(engine.ensureClassRules(['fg-host']).mutations.length).toBeGreaterThan(0)
})

it('lets runtime utilities override global component layer CSS', async () => {
  const page = await createPage('/')
  try {
    await page.waitForSelector('#probe')
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#probe')!).display === 'block')

    expect(await page.locator('#probe').evaluate((element) => getComputedStyle(element).display)).toBe('block')
    const runtimeCSS = await page.locator('style#master-css').evaluate((style) => {
      return Array.from((style as HTMLStyleElement).sheet?.cssRules || [], (rule) => rule.cssText).join('\n')
    })
    expect(runtimeCSS).toContain('.fg-host')
    expect(runtimeCSS).not.toContain('--color-host:')
  } finally {
    await page.close()
  }
})
