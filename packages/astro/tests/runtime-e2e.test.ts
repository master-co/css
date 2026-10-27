import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { beforeAll, expect, it } from 'vitest'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import { buildAstroFixture, serveStaticOutput } from './static-output-helper'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const fixtureDir = join(packageDir, 'tests/fixtures/runtime')
const outDir = join(fixtureDir, 'dist')

type RuntimeGlobal = typeof globalThis & {
  masterCSSRuntime?: { snapshot(): { observing: boolean } }
}

function readLinkedCSS() {
  const html = readFileSync(join(outDir, 'index.html'), 'utf8')
  const seen = new Set<string>()
  const read = (href: string): string => {
    if (seen.has(href)) return ''
    seen.add(href)
    const css = readFileSync(join(outDir, href), 'utf8')
    const imported = [...css.matchAll(/@import\s+"([^"]+)"/g)]
      .map(([, specifier]) => read(new URL(specifier, new URL(href, 'http://localhost')).pathname))
    return [...imported, css].join('\n')
  }
  return [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map(([, href]) => read(href)).join('\n')
}

beforeAll(() => buildAstroFixture(fixtureDir), 120_000)

// Astro processes page CSS in its server environments and builds the runtime in a
// client environment that never imports it.
it('bundles the emitted globals of the CSS the server environments deliver', () => {
  const assetsDir = join(outDir, '_astro')
  const bundled = readdirSync(assetsDir).filter(file => file.endsWith('.js'))
    .flatMap(file => readFileSync(join(assetsDir, file), 'utf8').match(/\{"variables":.*?"suppressedKeyframes":\[[^\]]*\]\}/g) ?? [])
  expect(bundled).toHaveLength(1)
  const emittedGlobals = JSON.parse(bundled[0]) as Required<MasterCSSEmittedGlobals>
  const css = readLinkedCSS()
  expect(emittedGlobals.variables).toHaveProperty('color-text-body')
  for (const name of Object.keys(emittedGlobals.variables)) expect(css).toContain(`--${name}:`)
  expect(emittedGlobals.keyframeSlots.length).toBeGreaterThan(0)
  expect(css).toContain('master-css-keyframe-')
})

it('leaves tokens and keyframes the linked CSS delivers out of style#master-css', async () => {
  const server = await serveStaticOutput(outDir)
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    const warnings: string[] = []
    page.on('console', message => { if (message.type() === 'warning' || message.type() === 'error') warnings.push(message.text()) })
    await page.goto(`${server.origin}/`)
    await page.waitForFunction(() => (globalThis as RuntimeGlobal).masterCSSRuntime?.snapshot().observing)
    const runtimeCSS = () => page.locator('style#master-css').evaluate(style => [...(style as HTMLStyleElement).sheet!.cssRules].map(rule => rule.cssText).join('\n'))

    expect(await runtimeCSS()).toContain('.fg-text-body')
    expect(await runtimeCSS()).not.toContain('--color-text-body:')
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-text-body'))).not.toBe('')

    // The runtime fills the native keyframe slot the linked CSS reserves.
    await page.locator('#probe').evaluate(element => element.classList.add('animate-fade'))
    await expect.poll(() => page.locator('#probe').evaluate(element => getComputedStyle(element).animationName)).toBe('fade')
    expect(await runtimeCSS()).toContain('.animate-fade')
    expect(await runtimeCSS()).not.toContain('@keyframes')
    expect(warnings).toEqual([])
  } finally {
    await browser.close()
    await server.close()
  }
}, 60_000)
