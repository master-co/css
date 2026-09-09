import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, extname } from 'node:path'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { build } = await import(require.resolve('vite'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const root = mkdtempSync(join(tmpdir(), 'master-css-vite-host-resolution-'))
const results = []
try {
  mkdirSync(join(root, 'styles'))
  writeFileSync(join(root, 'styles/index.css'), "@import './nested.css';")
  writeFileSync(join(root, 'styles/nested.css'), '.example{color:blue}')
  writeFileSync(join(root, 'styles/project.css'), '@master entry;@preserve native;@utilities{paint{color:blue}}.example{@compose paint;}')
  const pkg = join(root, 'node_modules/paint-package')
  mkdirSync(pkg, { recursive: true })
  writeFileSync(join(pkg, 'package.json'), JSON.stringify({ name: 'paint-package', exports: { '.': { import: './browser.css', require: './node.css', default: './node.css' } } }))
  writeFileSync(join(pkg, 'browser.css'), '.example{color:blue}')
  writeFileSync(join(pkg, 'node.css'), '.example{color:red}')
  const browserPkg = join(root, 'node_modules/browser-paint-package')
  mkdirSync(browserPkg, { recursive: true })
  writeFileSync(join(browserPkg, 'package.json'), JSON.stringify({ name: 'browser-paint-package', exports: { '.': { browser: './browser.css', import: './node.css', default: './node.css' } } }))
  writeFileSync(join(browserPkg, 'browser.css'), '.example{color:blue}')
  writeFileSync(join(browserPkg, 'node.css'), '.example{color:red}')
  writeFileSync(join(root, 'entry.js'), "import './entry.css'")
  writeFileSync(join(root, 'index.html'), '<div class="example">test</div><script type="module" src="./entry.js"></script>')
  for (const test of [
    { id: 'string-alias', source: '@import "@theme/index.css" layer(shared);@master entry;@preserve native;', alias: { '@theme': join(root, 'styles') } },
    { id: 'regex-alias', source: '@import "~theme/index.css" supports(display:grid);@master entry;@preserve native;', alias: [{ find: /^~theme\/(.*)$/, replacement: join(root, 'styles/$1') }] },
    { id: 'custom-file-resolver', source: '@import "custom-colors";@master entry;@preserve native;', custom: true },
    { id: 'import-export-condition', source: '@import "paint-package";@master entry;@preserve native;' },
    { id: 'browser-export-condition', source: '@import "browser-paint-package";@master entry;@preserve native;' },
    { id: 'transitive-aliased-entry', source: '@import "@theme/project.css";', alias: { '@theme': join(root, 'styles') } }
  ].filter(test => !process.env.BH_CASE || process.env.BH_CASE === test.id)) {
    writeFileSync(join(root, 'entry.css'), test.source)
    const out = join(root, test.id)
    const resolutions = []
    try {
      await build({ root, base: './', configFile: false, logLevel: 'silent', resolve: { alias: test.alias }, plugins: [
        { name: 'audit-custom-css-resolver', enforce: 'pre', resolveId(id, importer) { if (id !== 'custom-colors') return; resolutions.push({ id, importer }); return join(root, 'styles/index.css') } },
        ...createMasterCSSVitePlugin({ mode: 'static', runtime: false })
      ], build: { outDir: out } })
    } catch (error) {
      const result = { id: test.id, phase: 'build', result: 'FAIL', message: error.message }
      results.push(result); console.log(JSON.stringify(result)); continue
    }
    for (const name of ['chromium', 'firefox', 'webkit']) {
      const browser = await browsers[name].launch()
      try {
        for (const media of ['screen', 'print']) {
          const page = await browser.newPage(), missing = [], errors = []
          try {
            await page.emulateMedia({ media })
            page.on('pageerror', error => errors.push(error.message))
            await page.route('**/*', route => {
              const url = new URL(route.request().url()), file = join(out, url.pathname)
              if (!existsSync(file)) { missing.push(url.pathname); return route.fulfill({ status: 404, body: 'missing' }) }
              return route.fulfill({ contentType: { '.css': 'text/css', '.js': 'text/javascript', '.html': 'text/html' }[extname(file)], body: readFileSync(file) })
            })
            await page.goto('http://vite-host-resolution.test/index.html')
            const actual = await page.locator('.example').evaluate(el => getComputedStyle(el).color)
            const result = { id: test.id, phase: 'browser', browser: name, media, actual, missing, errors, resolutions, result: actual === 'rgb(0, 0, 255)' && !missing.length && !errors.length && (!test.custom || resolutions.length > 0) ? 'PASS' : 'FAIL' }
            results.push(result); console.log(JSON.stringify(result))
          } finally { await page.close() }
        }
      } finally { await browser.close() }
    }
  }
  const summary = { builds: new Set(results.map(r => r.id)).size, buildFailures: results.filter(r => r.phase === 'build').length, comparisons: results.filter(r => r.phase === 'browser').length, failures: results.filter(r => r.result === 'FAIL').length }
  console.log(JSON.stringify(summary))
  assert.equal(summary.failures, 0)
} finally { rmSync(root, { recursive: true, force: true }) }
