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
  writeFileSync(join(work, 'Cargo.toml'), `[package]\nname="master-css-bundle-probe"\nversion="0.0.0"\nedition="2024"\n[dependencies]\nmastercss-compiler={path=${JSON.stringify(join(repo, 'crates/mastercss-compiler'))}}\nserde_json="1.0.151"\n[workspace]\n`)
  writeFileSync(join(work, 'src/main.rs'), readFileSync(new URL('./bundle-graph-probe.rs', import.meta.url)))
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
          const missing = [], errors = []
          try {
            page.on('pageerror', error => errors.push(error.message))
            await page.emulateMedia({ media })
            await page.route('**/*', route => {
              const url = new URL(route.request().url())
              if (url.hostname === 'remote.test') return route.fulfill({ contentType: 'text/css', body: '.example{color:blue}' })
              if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: `<link rel="stylesheet" href="${variant === 'author' ? '/author/entry.css' : test.entry}"><div class="example">probe</div>` })
              const css = url.pathname.startsWith('/author/') ? test.author[url.pathname.slice('/author/'.length)] : assets.get(url.pathname)
              if (css === undefined) { missing.push(url.pathname); return route.fulfill({ status: 404, body: 'missing' }) }
              return route.fulfill({ contentType: 'text/css', body: css })
            })
            await page.goto('http://bundle-graph.test/')
            values[variant] = await page.locator('.example').evaluate(element => { const s = getComputedStyle(element); return { color: s.color, background: s.backgroundColor, content: s.content } })
            assert.deepEqual(missing, []); assert.deepEqual(errors, [])
          } finally { await page.close() }
        }
        assert.deepEqual(values.generated, values.author, `${test.id}/${name}/${media}`)
        count++
        console.log(JSON.stringify({ id: test.id, browser: name, media, slots: test.slots, author: values.author, actual: values.generated, result: 'PASS' }))
      }
    } finally { await browser.close() }
  }
  console.log(JSON.stringify({ cases: cases.length, comparisons: count, failures: 0, scope: 'current public Rust bundle composition plus graph renderer; host/native-Wasm integration still pending' }))
} finally { rmSync(work, { recursive: true, force: true }) }
