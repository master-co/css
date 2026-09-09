import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, extname, resolve } from 'node:path'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { build } = await import(require.resolve('vite'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const root = mkdtempSync(join(tmpdir(), 'master-css-vite-host-inputs-'))
const results = []
try {
  mkdirSync(join(root, 'styles'))
  mkdirSync(join(root, 'node_modules/paint-package'), { recursive: true })
  writeFileSync(join(root, 'styles/paint.css'), '.example{color:blue}.unused{color:red}')
  writeFileSync(join(root, 'styles/paint.scss'), '$paint:blue;.example{color:$paint}.unused{color:red}')
  writeFileSync(join(root, 'node_modules/paint-package/package.json'), JSON.stringify({ name: 'paint-package', exports: './paint.css' }))
  writeFileSync(join(root, 'node_modules/paint-package/paint.css'), '.example{color:blue}.unused{color:red}')
  // Reuse an already-installed Sass implementation without changing repository dependencies.
  symlinkSync(resolve('node_modules/.pnpm/sass@1.104.0/node_modules/sass'), join(root, 'node_modules/sass'), 'dir')
  writeFileSync(join(root, 'index.html'), '<div class="example">test</div><script type="module" src="./entry.js"></script>')
  const cases = [
    { id: 'relative-project-pruning', source: '@import "./styles/paint.css";@master entry;' },
    { id: 'alias-project-pruning', source: '@import "@theme/paint.css";@master entry;', alias: { '@theme': join(root, 'styles') } },
    { id: 'regex-project-pruning', source: '@import "~theme/paint.css";@master entry;', alias: [{ find: /^~theme\/(.*)$/, replacement: join(root, 'styles/$1') }] },
    { id: 'custom-project-pruning', source: '@import "custom-paint";@master entry;' },
    { id: 'package-native-preservation', source: '@import "paint-package";@master entry;', preserve: true },
    { id: 'alias-explicit-preservation', source: '@import "@theme/paint.css";@master entry;@preserve native;', alias: { '@theme': join(root, 'styles') }, preserve: true },
    { id: 'virtual-import', source: '@import "virtual:paint.css";@master entry;@preserve native;', noPruning: true },
    { id: 'virtual-entry', entry: 'virtual:paint.css', noPruning: true },
    { id: 'virtual-import-print', source: '@import "virtual:paint.css" layer(shared) print;@master entry;@preserve native;', printOnly: true, noPruning: true },
    { id: 'virtual-nested-print', source: '@import "virtual:nested.css" layer(shared);@master entry;@preserve native;', printOnly: true, noPruning: true },
    { id: 'virtual-query-identities', source: '@import "virtual:paint.css?blue" print;@import "virtual:paint.css?red" screen;@master entry;@preserve native;', screenColor: 'rgb(255, 0, 0)', noPruning: true },
    { id: 'scss-entry', extension: 'scss', source: '$paint:blue;@master entry;@preserve native;.example{color:$paint}', noPruning: true },
    { id: 'scss-import', source: '@import "./styles/paint.scss";@master entry;@preserve native;', noPruning: true }
  ].filter(test => !process.env.BH_CASE || process.env.BH_CASE.split(',').includes(test.id))
  for (const test of cases) {
    const entry = test.entry ?? `./entry.${test.extension ?? 'css'}`
    writeFileSync(join(root, 'entry.js'), `import ${JSON.stringify(entry)}`)
    if (test.source) writeFileSync(join(root, `entry.${test.extension ?? 'css'}`), test.source)
    const out = join(root, test.id), loads = []
    try {
      await build({ root, base: './', configFile: false, logLevel: 'silent', resolve: { alias: test.alias }, plugins: [
        { name: 'audit-host-css-inputs', enforce: 'pre', resolveId(id) {
          if (id === 'custom-paint') return join(root, 'styles/paint.css')
          if (id.startsWith('virtual:paint.css') || id === 'virtual:nested.css') return '\0' + id
        }, load(id) {
          if (id === '\0virtual:nested.css') { loads.push(id); return '@import "virtual:paint.css" print;@master entry;' }
          if (id.startsWith('\0virtual:paint.css?')) { loads.push(id); return '@master entry;@preserve native;.example{color:' + (id.endsWith('?blue') ? 'blue' : 'red') + '}' }
          if (id !== '\0virtual:paint.css') return
          loads.push(id)
          return '@master entry;@preserve native;@utilities{paint{color:blue}}.example{@compose paint;}'
        } }, ...createMasterCSSVitePlugin({ mode: 'static', runtime: false })
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
              const file = join(out, new URL(route.request().url()).pathname)
              if (!existsSync(file)) { missing.push(file); return route.fulfill({ status: 404, body: 'missing' }) }
              return route.fulfill({ contentType: { '.css': 'text/css', '.js': 'text/javascript', '.html': 'text/html' }[extname(file)], body: readFileSync(file) })
            })
            await page.goto('http://vite-host-inputs.test/index.html')
            const initial = await page.locator('.example').evaluate(el => getComputedStyle(el).color)
            const late = await page.locator('.example').evaluate(el => { el.className = 'unused'; return getComputedStyle(el).color })
            const expectedLate = test.preserve ? 'rgb(255, 0, 0)' : 'rgb(0, 0, 0)'
            const result = { id: test.id, phase: 'browser', browser: name, media, initial, late, expectedLate, missing, errors, loads, result: initial === (media === 'screen' && test.screenColor ? test.screenColor : test.printOnly && media === 'screen' ? 'rgb(0, 0, 0)' : 'rgb(0, 0, 255)') && (test.noPruning || late === expectedLate) && !missing.length && !errors.length ? 'PASS' : 'FAIL' }
            results.push(result); console.log(JSON.stringify(result))
          } finally { await page.close() }
        }
      } finally { await browser.close() }
    }
  }
  const summary = { builds: new Set(results.map(r => r.id)).size, buildFailures: results.filter(r => r.phase === 'build').length, comparisons: results.filter(r => r.phase === 'browser').length, browserFailures: results.filter(r => r.phase === 'browser' && r.result === 'FAIL').length }
  console.log(JSON.stringify(summary)); assert.equal(summary.buildFailures + summary.browserFailures, 0)
} finally { rmSync(root, { recursive: true, force: true }) }
