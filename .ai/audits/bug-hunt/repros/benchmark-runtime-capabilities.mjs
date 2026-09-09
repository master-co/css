import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
assert(process.cwd().includes('master-css-bh-isolated-'))
const { createInteractionPage } = await import(pathToFileURL(resolve('shared/interaction-cost.ts')))
const { startBrowserLifecycleServer } = await import(pathToFileURL(resolve('shared/browser-lifecycle-server.ts')))
const { chromium } = createRequire(resolve('package.json'))('@playwright/test')
const generated = await createInteractionPage({ fixtureId: 'dynamic', modeId: 'master-runtime', scenarioId: 'existing-class-toggle', variantId: 'bh-0171-capabilities', runtimeDiagnostics: true })
const server = await startBrowserLifecycleServer(generated.root)
const browser = await chromium.launch()
try {
 const page = await browser.newPage()
 await page.route(server.origin, async route => {
  const response = await route.fetch(); const html = await response.text()
  const marker = 'const result = originalObserve.apply(this, args);'
  assert(html.includes(marker))
  await route.fulfill({ response, body: html.replace(marker, marker + `\nwindow.__auditCapabilities = { retainedSet: this.retainedClassNames instanceof Set, observer: this.observer instanceof MutationObserver, snapshot: typeof this.snapshot, facadeSet: !!window.masterCSSRuntime?.retainedClassNames };`) })
 })
 await page.goto(server.origin); await page.waitForFunction('window.__benchmarkReady === true')
 const result = await page.evaluate('window.__auditCapabilities')
 console.log(JSON.stringify(result))
 assert.deepEqual(result, { retainedSet: true, observer: true, snapshot: 'function', facadeSet: false })
} finally { await browser.close(); await server.close() }
