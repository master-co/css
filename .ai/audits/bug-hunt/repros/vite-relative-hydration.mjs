import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'

const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { build } = await import(require.resolve('vite'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const parent = fileURLToPath(new URL('../../../../tmp/', import.meta.url))
mkdirSync(parent, { recursive: true })
const root = mkdtempSync(join(parent, 'bug-hunt-hydration-url-'))
const names = ['index.html', 'pages/nested.html', 'pages/deep/index.html', 'custom/files/shared.html']
try {
  for (const name of names) {
    mkdirSync(dirname(join(root, name)), { recursive: true })
    writeFileSync(join(root, name), '<!doctype html><html><head></head><body><div id="probe" class="block"></div><script type="module" src="/entry.js"></script></body></html>')
  }
  writeFileSync(join(root, 'entry.js'), 'import "./entry.css"')
  writeFileSync(join(root, 'entry.css'), '@import "@master/css";')
  for (const base of ['./', '', '/mount/']) {
    await build({ root, base, configFile: false, logLevel: 'silent', plugins: createMasterCSSVitePlugin({ mode: 'progressive' }), build: { assetsDir: 'custom/files', rollupOptions: { input: names.map(name => join(root, name)) } } })
    for (const browserName of ['chromium', 'firefox', 'webkit']) {
      const browser = await browsers[browserName].launch()
      try {
        for (const name of names) {
          const page = await browser.newPage()
          try {
            const errors = [], missing = [], manifests = []
            page.on('pageerror', error => errors.push(error.message))
            page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
            await page.route('http://hydration-url.test/**', route => {
              const pathname = new URL(route.request().url()).pathname
              const relative = decodeURIComponent(pathname.slice('/mount/'.length))
              const file = join(root, 'dist', relative.endsWith('/') ? relative + 'index.html' : relative)
              if (!pathname.startsWith('/mount/') || !existsSync(file)) {
                missing.push(pathname)
                return route.fulfill({ status: 404, body: 'Missing asset' })
              }
              if (pathname.includes('/_master-css/hydration/')) manifests.push(pathname)
              return route.fulfill({ contentType: ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm' })[extname(file)] ?? 'application/octet-stream', body: readFileSync(file) })
            })
            await page.goto('http://hydration-url.test/mount/' + name)
            await browsers.expect(page.locator('#probe')).toHaveCSS('display', 'block')
            const href = await page.locator('#master-css').getAttribute('data-master-css-hydration-manifest')
            assert(href)
            const expected = new URL(href, page.url()).pathname
            await browsers.expect.poll(() => manifests.includes(expected)).toBe(true)
            // A new class absent from prerendered HTML requires a running observer.
            await page.locator('#probe').evaluate(element => { element.className = 'inline-flex' })
            await browsers.expect(page.locator('#probe')).toHaveCSS('display', 'inline-flex')
            await page.locator('#probe').evaluate(element => { element.className = 'grid' })
            await browsers.expect(page.locator('#probe')).toHaveCSS('display', 'grid')
            assert.equal(await page.locator('#master-css').count(), 1)
            assert.deepEqual(missing, [])
            assert.deepEqual(errors, [])
            console.log(JSON.stringify({ base, browser: browserName, page: name, hydrationURL: href, actualBuiltPlugin: 'PASS', jsonImport: 'PASS', runtimeMutations: 2, errors, missing }))
          } finally { await page.close() }
        }
      } finally { await browser.close() }
    }
  }
} finally { rmSync(root, { recursive: true, force: true }) }
