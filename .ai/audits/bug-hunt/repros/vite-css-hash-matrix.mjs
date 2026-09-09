import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, extname } from 'node:path'
import { createHash } from 'node:crypto'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { build } = await import(require.resolve('vite'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const modes = [
  { id: 'relative-split', base: './' },
  { id: 'nested-base-unsplit', base: '/mount/', cssCodeSplit: false },
  { id: 'callback-hex', base: './', hashCharacters: 'hex', assetFileNames: () => `custom/css/[name]-[hash:12][extname]` },
  { id: 'base36', base: '/mount/', hashCharacters: 'base36', assetFileNames: 'assets/[name]-[hash:12][extname]' },
  { id: 'hash-directory', base: './', assetFileNames: 'assets/[hash:12]/[name][extname]' },
  { id: 'callback-source-hash', base: './', assetFileNames: a => `custom/${a.names[0]}-${createHash('sha256').update(a.source).digest('hex').slice(0, 12)}.css` },
  { id: 'fixed-name', base: './', fixed: true, assetFileNames: 'assets/[name][extname]' }
]
const work = mkdtempSync(join(tmpdir(), 'master-css-hash-matrix-'))
const root = join(work, 'project')
let comparisons = 0
try {
  mkdirSync(join(root, 'pages'), { recursive: true })
  writeFileSync(join(root, 'entry.js'), "import './entry.css';globalThis.loadLazy = () => import('./lazy.js');")
  writeFileSync(join(root, 'lazy.js'), "import './lazy.css';import './lazy-managed.css';document.querySelector('#lazy').className='lazy';")
  writeFileSync(join(root, 'pages/nested.html'), '<div id="probe" class="example">test</div><div id="lazy">lazy</div><script type="module" src="../entry.js"></script>')
  for (const mode of modes) {
    const outputs = []
    for (const [index, color] of ['red', 'red', 'blue'].entries()) {
      writeFileSync(join(root, 'entry.css'), `@master entry;@preserve native;.example{color:${color}}`)
      writeFileSync(join(root, 'lazy-managed.css'), `@master entry;@preserve native;.lazy{background-color:${color}}`)
      writeFileSync(join(root, 'lazy.css'), `.lazy{border:1px solid ${color}}`)
      const out = join(work, mode.id + index)
      await build({ root, base: mode.base, configFile: false, logLevel: 'silent', plugins: createMasterCSSVitePlugin({ mode: 'static', runtime: false }), build: {
        outDir: out, cssCodeSplit: mode.cssCodeSplit ?? true,
        rollupOptions: { input: join(root, 'pages/nested.html'), output: { ...(mode.assetFileNames ? { assetFileNames: mode.assetFileNames } : {}), ...(mode.hashCharacters ? { hashCharacters: mode.hashCharacters } : {}) } }
      } })
      outputs.push(new Map(readdirSync(out, { recursive: true }).filter(f => extname(f)).map(f => [f, readFileSync(join(out, f))])))
    }
    const [old, same, current] = outputs
    const digestMap = map => Object.fromEntries([...map].map(([file, bytes]) => [file, createHash('sha256').update(bytes).digest('hex')]))
    assert.deepEqual(digestMap(same), digestMap(old), `${mode.id}: identical builds must be byte/name stable`)
    const cssNames = [...current.keys()].filter(f => f.endsWith('.css'))
    assert(cssNames.length > 0)
    if (!mode.fixed) {
      for (const file of cssNames) if (old.has(file)) assert.deepEqual(current.get(file), old.get(file), `${mode.id}: changed CSS cannot reuse a hash URL`)
      assert(cssNames.some(file => !old.has(file)), `${mode.id}: CSS URLs must change`)
    }
    for (const name of ['chromium', 'firefox', 'webkit']) {
      const browser = await browsers[name].launch()
      try {
        for (const cache of mode.fixed ? [false] : [false, true]) {
          const page = await browser.newPage()
          const missing = [], errors = [], requestedCSS = []
          try {
            page.on('pageerror', error => errors.push(error.message))
            await page.route('**/*', route => {
              const url = new URL(route.request().url())
              const file = decodeURIComponent(url.pathname.slice('/mount/'.length))
              if (!url.pathname.startsWith('/mount/') || !current.has(file)) { missing.push(url.pathname); return route.fulfill({ status: 404, body: 'missing' }) }
              if (file.endsWith('.css')) requestedCSS.push(file)
              const body = cache && !file.endsWith('.html') && old.has(file) ? old.get(file) : current.get(file)
              return route.fulfill({ contentType: ({ '.css': 'text/css', '.js': 'text/javascript', '.html': 'text/html' })[extname(file)], body })
            })
            await page.goto('http://css-hash.test/mount/pages/nested.html')
            await browsers.expect(page.locator('#probe')).toHaveCSS('color', 'rgb(0, 0, 255)')
            const beforeLazy = new Set(requestedCSS)
            await page.evaluate(() => globalThis.loadLazy())
            await browsers.expect(page.locator('#lazy')).toHaveCSS('background-color', 'rgb(0, 0, 255)')
            await browsers.expect(page.locator('#lazy')).toHaveCSS('border-top-color', 'rgb(0, 0, 255)')
            if (mode.cssCodeSplit !== false) assert(requestedCSS.some(file => !beforeLazy.has(file)), `${mode.id}: lazy import must request a separate CSS asset`)
            assert.deepEqual(missing, []); assert.deepEqual(errors, []); assert(requestedCSS.length)
            comparisons++
            console.log(JSON.stringify({ id: mode.id, browser: name, cached: cache, requestedCSS, stableRepeatedBuild: true, dynamicImport: 'PASS', result: 'PASS' }))
          } finally { await page.close() }
        }
      } finally { await browser.close() }
    }
  }
  console.log(JSON.stringify({ modes: modes.length, builds: modes.length * 3, comparisons, failures: 0, fixedFilename: 'preserved; fresh responses tested, cache invalidation remains caller policy' }))
} finally { rmSync(work, { recursive: true, force: true }) }
