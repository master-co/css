import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, extname } from 'node:path'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { build } = await import(require.resolve('vite'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const root = mkdtempSync(join(tmpdir(), 'master-css-vite-graph-resources-'))
const pkg = join(root, 'node_modules/paint-package')
const svg = color => `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="${color}"/></svg>`
let comparisons = 0
try {
  mkdirSync(pkg, { recursive: true })
  writeFileSync(join(pkg, 'package.json'), JSON.stringify({ name: 'paint-package', exports: './entry.css' }))
  writeFileSync(join(pkg, 'entry.css'), "@import './nested.css';.package-probe{outline:2px solid purple!important;background-image:url(package.svg?package=1#part)}")
  writeFileSync(join(pkg, 'nested.css'), '.package-probe{border-top:3px solid green}')
  writeFileSync(join(pkg, 'package.svg'), svg('purple'))
  writeFileSync(join(root, 'ordinary.svg'), svg('green'))
  writeFileSync(join(root, 'managed.svg'), svg('red'))
  writeFileSync(join(root, 'ordinary.css'), '.ordinary{background-image:url(ordinary.svg?ordinary=1#part)}')
  writeFileSync(join(root, 'entry.css'), '@import "paint-package" layer(package);@master entry;@preserve native;.managed{color:red;background-image:url(managed.svg?managed=1#part)}')
  writeFileSync(join(root, 'entry.js'), "import './ordinary.css';import './entry.css'")
  writeFileSync(join(root, 'index.html'), '<div class="ordinary">ordinary</div><div class="managed">managed</div><div class="package-probe">package</div><script type="module" src="./entry.js"></script>')
  for (const config of [
    { id: 'relative', base: './', pattern: 'assets/[name]-[hash][extname]', split: true },
    { id: 'absolute-unsplit', base: '/deployed/', pattern: 'styles/[name]-[hash][extname]', split: false },
    { id: 'hash-directory', base: './', pattern: 'css/[hash:12]/[name][extname]', split: true }
  ]) {
    const out = join(root, config.id)
    await build({ root, base: config.base, configFile: false, logLevel: 'silent', plugins: createMasterCSSVitePlugin({ mode: 'static', runtime: false }), build: { outDir: out, assetsInlineLimit: 0, cssCodeSplit: config.split, rollupOptions: { output: { assetFileNames: config.pattern } } } })
    for (const name of ['chromium', 'firefox', 'webkit']) {
      const browser = await browsers[name].launch()
      try {
        for (const media of ['screen', 'print']) {
          const page = await browser.newPage(), errors = [], missing = [], requests = []
          try {
            await page.emulateMedia({ media })
            page.on('pageerror', error => errors.push(error.message))
            await page.route('**/*', route => {
              const url = new URL(route.request().url())
              requests.push(url.pathname + url.search)
              const file = join(out, url.pathname.replace(/^\/deployed\//, ''))
              if (!existsSync(file)) { missing.push(url.pathname); return route.fulfill({ status: 404, body: 'missing' }) }
              return route.fulfill({ contentType: { '.css': 'text/css', '.js': 'text/javascript', '.html': 'text/html', '.svg': 'image/svg+xml' }[extname(file)], body: readFileSync(file) })
            })
            await page.goto('http://vite-graph-resources.test/deployed/index.html')
            const styles = await page.locator('.ordinary,.managed,.package-probe').evaluateAll(elements => elements.map(el => { const s = getComputedStyle(el); return { className: el.className, image: s.backgroundImage, color: s.color, outline: s.outlineColor, border: s.borderTopColor } }))
            assert.equal(styles[1].color, 'rgb(255, 0, 0)')
            assert.equal(styles[2].outline, 'rgb(128, 0, 128)')
            assert.equal(styles[2].border, 'rgb(0, 128, 0)')
            for (const [index, query] of ['ordinary', 'managed', 'package'].entries()) {
              assert(styles[index].image.includes(`?${query}=1#part`), JSON.stringify(styles))
              assert(requests.some(url => url.endsWith(`?${query}=1`)), JSON.stringify(requests))
            }
            assert.deepEqual(missing, []); assert.deepEqual(errors, [])
            comparisons++
            console.log(JSON.stringify({ id: config.id, browser: name, media, styles, requests, result: 'PASS' }))
          } finally { await page.close() }
        }
      } finally { await browser.close() }
    }
  }
  console.log(JSON.stringify({ builds: 3, comparisons, failures: 0, scope: 'actual Master CSS Vite plugin: Node package exports/nested package imports, ordinary and managed resources, relative/absolute base and hash directories' }))
} finally { rmSync(root, { recursive: true, force: true }) }
