import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
const repo = fileURLToPath(new URL('../../../../', import.meta.url))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const work = mkdtempSync(join(tmpdir(), 'master-css-bundle-rust-'))
let count = 0
try {
  mkdirSync(join(work, 'src'))
  writeFileSync(join(work, 'Cargo.toml'), `[package]\nname="master-css-bundle-context-probe"\nversion="0.0.0"\nedition="2024"\n[dependencies]\nmastercss-compiler={path=${JSON.stringify(join(repo, 'crates/mastercss-compiler'))}}\nserde_json="1.0.151"\n[workspace]\n`)
  writeFileSync(join(work, 'src/main.rs'), readFileSync(new URL('./bundle-context-probe.rs', import.meta.url)))
  const build = spawnSync('cargo', ['run', '--offline', '--quiet', '--manifest-path', join(work, 'Cargo.toml'), '--target-dir', join(repo, 'target')], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  assert.equal(build.status, 0, build.stderr)
  const cases = JSON.parse(build.stdout)
  for (const name of ['chromium', 'firefox', 'webkit']) {
    const browser = await browsers[name].launch()
    try {
      for (const test of cases) for (const media of ['screen', 'print']) {
        const values = {}
        const assets = new Map(test.assets.map(a => [a.href, a.css]))
        for (const variant of ['author', 'generated']) {
          const page = await browser.newPage()
          const missing = [], errors = [], requests = []
          try {
            page.on('pageerror', error => errors.push(error.message))
            await page.emulateMedia({ media })
            await page.route('**/*', route => {
              const url = new URL(route.request().url())
              requests.push(url.pathname + url.search)
              if (['/author/pixel.svg', '/author/big.svg'].includes(url.pathname)) return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>' })
              if (url.hostname === 'remote.test') return route.fulfill({ contentType: 'text/css', body: '.example{color:blue}' })
              if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: `<link rel="stylesheet" href="${variant === 'author' ? '/author/entry.css' : test.entry}"><a class="example" id="html">html</a><svg xmlns="http://www.w3.org/2000/svg"><a id="svg" class="example"><rect width="10" height="10"/></a></svg>` })
              const css = url.pathname.startsWith('/author/') ? test.author[url.pathname.slice('/author/'.length)] : assets.get(url.pathname)
              if (css === undefined) { missing.push(url.pathname); return route.fulfill({ status: 404, body: 'missing' }) }
              return route.fulfill({ contentType: 'text/css', body: css })
            })
            await page.goto('http://bundle-graph.test/')
            values[variant] = await page.locator('.example').evaluateAll(elements => elements.map(element => { const s = getComputedStyle(element); return { id: element.id, color: s.color, fill: s.fill, stroke: s.stroke, background: s.backgroundColor, image: s.backgroundImage, outline: s.outlineColor, content: s.content } }))
            if (test.resources) { assert(requests.includes('/author/pixel.svg?q=1'), JSON.stringify(requests)); assert(requests.includes('/author/paint.css?rev=1'), JSON.stringify(requests)); assert(!requests.some(url => url.includes('wrong-namespace') || url.includes('fake.svg'))) }
            assert.deepEqual(missing, []); assert.deepEqual(errors, [])
          } finally { await page.close() }
        }
        assert.deepEqual(values.generated, values.author, `${test.id}/${name}/${media}`)
        count++
        console.log(JSON.stringify({ id: test.id, browser: name, media, slots: test.slots, author: values.author, actual: values.generated, result: 'PASS' }))
      }
    } finally { await browser.close() }
  }
  console.log(JSON.stringify({ cases: cases.length, comparisons: count, failures: 0, scope: 'public Rust bundle namespace and URL relocation; actual imports and SVG requests; host/native-Wasm integration pending' }))
} finally { rmSync(work, { recursive: true, force: true }) }
