import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { build } = await import(require.resolve('vite'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const root = mkdtempSync(join(tmpdir(), 'master-css-final-hash-'))
const outputs = []
try {
  writeFileSync(join(root, 'entry.js'), "import './entry.css'")
  writeFileSync(join(root, 'index.html'), '<div class="example">test</div><script type="module" src="./entry.js"></script>')
  for (const color of ['red', 'blue']) {
    writeFileSync(join(root, 'entry.css'), `@master entry;@preserve native;.example{color:${color}}`)
    const out = join(root, color)
    await build({ root, base: './', configFile: false, logLevel: 'silent', plugins: createMasterCSSVitePlugin({ mode: 'static', runtime: false }), build: { outDir: out, rollupOptions: { output: { assetFileNames: 'assets/[name]-[hash][extname]' } } } })
    const assets = readdirSync(out, { recursive: true }).filter(f => f.endsWith('.css'))
    assert.equal(assets.length, 1)
    const file = assets[0], css = readFileSync(join(out, file), 'utf8')
    outputs.push({ color, file, css, sha256: createHash('sha256').update(css).digest('hex'), html: readFileSync(join(out, 'index.html'), 'utf8') })
  }
  const [red, blue] = outputs
  assert.notEqual(red.sha256, blue.sha256)
  const controls = []
  for (const name of ['chromium', 'firefox', 'webkit']) {
    const browser = await browsers[name].launch()
    try {
      for (const cache of [false, true]) {
        const page = await browser.newPage()
        try {
          await page.route('**/*', route => {
            const pathname = new URL(route.request().url()).pathname
            if (pathname === '/') return route.fulfill({ contentType: 'text/html', body: blue.html })
            if (pathname === '/' + blue.file) return route.fulfill({ contentType: 'text/css', body: cache && blue.file === red.file ? red.css : blue.css })
            return route.fulfill({ contentType: 'text/javascript', body: readFileSync(join(root, 'blue', pathname)) })
          })
          await page.goto('http://final-hash.test/')
          const color = await page.locator('.example').evaluate(element => getComputedStyle(element).color)
          const result = { browser: name, retainedCachedResponse: cache, actual: color, expected: 'rgb(0, 0, 255)', pass: color === 'rgb(0, 0, 255)' }
          controls.push(result); console.log(JSON.stringify(result))
        } finally { await page.close() }
      }
    } finally { await browser.close() }
  }
  console.log(JSON.stringify({ outputs, controls, sameFilename: red.file === blue.file, changedContent: red.sha256 !== blue.sha256 }))
  assert.notEqual(red.file, blue.file, 'Content-hashed CSS filename must change when final CSS content changes')
} finally { rmSync(root, { recursive: true, force: true }) }
