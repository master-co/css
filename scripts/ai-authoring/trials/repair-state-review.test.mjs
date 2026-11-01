import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { chromium } from '@playwright/test'
import { prepare, repository } from './control.mjs'
import { repairCheckpoint } from './repair-checkpoint.mjs'
import { compareRepairCandidate } from './repair-regression.mjs'

test('normal and important layer ordering differ, and reopening a layer does not promote it', async () => {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.setContent(`<style>
      @layer components, utilities;
      @layer utilities { .button { color: blue; background-color: blue !important } }
      @layer components { #target.button { color: red; background-color: red !important } }
    </style><button id="target" class="button">Export</button>`)
    const values = () => page.locator('#target').evaluate(el => ({ color: getComputedStyle(el).color, background: getComputedStyle(el).backgroundColor }))
    assert.deepEqual(await values(), { color: 'rgb(0, 0, 255)', background: 'rgb(255, 0, 0)' })
    await page.addStyleTag({ content: '.button { color: green; background-color: green !important }' })
    assert.deepEqual(await values(), { color: 'rgb(0, 128, 0)', background: 'rgb(255, 0, 0)' })
  } finally { await browser.close() }
})

test('recognized hover hooks can lose by layer, and unconditional color utilities introduce state regressions', async () => {
  const work = await mkdtemp(join(tmpdir(), 'master-state-review-')), browser = await chromium.launch()
  try {
    await prepare(work, 'tailwind-hover', true)
    const html = (await readFile(join(work, 'index.html'), 'utf8')).replace('hover:bg-blue-700', 'review-hover')
    const original = await readFile(join(work, 'app.css'), 'utf8')
    // The solved control uses native Tailwind CSS. Register the two colors and
    // replace its resting selector so this fixture exercises generated utilities.
    const nativeRest = '  .bg-blue-600 {\n    background-color: var(--color-blue-600);\n  }\n'
    assert.ok(original.includes(nativeRest))
    const css = original.replace(nativeRest, '') + '\n@theme { --color-blue-600:oklch(54.6% .245 262.881); --color-blue-700:oklch(48.8% .243 264.376); }'
    const stateRule = layer => `\n@layer ${layer} { @media (hover: hover) { #target.review-hover:hover { background-color:var(--color-blue-700) } } }`
    await writeFile(join(work, 'index.html'), html)
    await writeFile(join(work, 'app.css'), css + stateRule('components'))
    const run = previous => repairCheckpoint({ work, task: 'tailwind-hover', browser, repository, baseline: work, answer: 'Retained native CSS reset, token dependencies and focus/disabled rules.', previous })
    const lowerLayer = await run()
    assert.deepEqual(lowerLayer.failedChecks.map(check => check.id), ['light-390-hover', 'light-1280-hover', 'dark-390-hover', 'dark-1280-hover'])
    assert.deepEqual(lowerLayer.completion.classes.unresolved, [])
    assert.deepEqual(lowerLayer.completion.stateReview.properties, ['background-color'])
    const evidence = lowerLayer.assessment.diagnostics.evidence.find(item => item.check === 'light-390-hover')
    assert.ok(evidence.target.rules.some(rule => rule.selector === '#target.review-hover:hover' && rule.layers.includes('components')))
    assert.ok(evidence.target.rules.some(rule => rule.selector === '.bg-blue-600' && rule.layers.includes('utilities')))
    const layers = evidence.target.layerOrder.subLayers
    assert.ok(layers.find(layer => layer.name === 'components').order < layers.find(layer => layer.name === 'utilities').order)
    await writeFile(join(work, 'index.html'), html.replace('bg-blue-600', 'bg-blue-600 bg-blue-700'))
    const lint = spawnSync(process.execPath, [join(repository, 'packages/cli/dist/bin/index.js'), 'lint', 'index.html'], { cwd: work, encoding: 'utf8', timeout: 30000 })
    assert.ifError(lint.error)
    assert.equal(lint.status, 0)
    const report = JSON.parse(lint.stdout)
    assert.ok(report.files.some(file => file.diagnostics.some(item => /conflict/.test(item.ruleId))))
    const unconditional = await run(lowerLayer)
    assert.deepEqual(unconditional.completion.classes.unresolved, [])
    const rejection = compareRepairCandidate(lowerLayer, unconditional)
    assert.equal(rejection.reason, 'regression')
    for (const state of ['rest', 'focus', 'disabled']) assert.ok(rejection.regressions.some(atom => atom.check.endsWith('-' + state) && atom.property === 'background-color'))
    for (const state of ['touch-rest', 'touch-tap']) assert.ok(rejection.regressions.some(atom => atom.check === state && atom.property === 'background-color'))
    await writeFile(join(work, 'index.html'), html)
    await writeFile(join(work, 'app.css'), css + stateRule('utilities'))
    const fixed = await run(lowerLayer)
    assert.equal(fixed.status, 'passed')
    assert.equal(compareRepairCandidate(lowerLayer, fixed).reason, 'passed')
    assert.deepEqual(fixed.completion.stateReview.properties, [])
    assert.notEqual(fixed.sourceHash, lowerLayer.sourceHash)
  } finally { await browser.close(); await rm(work, { recursive: true, force: true }) }
})
