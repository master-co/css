import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { beforeAll, expect, it } from 'vitest'
import { MASTER_CSS_HYDRATION_MANIFEST_ATTR } from '@master/css-schema/hydration-manifest'
import { MASTER_CSS_STYLESHEET_ASSET_SUFFIX } from '@master/css-schema/runtime-style'
import { buildAstroFixture, serveStaticOutput } from './static-output-helper'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const fixtureDir = join(packageDir, 'tests/fixtures/progressive')
const outDir = join(fixtureDir, 'dist')

type RuntimeGlobal = typeof globalThis & {
  masterCSSRuntime?: { snapshot(): { observing: boolean, engine: string, hydration: unknown } }
}

beforeAll(() => buildAstroFixture(fixtureDir), 120_000)

it('pre-renders progressive CSS through the middleware of a static Astro build', () => {
  const html = readFileSync(join(outDir, 'index.html'), 'utf8')
  const style = html.match(/<style\b[^>]*\bid="master-css"[^>]*>([\s\S]*?)<\/style>/)
  expect(style?.[1]).toContain('font-weight:700')
  expect(style?.[1]).toContain('margin-top:12px')
  // The linked stylesheet already defines the token the utility shares with it.
  expect(style?.[1]).not.toContain('--color-text-body:')
  const manifest = style?.[0].match(new RegExp(`${MASTER_CSS_HYDRATION_MANIFEST_ATTR}="([^"]+)"`))?.[1]
  expect(manifest).toBeTruthy()
  expect(existsSync(join(outDir, manifest!))).toBe(true)
  // Progressive pages defer the engine, so neither its Wasm nor the project manifest is preloaded.
  expect(html).not.toContain('application/wasm')
  expect(html).not.toMatch(/<link\b[^>]*master-css-manifest/)
  // The runtime adopts linked stylesheets through their sidecars.
  const stylesheets = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map(([, href]) => href)
  expect(stylesheets.length).toBeGreaterThan(0)
  for (const href of stylesheets) {
    const sidecar = JSON.parse(readFileSync(join(outDir, href + MASTER_CSS_STYLESHEET_ASSET_SUFFIX), 'utf8'))
    expect(sidecar.version).toBe(1)
  }
  // The entry re-imports the preset that the default build manifest already supplies.
  const assetsDir = join(outDir, '_astro')
  const assets = readdirSync(assetsDir)
  const projectManifest = assets.find(file => /^master-css-manifest\..+\.json$/.test(file))
  expect(projectManifest).toBeTruthy()
  const theme: unknown[] = JSON.parse(readFileSync(join(assetsDir, projectManifest!), 'utf8')).theme
  expect(theme.length).toBeGreaterThan(0)
  expect(new Set(theme.map(node => JSON.stringify(node))).size).toBe(theme.length)
  const themeRules = assets.filter(file => file.endsWith('.css'))
    .flatMap(file => readFileSync(join(assetsDir, file), 'utf8').match(/:root,:host\{[^}]*\}/g) ?? [])
  expect(themeRules.length).toBeGreaterThan(0)
  expect(new Set(themeRules).size).toBe(themeRules.length)
})

// Astro builds the runtime in a client bundle that never imports the page CSS.
it('hydrates the pre-rendered CSS in a browser', async () => {
  const server = await serveStaticOutput(outDir)
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    const warnings: string[] = []
    const requests: string[] = []
    page.on('console', message => { if (message.type() === 'warning') warnings.push(message.text()) })
    page.on('request', request => requests.push(request.url()))
    await page.goto(`${server.origin}/`)
    await page.waitForFunction(() => (globalThis as RuntimeGlobal).masterCSSRuntime?.snapshot().observing)
    expect(await page.evaluate(() => {
      const { engine, hydration } = (globalThis as RuntimeGlobal).masterCSSRuntime!.snapshot()
      return { engine, hydration }
    })).toEqual({ engine: 'deferred', hydration: { state: 'progressive', manifestLoaded: true } })
    // Every class is pre-rendered, so the engine, its Wasm and the project manifest stay unloaded.
    expect(requests.filter(url => /\.wasm$|master-css-manifest/.test(url))).toEqual([])
    expect(warnings).toEqual([])
  } finally {
    await browser.close()
    await server.close()
  }
}, 60_000)
