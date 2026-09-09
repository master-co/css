import assert from 'node:assert/strict'
import { readFile, writeFile, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
assert(process.cwd().includes('master-css-bh-isolated-'))
const copies = []
async function expose(name, exports) {
  const path = resolve(`shared/.bug-hunt-${name}.ts`)
  await writeFile(path, await readFile(`shared/${name}.ts`, 'utf8') + `\nexport { ${exports} }\n`)
  copies.push(path)
  return import(pathToFileURL(path))
}
const { createMasterDeliveryModePage, readDeliveryDiagnostics } = await expose('delivery-modes', 'readDeliveryDiagnostics')
const { createBrowserLifecyclePage, createBrowserLifecycleVariants } = await expose('browser-lifecycle', 'createBrowserLifecyclePage')
const { startBrowserLifecycleServer } = await import(pathToFileURL(resolve('shared/browser-lifecycle-server.ts')))
const { chromium, firefox, webkit } = createRequire(resolve('package.json'))('@playwright/test')
const corpus = [
  { id: 'leaf', css: '.bh-leaf{color:red}', count: 1, layers: {}, selectors: {} },
  { id: 'empty-style', css: '.bh-empty{}', count: 1, layers: {}, selectors: {} },
  { id: 'nested-style', css: '@layer utilities{.bh-parent{color:red;& .bh-child{color:blue}}}', count: 2, layers: { utilities: 1 }, selectors: { utilities: ['.bh-parent', '& .bh-child'] } },
  { id: 'nested-declarations', css: '.bh-parent{color:red;& .bh-child{color:blue}background:red}', count: 3, layers: {}, selectors: {} },
  { id: 'empty-groups', css: '@media screen{} @supports(display:grid){} @layer utilities{}', count: 0, layers: { utilities: 0 }, selectors: { utilities: [] } },
  { id: 'repeated-layers', css: '@layer utilities{.bh-a{color:red}@media screen{.bh-b{color:blue}}}@layer utilities{.bh-c{color:green}}@supports(display:grid){.bh-d{display:grid}}', count: 4, layers: { utilities: 3 }, selectors: { utilities: ['.bh-a', '.bh-b', '.bh-c'] } },
  { id: 'keyframes', css: '@keyframes utilities{from{opacity:0}to{opacity:1}}', count: 2, layers: {}, selectors: {} },
  { id: 'conditional-layer', css: '@media screen{@layer inner{.bh-inner{color:red}}}', count: 1, layers: {}, selectors: {} },
  { id: 'missing-selector', css: '@layer utilities{.bh-present{color:red}}', count: 1, layers: { utilities: 1 }, selectors: { utilities: ['.bh-present', '.bh-missing'] }, missing: [{className: '', layer: 'utilities', selectorText: '.bh-missing', text: ''}] },
  { id: 'statement-and-font', css: '@layer theme,utilities;@font-face{font-family:bh;src:local(bh)}', count: 2, layers: {}, selectors: {} }
]
const failures = []
try {
  const delivery = await createMasterDeliveryModePage({ fixtureId: 'minimal', modeId: 'master-static', variantId: 'bh-0172-corpus' })
  const variants = createBrowserLifecycleVariants({ enabledScenarioIds: new Set(['initial-load']), enabledModeIds: new Set(['master-static']) })
  assert.equal(variants.length, 1)
  const lifecycle = await createBrowserLifecyclePage(variants[0])
  for (const [engine, launcher] of Object.entries({ chromium, firefox, webkit })) {
    const browser = await launcher.launch()
    try {
      for (const [family, generated] of Object.entries({ delivery, lifecycle })) {
        const server = await startBrowserLifecycleServer(generated.root)
        const page = await browser.newPage()
        try {
          await page.goto(server.origin)
          await page.waitForFunction('globalThis.__benchmarkReady === true')
          const baseline = family === 'lifecycle' ? await page.evaluate('__readLifecycleState().cssomRuleCount') : 0
          for (const entry of corpus) {
            const native = await page.evaluate(({ css, selectors }) => {
              document.getElementById('master-css')?.remove()
              document.getElementById('master-css-hydration-manifest')?.remove()
              const style = document.createElement('style'); style.id = 'master-css'; style.textContent = css; document.head.append(style)
              const manifest = document.createElement('script'); manifest.id = 'master-css-hydration-manifest'; manifest.type = 'application/json'
              manifest.textContent = JSON.stringify({ rules: Object.entries(selectors).flatMap(([layer, names]) => names.map(selectorText => ({layer, selectorText}))) }); document.head.append(manifest)
              function inspect(rules) { return [...rules].map(rule => ({kind: rule.constructor.name, selector: rule.selectorText, children: 'cssRules' in rule ? inspect(rule.cssRules) : undefined})) }
              return inspect(style.sheet.cssRules)
            }, entry)
            const actual = family === 'lifecycle'
              ? { count: await page.evaluate('__readLifecycleState().cssomRuleCount') - baseline }
              : await readDeliveryDiagnostics(page, []).then(d => ({ count: d.cssomTotalRuleCount, layers: d.cssomLayerRuleCounts, layerCount: d.cssomLayerRuleCount, missingSelectors: d.hydrationManifestSelectorsMissingFromCSSOM }))
            const expected = family === 'lifecycle' ? { count: entry.count } : { count: entry.count, layers: entry.layers, layerCount: Object.values(entry.layers).reduce((sum, n) => sum + n, 0), missingSelectors: entry.missing || [] }
            let pass = true
            try { assert.deepEqual(actual, expected) } catch { pass = false; failures.push({engine, family, id: entry.id, actual, expected}) }
            console.log(JSON.stringify({ engine, family, id: entry.id, native, actual, expected, pass }))
            await page.evaluate(`document.getElementById('master-css').remove();document.getElementById('master-css-hydration-manifest').remove()`)
          }
        } finally { await page.close(); await server.close() }
      }
    } finally { await browser.close() }
  }
  assert.deepEqual(failures, [])
} finally { for (const path of copies) await rm(path) }
