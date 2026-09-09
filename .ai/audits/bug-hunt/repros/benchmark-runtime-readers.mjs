import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
assert(process.cwd().includes('master-css-bh-isolated-'))
const load = (path) => import(pathToFileURL(resolve(path)).href)
const { createMasterDeliveryModePage } = await load('shared/delivery-modes.ts')
const { createInteractionPage } = await load('shared/interaction-cost.ts')
const { startBrowserLifecycleServer } = await load('shared/browser-lifecycle-server.ts')
const { chromium, firefox, webkit } = createRequire(resolve('package.json'))('@playwright/test')
const failures = []
const forceFallback = process.env.BH_FALLBACK === '1'
for (const [engine, launcher] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await launcher.launch()
  try {
    for (const modeId of forceFallback ? ['master-progressive'] : ['master-runtime', 'master-progressive']) {
      for (const family of ['delivery', 'interaction']) {
        const generated = family === 'delivery'
          ? await createMasterDeliveryModePage({ fixtureId: 'minimal', modeId, variantId: `bh-0170-${modeId}` })
          : await createInteractionPage({ fixtureId: 'dynamic', modeId, scenarioId: 'existing-class-toggle', variantId: `bh-0170-${modeId}` })
        const server = await startBrowserLifecycleServer(generated.root)
        const page = await browser.newPage()
        try {
          if (forceFallback) {
            await page.route(server.origin, async route => {
              const response = await route.fetch(); const html = await response.text();
              const changed = html.replace(/(<style[^>]*id=["']master-css["'][^>]*>)[\s\S]*?(<\/style>)/, '$1.audit-wrong-hydration{color:red}$2');
              assert.notEqual(changed, html, 'must corrupt the generated SSR style');
              await route.fulfill({ response, body: changed });
            });
          }
          await page.goto(server.origin)
          await page.waitForFunction('globalThis.__benchmarkReady === true')
          const result = await page.evaluate(`(() => {
            const snapshot = masterCSSRuntime.snapshot();
            const state = globalThis.__readInteractionState?.() || globalThis.__deliveryMetrics;
            const expected = {
              runtimeGeneratedRuleCount: snapshot.layers.reduce((sum, layer) => sum + layer.ruleCount, 0),
              runtimeStyleRawBytes: new TextEncoder().encode(snapshot.cssText).length,
              progressiveAdopted: snapshot.hydration.state === 'progressive' ? 1 : 0
            };
            return { hydration: snapshot.hydration, expected, actual: Object.fromEntries(Object.keys(expected).map(key => [key, state[key]])) };
          })()`)
          if (forceFallback) {
            assert.equal(result.hydration.state, 'runtime');
            assert(result.hydration.failureReason);
            assert.equal(result.actual.progressiveAdopted, 0);
          }
          const pass = JSON.stringify(result.actual) === JSON.stringify(result.expected)
          if (!pass) failures.push({ engine, family, modeId, ...result })
          console.log(JSON.stringify({ engine, family, modeId, ...result, pass }))
        } finally { await page.close(); await server.close() }
      }
    }
  } finally { await browser.close() }
}
assert.deepEqual(failures, [])
