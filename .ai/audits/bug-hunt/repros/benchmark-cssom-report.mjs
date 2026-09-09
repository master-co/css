import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
await import('./benchmark-runtime-report.mjs')
const suite = process.argv[2]
assert(['browser-lifecycle', 'master-delivery-modes', 'progressive-hydration-diagnostics'].includes(suite))
const report = JSON.parse(await readFile(`.results/${suite}/report.json`, 'utf8'))
const { startBrowserLifecycleServer } = await import(pathToFileURL(resolve('shared/browser-lifecycle-server.ts')))
const { chromium, firefox, webkit } = createRequire(resolve('package.json'))('@playwright/test')
for (const [engine, launcher] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await launcher.launch()
  try {
    for (const variant of report.variants) {
      const pageArtifact = report.artifacts.find(({ path }) => path.endsWith(`/pages/${variant.id}/index.html`))
      assert(pageArtifact, variant.id)
      const root = resolve('..', pageArtifact.path, '..')
      const server = await startBrowserLifecycleServer(root)
      const page = await browser.newPage()
      try {
        await page.goto(server.origin)
        await page.waitForFunction('globalThis.__benchmarkReady === true')
        const observed = await page.evaluate((isLifecycle) => {
          // The independent oracle uses native interface membership rather than
          // the measured helper's property-based leaf/selector detection.
          function flatten(rules) {
            const result = []
            for (const rule of rules || []) {
              result.push(rule)
              if (rule.cssRules) result.push(...flatten(rule.cssRules))
            }
            return result
          }
          function counted(rule) {
            return rule instanceof CSSStyleRule || !(rule instanceof CSSGroupingRule || rule instanceof CSSKeyframesRule)
          }
          const top = [...(document.getElementById('master-css')?.sheet?.cssRules || [])]
          const layerCounts = {}
          let layerTotal = 0
          for (const rule of top.filter(rule => rule instanceof CSSLayerBlockRule)) {
            layerCounts[rule.name || 'anonymous'] = (layerCounts[rule.name || 'anonymous'] || 0) + rule.cssRules.length
            layerTotal += rule.cssRules.length
          }
          let documentCount = 0
          for (const sheet of document.styleSheets) {
            try { documentCount += flatten(sheet.cssRules).filter(counted).length } catch {}
          }
          const expected = { total: flatten(top).filter(counted).length, top: top.length, layers: layerCounts, layerTotal }
          return { expected, documentCount, lifecycleCount: isLifecycle ? __readLifecycleState().cssomRuleCount : undefined,
            nativeKinds: [...new Set(flatten(top).map(rule => rule.constructor.name))], hydration: globalThis.masterCSSRuntime?.snapshot().hydration.state }
        }, suite === 'browser-lifecycle')
        if (suite === 'browser-lifecycle') {
          assert.equal(observed.lifecycleCount, observed.documentCount, variant.id)
          assert(observed.documentCount > 0, variant.id)
          if (engine === 'chromium') {
            assert.deepEqual(report.samples.filter(sample => sample.variantId === variant.id && sample.metricId === 'cssom-rule-count').map(sample => sample.value), [observed.documentCount])
            assert.equal(report.summary.find(entry => entry.variantId === variant.id && entry.metricId === 'cssom-rule-count').median, observed.documentCount)
          }
        } else {
          const artifact = report.artifacts.find(({ path }) => path.includes(`/artifacts/${variant.id}/`) && path.endsWith('/diagnostics.json'))
          assert(artifact, variant.id)
          const recorded = JSON.parse(await readFile(resolve('..', artifact.path), 'utf8'))
          assert.deepEqual({ total: recorded.cssomTotalRuleCount, top: recorded.cssomTopLevelRuleCount, layers: recorded.cssomLayerRuleCounts, layerTotal: recorded.cssomLayerRuleCount }, observed.expected, `${engine}/${variant.id}`)
          if (/master-(runtime|progressive)/.test(variant.id)) assert(observed.expected.total > 0, variant.id)
          if (suite === 'progressive-hydration-diagnostics') {
            for (const [metricId, value] of Object.entries({ 'cssom-top-level-rule-count': observed.expected.top, 'cssom-layer-rule-count': observed.expected.layerTotal })) {
              assert.deepEqual(report.samples.filter(sample => sample.variantId === variant.id && sample.metricId === metricId).map(sample => sample.value), [value])
              assert.equal(report.summary.find(entry => entry.variantId === variant.id && entry.metricId === metricId).median, value)
            }
          }
        }
        console.log(JSON.stringify({ cssomReport: suite, engine, variantId: variant.id, ...observed, pass: true }))
      } finally { await page.close(); await server.close() }
    }
  } finally { await browser.close() }
}
