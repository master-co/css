import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { createEngineSync } from '@master/css/node'
import defaultManifest from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'

test('BH-0008 built global runtime hydrates and updates under CSP without unsafe-eval', async ({ page }) => {
  const engine = createEngineSync({ manifest: defaultManifest as unknown as MasterCSSManifest })
  let text: string
  let hydration: string
  try {
    engine.ensureClassRules(['block'])
    const snapshot = engine.snapshot()
    text = snapshot.text
    hydration = JSON.stringify({ version: 1, languageVersion: 3, rules: snapshot.rules, resourceOrder: [
      ...snapshot.resources.variables.map(resource => resource.name),
      ...snapshot.resources.animations.map(resource => resource.name)
    ] })
  } finally { engine.dispose() }
  const requests: string[] = []
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    const violations: string[] = []
    Object.assign(globalThis, { auditCSPViolations: violations })
    document.addEventListener('securitypolicyviolation', event => violations.push(event.violatedDirective))
  })
  await page.route('http://runtime-audit.test/**', route => {
    const path = new URL(route.request().url()).pathname
    requests.push(path)
    const assets: Record<string, { contentType: string, body: string | Buffer }> = {
      '/runtime/global.min.js': { contentType: 'text/javascript', body: readFileSync(new URL('../dist/global.min.js', import.meta.url)) },
      '/runtime/default-manifest.json': { contentType: 'application/json', body: readFileSync(new URL('../dist/default-manifest.json', import.meta.url)) },
      '/artifacts/mastercss_binding_wasm_engine_bg.wasm': { contentType: 'application/wasm', body: readFileSync(new URL('../artifacts/mastercss_binding_wasm_engine_bg.wasm', import.meta.url)) },
      '/hydration.json': { contentType: 'application/json', body: hydration }
    }
    if (path === '/') return route.fulfill({
      contentType: 'text/html',
      headers: { 'Content-Security-Policy': "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'unsafe-inline'; connect-src 'self'" },
      body: `<!doctype html><html><head><style id="master-css" data-master-css-hydration-manifest="/hydration.json">${text}</style><script defer src="/runtime/global.min.js"></script></head><body><div id="probe" class="block"></div></body></html>`
    })
    return route.fulfill(assets[path] ?? { status: 404, body: 'not found' })
  })
  await page.goto('http://runtime-audit.test/')
  await page.waitForFunction(() => globalThis.masterCSSRuntime?.snapshot().observing)
  const initial = await page.evaluate(() => globalThis.masterCSSRuntime!.snapshot())
  expect(initial.hydration.state).toBe('progressive')
  expect(initial.usageCounts).toEqual({ block: 1 })
  await page.locator('#probe').evaluate(element => element.className = 'hidden')
  await expect(page.locator('#probe')).toHaveCSS('display', 'none')
  expect(await page.evaluate(() => globalThis.masterCSSRuntime!.snapshot().usageCounts)).toEqual({ hidden: 1 })
  expect(requests.filter(path => path === '/hydration.json')).toHaveLength(1)
  expect(await page.evaluate(() => (globalThis as typeof globalThis & { auditCSPViolations: string[] }).auditCSPViolations)).toEqual([])
  expect(errors).toEqual([])
  await page.evaluate(() => globalThis.masterCSSRuntime!.dispose())
})
