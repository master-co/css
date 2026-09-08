import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { compileManifestFileSync } from '../../../../packages/compiler/src/node.ts'
const require = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))
const browsers = require('@playwright/test')
const cases = [
  { id: 'print', entry: "@import './child.css' print;" },
  { id: 'screen-width', entry: "@import './child.css' screen and (min-width:800px);" },
  { id: 'supports', entry: "@import './child.css' supports(display:grid);" },
  { id: 'unsupported', entry: "@import './child.css' supports(bh-property:no);" },
  { id: 'layer-cascade', entry: "@import './child.css' layer(theme);.example{color:blue}" },
  { id: 'conditional-layer', entry: "@import './child.css' layer(theme) supports(display:grid) print;@layer other{.example{color:blue}}@layer theme{.example{color:green}}" },
  { id: 'anonymous', entry: "@import './child.css' layer;@import './second.css' layer;", second: '.example{color:blue}' },
  { id: 'nested', entry: "@import './child.css' layer(outer) supports(display:grid) screen;", child: "@import './second.css' layer(inner) (min-width:800px);", second: '.example{color:red}' }
]
const root = mkdtempSync(join(tmpdir(), 'master-css-bh-import-browser-'))
try {
  for (const fixture of cases) {
    writeFileSync(join(root, 'entry.css'), fixture.entry)
    writeFileSync(join(root, 'child.css'), fixture.child || '.example{color:red}')
    writeFileSync(join(root, 'second.css'), fixture.second || '')
    fixture.compiled = compileManifestFileSync(join(root, 'entry.css'), { preserveNativeCSS: true, classes: ['example'] }).css
  }
  for (const name of ['chromium', 'firefox', 'webkit']) {
    const browser = await browsers[name].launch()
    const results = []
    try {
      for (const fixture of cases) {
        for (const media of ['screen', 'print']) {
          for (const width of [600, 1000]) {
            const values = []
            for (const compiled of [false, true]) {
              const page = await browser.newPage({ viewport: { width, height: 600 } })
              try {
                await page.emulateMedia({ media })
                await page.route('http://bug-hunt.test/**', async route => {
                  const path = new URL(route.request().url()).pathname
                  const sources = {
                    '/entry.css': compiled ? fixture.compiled : fixture.entry,
                    '/child.css': fixture.child || '.example{color:red}',
                    '/second.css': fixture.second || ''
                  }
                  if (path === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><link rel="stylesheet" href="/entry.css"><div class="example">test</div>' })
                  assert(path in sources, path)
                  await route.fulfill({ contentType: 'text/css', body: sources[path] })
                })
                await page.goto('http://bug-hunt.test/', { waitUntil: 'networkidle' })
                values.push(await page.locator('.example').evaluate(el => getComputedStyle(el).color))
              } finally { await page.close() }
            }
            assert.equal(values[1], values[0], `${name}/${fixture.id}/${media}/${width}`)
            if (fixture.id === 'print') assert.equal(values[0], media === 'print' ? 'rgb(255, 0, 0)' : 'rgb(0, 0, 0)')
            if (fixture.id === 'unsupported') assert.equal(values[0], 'rgb(0, 0, 0)')
            if (fixture.id === 'layer-cascade') assert.equal(values[0], 'rgb(0, 0, 255)')
            results.push({ id: fixture.id, media, width, color: values[0] })
          }
        }
      }
      console.log(JSON.stringify({ browser: name, version: browser.version(), passed: results.length, results }))
    } finally { await browser.close() }
  }
} finally { rmSync(root, { recursive: true, force: true }) }
