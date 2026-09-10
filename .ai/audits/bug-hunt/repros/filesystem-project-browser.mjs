import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
const require = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))
const browsers = require('@playwright/test')
const binary = resolve(process.env.BH_CLI ?? 'target/debug/mcss')
const rows = [], failures = []
const qualifiers = ['', ' layer', ' layer(cards)', ' supports(display:grid)', ' screen', ' layer(cards) supports(display:grid) screen', ' print', ' supports(display:invalid-value)']
for (const external of [false, true]) for (const qualifier of qualifiers) {
  const root = mkdtempSync(join(tmpdir(), 'master-filesystem-browser-'))
  const row = { external, qualifier }
  try {
    mkdirSync(join(root, 'styles/views'), { recursive: true })
    writeFileSync(join(root, 'entry.css'), `@import './styles/child.css'${qualifier};@master entry;`)
    writeFileSync(join(root, 'styles/child.css'), `${external ? "@import 'https://invalid.invalid/external.css';" : ''}@source './views/*.html';@utilities{paint{color:red}}.card{@compose paint;}.ordinary{color:blue}`)
    writeFileSync(join(root, 'styles/views/view.html'), '<div class="paint"></div><div class="card"></div><div class="ordinary"></div>')
    try {
      row.css = execFileSync(binary, ['--no-export', '-v', '0'], { cwd: root, encoding: 'utf8', timeout: 15000, stdio: ['ignore', 'pipe', 'pipe'] }).trim()
      assert(row.css.includes('.paint{color:red}'), 'Child-owned source file must be scanned')
      assert(row.css.includes('.card{color:red}'), 'Composed native output must be retained')
      assert(!row.css.includes('@import'), 'Native imports suppressed in this project output')
    } catch (error) { row.error = String(error.stderr ?? error.message);failures.push({ ...row }) }
  } finally { rmSync(root, { recursive: true, force: true }) }
  rows.push(row);console.log(JSON.stringify(row))
}
let observations = 0, controls = 0
for (const browserName of ['chromium', 'firefox', 'webkit']) {
  const browser = await browsers[browserName].launch()
  try {
    for (const row of rows) for (const media of ['screen', 'print']) for (const method of ['author', ...(row.error ? [] : ['compiled'])]) {
      const page = await browser.newPage()
      try {
        await page.emulateMedia({ media })
        await page.route('**/*', route => {
          const path = new URL(route.request().url()).pathname
          if (path === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><style>body{color:black}</style><link rel="stylesheet" href="/entry.css"><div class="paint">P</div><div class="card">C</div><div class="ordinary">O</div>' })
          if (path === '/entry.css') return route.fulfill({ contentType: 'text/css', body: method === 'author' ? `@import '/child.css'${row.qualifier};@layer utilities{.paint{color:red}}` : row.css })
          if (path === '/child.css' && method === 'author') return route.fulfill({ contentType: 'text/css', body: '.card{color:red}' })
          throw new Error(`Unexpected request ${path}`)
        })
        await page.goto('http://filesystem-project.test/', { waitUntil: 'load' })
        const actual = await page.locator('.paint,.card,.ordinary').evaluateAll(elements => elements.map(element => getComputedStyle(element).color))
        const active = !row.qualifier.includes('invalid-value') && (!row.qualifier.includes('screen') || media === 'screen') && (!row.qualifier.includes(' print') || media === 'print')
        const expected = ['rgb(255, 0, 0)', active ? 'rgb(255, 0, 0)' : 'rgb(0, 0, 0)', 'rgb(0, 0, 0)']
        const pass = JSON.stringify(actual) === JSON.stringify(expected)
        const record = { browser: browserName, external: row.external, qualifier: row.qualifier, media, method, actual, expected, pass }
        if (method === 'author') { assert(pass, JSON.stringify(record));controls++ }
        else { observations++;if (!pass) failures.push(record) }
        console.log(JSON.stringify(record))
      } finally { await page.close() }
    }
  } finally { await browser.close() }
}
console.log(JSON.stringify({ binary, cases: rows.length, controls, observations, failures, scope: 'Filesystem native project CLI: managed manifest/source ownership and native compose conditions; ordinary native output suppressed; not stylesheet asset delivery' }))
process.exitCode = failures.length ? 1 : 0
