import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

assert(process.cwd().includes('master-css-bh-isolated-'))
const { analyzeCSSStructure } = await import(pathToFileURL(resolve('shared/css-structure.ts')).href)
const cases = [
  ['*', 0], [':is(#probe)', 100], [':not(.absent)', 10], [':has(>span)', 1],
  [':where(#probe)', 0], ['#probe', 100], ['.probe', 10], ['p', 1]
]
const rows = cases.map(([selector, expected]) => ({ selector, expected,
  actual: analyzeCSSStructure(`${selector}{color:red}`).maxSelectorSpecificityScore }))
const repo = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(resolve(repo, 'package.json'))
const { chromium } = require('@playwright/test')
const browser = await chromium.launch()
const browserRows = []
try {
  const page = await browser.newPage()
  const styles = [
    ['universal', 'p{color:blue}*{color:red}'],
    ['is', ':is(#probe){color:red}#probe{color:blue}'],
    ['not', ':not(.absent){color:red}.probe{color:blue}'],
    ['has', ':has(>span){color:red}p{color:blue}']
  ]
  for (const [name, css] of styles) {
    await page.setContent(`<style>${css}</style><p id="probe" class="probe"><span>test</span></p>`)
    const color = await page.locator('#probe').evaluate(element => getComputedStyle(element).color)
    assert.equal(color, 'rgb(0, 0, 255)')
    browserRows.push({ name, css, color })
  }
  const evidence = { browser: { name: 'chromium', version: browser.version() }, rows, browserRows,
    source: 'https://www.w3.org/TR/2026/WD-selectors-4-20260122/#specificity-rules' }
  writeFileSync(fileURLToPath(new URL('../evidence/0069-specificity-controls.json', import.meta.url)), JSON.stringify(evidence, null, 2))
} finally {
  await browser.close()
}
assert.equal(rows.filter(row => row.actual !== row.expected).length, 4)
assert.deepEqual(rows.slice(0, 4).map(row => row.actual), [1, 110, 20, 11])
assert(rows.slice(4).every(row => row.actual === row.expected))
console.log(JSON.stringify({ rows, browserControlsPassed: browserRows.length }))
