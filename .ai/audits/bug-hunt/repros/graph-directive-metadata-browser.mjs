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
for (const qualifier of ['', ' layer', ' layer(scope)', ' supports(display:grid)', ' screen', ' layer(scope) supports(display:grid) screen']) {
  const root = mkdtempSync(join(tmpdir(), 'master-policy-browser-'))
  const scanner = new MasterCSSScanner({ manifest }, root)
  const row = { qualifier }
  try {
    mkdirSync(join(root, 'app/styles/views'), { recursive: true })
    mkdirSync(join(root, 'app/views'), { recursive: true })
    writeFileSync(join(root, 'app/styles/child.css'), "@source './views/*.html';@safelist 'flex';")
    writeFileSync(join(root, 'app/styles/views/real.html'), '<span class="block"></span>')
    writeFileSync(join(root, 'app/views/wrong.html'), '<span class="hidden"></span>')
    await scanner.init()
    const entry = join(root, 'app/entry.css'), stylesheetSources = new Map()
    try {
      await registerStylesheetSource(scanner, stylesheetSources, entry, `@import './styles/child.css'${qualifier};@master entry;`, { baseManifest: manifest, projectDir: root })
      row.include = stylesheetSources.get(entry).directives.include
      row.css = await createExtractedCSS({ scanner, stylesheetSources, baseManifest: manifest, projectDir: root })
    } catch (error) { row.error = error.message;failures.push({ ...row }) }
  } finally { await scanner.dispose();rmSync(root, { recursive: true, force: true }) }
  rows.push(row);console.log(JSON.stringify(row))
}
let observations = 0, controls = 0
for (const browserName of ['chromium', 'firefox', 'webkit']) {
  const browser = await browsers[browserName].launch()
  try {
    const page = await browser.newPage()
    for (const row of rows) for (const media of ['screen', 'print']) for (const method of ['author', ...(row.error ? [] : ['compiled'])]) {
      await page.emulateMedia({ media })
      await page.setContent(`<style>${method === 'author' ? '.block{display:block}.flex{display:flex}' : row.css}</style><span class="block">real</span><span class="hidden">wrong</span><span class="flex">forced</span>`)
      const actual = await page.locator('span').evaluateAll(elements => elements.map(element => getComputedStyle(element).display))
      const expected = ['block', 'inline', 'flex'], pass = JSON.stringify(actual) === JSON.stringify(expected)
      const record = { browser: browserName, qualifier: row.qualifier, media, method, actual, expected, pass }
      if (method === 'author') { assert(pass, JSON.stringify(record));controls++ }
      else { observations++;if (!pass) failures.push(record) }
      console.log(JSON.stringify(record))
    }
  } finally { await browser.close() }
}
console.log(JSON.stringify({ directory, cases: rows.length, controls, observations, failures, scope: 'Built legacy stylesheet registration andactual extracted CSS;qualified host failures remain explicit if registration cannotcompile' }))
process.exitCode = failures.length ? 1 : 0
