import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { compileRenderedStylesheet } from '../../../../packages/compiler/dist/stylesheet/index-public.js'
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const root = mkdtempSync(join(tmpdir(), 'master-qualified-render-'))
const cases = []
try {
  for (const qualifier of ['', ' layer', ' layer(cards)', ' supports(display:grid)', ' print', ' layer(cards) supports(display:grid) screen']) {
    for (const preserveNativeCSS of [true, false]) {
      const source = `@import "./child.css"${qualifier};\n.after{margin:1px}`
      const child = '@utilities{paint{padding:2rem}}\n.card{@compose paint;}\n.card{padding:3rem}'
      writeFileSync(join(root, 'child.css'), child)
      const output = await compileRenderedStylesheet(join(root, 'entry.css'), source, { baseManifest: { version: 1, utilities: [] }, projectDir: root, preserveNativeCSS })
      assert(!output.css.includes('@import'), 'simple qualified child must inline')
      cases.push({ qualifier, preserveNativeCSS, css: output.css, sourceMap: output.sourceMap,
        reference: { '/entry.css': `@import "./child.css"${qualifier};` + (preserveNativeCSS ? '.after{margin:1px}' : ''), '/child.css': '.card{padding:2rem}' + (preserveNativeCSS ? '.card{padding:3rem}' : '') } })
    }
  }
} finally { rmSync(root, { recursive: true, force: true }) }
let comparisons = 0
for (const name of ['chromium', 'firefox', 'webkit']) {
  const browser = await browsers[name].launch()
  try {
    for (const test of cases) for (const media of ['screen', 'print']) {
      const values = {}
      for (const version of ['authored', 'rendered']) {
        const page = await browser.newPage()
        try {
          await page.emulateMedia({ media })
          await page.route('**/*', route => {
            const url = new URL(route.request().url())
            if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><style>html{font-size:16px}</style><link rel="stylesheet" href="/entry.css"><div class="card after">Probe</div>' })
            const sources = version === 'authored' ? test.reference : { '/entry.css': test.css }
            assert(url.pathname in sources, url.pathname)
            return route.fulfill({ contentType: 'text/css', body: sources[url.pathname] })
          })
          await page.goto('http://qualified-rendered.test/', { waitUntil: 'load' })
          values[version] = await page.locator('.card').evaluate(element => ({ padding: getComputedStyle(element).paddingTop, margin: getComputedStyle(element).marginTop }))
        } finally { await page.close() }
      }
      assert.deepEqual(values.rendered, values.authored, `${name}/${media}/${test.qualifier}/${test.preserveNativeCSS}`)
      comparisons++
      console.log(JSON.stringify({ browser: name, media, qualifier: test.qualifier, preserveNativeCSS: test.preserveNativeCSS, values, pass: true }))
    }
  } finally { await browser.close() }
}
console.log(JSON.stringify({ cases: cases.length, comparisons, failures: 0, scope: 'Built Node rendered input; qualified child definitions, native suppression and authored cascade' }))
