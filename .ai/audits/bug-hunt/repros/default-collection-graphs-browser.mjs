import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { MasterCSSScanner } from '../../../../packages/tooling/dist/scanner/node.js'
import manifest from '../../../../packages/preset/src/default-manifest.json' with { type: 'json' }
const require = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))
const browsers = require('@playwright/test')
const directory = resolve(process.env.BH_COMPILER_DIST ?? 'packages/compiler/dist')
const { registerStylesheetSource, createExtractedCSS } = await import(pathToFileURL(join(directory, 'stylesheet/index.js')).href)
const rows = [], failures = []
const variants = [
  ['', css => css], [' layer', css => `@layer{${css}}`],
  [' layer(scope)', css => `@layer scope{${css}}`],
  [' supports(display:grid)', css => `@supports(display:grid){${css}}`],
  [' screen', css => `@media screen{${css}}`],
  [' layer(scope) supports(display:grid) screen', css => `@supports(display:grid){@media screen{@layer scope{${css}}}}`]
]
for (const [qualifier, wrap] of variants) {
  const root = mkdtempSync(join(tmpdir(), 'master-collection-browser-'))
  const scanner = new MasterCSSScanner({ manifest }, root)
  const row = { qualifier, author: wrap('.native{padding-left:11px}') + '.block{display:block}.flex{display:flex}.custom{margin-left:7px}' }
  try {
    mkdirSync(join(root, 'app/styles/views'), { recursive: true })
    mkdirSync(join(root, 'app/views'), { recursive: true })
    writeFileSync(join(root, 'app/styles/child.css'), '@reference "./tokens.css";@source "./views/*.html";@safelist "flex";@utilities{custom{margin-left:7px}}.native{@compose paint;}.drop{display:none}')
    writeFileSync(join(root, 'app/styles/tokens.css'), '@utilities{paint{padding-left:11px}}.reference-never{display:none}')
    writeFileSync(join(root, 'app/tokens.css'), '@utilities{paint{padding-left:99px}}')
    writeFileSync(join(root, 'app/styles/views/real.html'), '<span class="block native custom"></span>')
    writeFileSync(join(root, 'app/views/wrong.html'), '<span class="hidden"></span>')
    await scanner.init()
    const entry = join(root, 'app/entry.css'), stylesheetSources = new Map()
    try {
      await registerStylesheetSource(scanner, stylesheetSources, entry, `@import 'host-font-package';@import './styles/child.css'${qualifier};@master entry;`, { baseManifest: manifest, projectDir: root })
      row.css = await createExtractedCSS({ scanner, stylesheetSources, baseManifest: manifest, projectDir: root })
      row.consumed = !/@(?:source|safelist|reference|master|utilities)|host-font-package/.test(row.css)
      if (!row.consumed) failures.push({ qualifier, problem: 'Consumed directives or host import leaked', css: row.css })
    } catch (error) { row.error = error.message; failures.push({ qualifier, error: error.message }) }
  } finally { await scanner.dispose(); rmSync(root, { recursive: true, force: true }) }
  rows.push(row); console.log(JSON.stringify(row))
}
let observations = 0, controls = 0
for (const browserName of ['chromium', 'firefox', 'webkit']) {
  const browser = await browsers[browserName].launch()
  try {
    const page = await browser.newPage()
    for (const row of rows) for (const media of ['screen', 'print']) for (const method of ['author', ...(row.error ? [] : ['compiled'])]) {
      await page.emulateMedia({ media })
      await page.setContent(`<style>${method === 'author' ? row.author : row.css}</style>${['block', 'hidden', 'flex', 'native', 'custom', 'drop', 'reference-never'].map(name => `<span class="${name}">probe</span>`).join('')}`)
      const actual = await page.locator('span').evaluateAll(elements => elements.map((element, i) => {
        const style = getComputedStyle(element)
        return i === 3 ? style.paddingLeft : i === 4 ? style.marginLeft : style.display
      }))
      const expected = ['block', 'inline', 'flex', row.qualifier.includes('screen') && media === 'print' ? '0px' : '11px', '7px', 'inline', 'inline']
      const pass = JSON.stringify(actual) === JSON.stringify(expected)
      const record = { browser: browserName, qualifier: row.qualifier, media, method, actual, expected, pass }
      if (method === 'author') { assert(pass, JSON.stringify(record)); controls++ }
      else { observations++; if (!pass) failures.push(record) }
      console.log(JSON.stringify(record))
    }
  } finally { await browser.close() }
}
console.log(JSON.stringify({ directory, cases: rows.length, controls, observations, failures, scope: 'Built default collection: policies, child source/reference ownership, managed definitions, conditional native compose, pruning and host-owned entry imports' }))
process.exitCode = failures.length ? 1 : 0
