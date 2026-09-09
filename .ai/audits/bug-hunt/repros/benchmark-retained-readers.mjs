import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
assert(process.cwd().includes('master-css-bh-isolated-'))
const load = (path) => import(pathToFileURL(resolve(path)).href)
const { createInteractionPage } = await load('shared/interaction-cost.ts')
const { startBrowserLifecycleServer } = await load('shared/browser-lifecycle-server.ts')
const { chromium, firefox, webkit } = createRequire(resolve('package.json'))('@playwright/test')
for (const [engine, launcher] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await launcher.launch()
  try {
    for (const modeId of ['master-runtime', 'master-progressive']) {
      const generated = await createInteractionPage({ fixtureId: 'dynamic', modeId, scenarioId: 'existing-class-toggle', variantId: `bh-0170-retained-${modeId}` })
      const server = await startBrowserLifecycleServer(generated.root)
      const page = await browser.newPage()
      try {
        await page.goto(server.origin)
        await page.waitForFunction('globalThis.__benchmarkReady === true')
        const control = await page.evaluate(`(async () => {
          const frames = async count => { for (let i = 0; i < count; i++) await new Promise(resolve => requestAnimationFrame(resolve)); };
          const name = 'z:17891'; const marker = 'audit-no-generated-rule';
          const element = document.createElement('div'); element.classList.add(name, marker); document.body.append(element);
          await frames(3);
          const used = __readInteractionState(); const zIndex = getComputedStyle(element).zIndex;
          element.remove(); await frames(3);
          const snapshot = masterCSSRuntime.snapshot(); const retained = __readInteractionState();
          const expectedRules = snapshot.classRules[name].rules;
          const expectedBytes = expectedRules.reduce((sum, rule) => sum + new TextEncoder().encode(rule.text).length, 0);
          masterCSSRuntime.deleteClassRules([name]);
          const deleted = __readInteractionState();
          return { name, marker, zIndex, used, retained, expectedRuleCount: expectedRules.length, expectedBytes, deleted };
        })()`)
        assert.equal(control.zIndex, '17891')
        assert.equal(control.used.classCounts[control.name], 1)
        assert.equal(control.used.classCounts[control.marker], 1)
        assert(control.used.classUtilityNames.includes(control.name))
        assert(!control.used.classUtilityNames.includes(control.marker))
        assert.equal(control.retained.classCounts[control.name] || 0, 0)
        assert(control.retained.retainedClassNames.includes(control.name))
        assert.equal(control.retained.retainedClassRuleCount, control.expectedRuleCount)
        assert.equal(control.retained.retainedClassRawBytes, control.expectedBytes)
        assert(!control.deleted.retainedClassNames.includes(control.name))
        assert(!control.deleted.classUtilityNames.includes(control.name))
        assert.equal(control.retained.runtimeGeneratedRuleCount - control.deleted.runtimeGeneratedRuleCount, control.expectedRuleCount)
        console.log(JSON.stringify({ engine, modeId, zIndex: control.zIndex, usedCount: control.used.classCounts[control.name], retainedRules: control.retained.retainedClassRuleCount, retainedBytes: control.retained.retainedClassRawBytes, afterDeleted: control.deleted.retainedClassNames, pass: true }))
      } finally { await page.close(); await server.close() }
    }
  } finally { await browser.close() }
}
