import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, realpathSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, extname } from 'node:path'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { build } = await import(require.resolve('vite'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const cases = [
  { id: 'css-local', extension: 'css', body: '.example { color: blue; } :global(.global) { background-color: red; }' },
  { id: 'css-composes', extension: 'css', body: '.example { composes: shared from "./shared.module.css"; background-color: red; }' },
  { id: 'sass-local', extension: 'scss', body: '$paint: blue; .example { color: $paint; } :global(.global) { background-color: red; }' },
  { id: 'sass-composes', extension: 'scss', body: '.example { composes: shared from "./shared.module.css"; background-color: red; }' },
  { id: 'css-locals', extension: 'css', body: '.dash-name { color: blue; background-color: red; }', key: 'dashName', localsConvention: 'camelCaseOnly' },
  { id: 'sass-locals', extension: 'scss', body: '.dash-name { color: blue; background-color: red; }', key: 'dashName', localsConvention: 'camelCaseOnly' },
  ...['css', 'scss'].flatMap(extension => [
    { id: `${extension}-pruning-local`, extension, preserve: false, body: '.example { color: blue; } :global(.global) { background-color: red; }' },
    { id: `${extension}-pruning-composes`, extension, preserve: false, body: '.example { composes: shared from "./shared.module.css"; background-color: red; }' }
  ])
]
const rows = [], builds = []
for (const scenario of cases) for (const managed of [false, true]) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-module-'))), out = join(root, 'dist')
  try {
    mkdirSync(join(root, 'node_modules'))
    symlinkSync(dirname(createRequire(require.resolve('vite')).resolve('sass')), join(root, 'node_modules/sass'), 'dir')
    writeFileSync(join(root, 'shared.module.css'), '.shared { color: blue; }')
    const filename = `style.module.${scenario.extension}`, key = scenario.key ?? 'example'
    writeFileSync(join(root, filename), (managed ? '@master entry;' + (scenario.preserve === false ? '' : '@preserve native;') : '') + scenario.body)
    writeFileSync(join(root, 'entry.js'), `import names, { ${key} as named } from './${filename}'; window.names = names; window.named = named; document.querySelector('#target').className=names[${JSON.stringify(key)}]+' global';`)
    writeFileSync(join(root, 'index.html'), '<div id="target">test</div><script type="module" src="./entry.js"></script>')
    try {
      await build({ root, configFile: false, logLevel: 'silent', base: './', plugins: managed ? createMasterCSSVitePlugin({ mode: 'static', runtime: false }) : [], css: { modules: { localsConvention: scenario.localsConvention } }, build: { minify: false } })
      builds.push({ id: scenario.id, managed, result: 'PASS' })
    } catch (error) { const row = { id: scenario.id, managed, phase: 'build', error: String(error), result: 'FAIL' }; builds.push(row); console.log(JSON.stringify(row)); continue }
    for (const name of ['chromium', 'firefox', 'webkit']) {
      const browser = await browsers[name].launch()
      try {
        const page = await browser.newPage(), missing = [], errors = []
        page.on('pageerror', error => errors.push(error.message))
        await page.route('**/*', route => {
          const file = join(out, new URL(route.request().url()).pathname)
          if (!existsSync(file)) { missing.push(file); return route.fulfill({ status: 404, body: 'missing' }) }
          return route.fulfill({ contentType: { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[extname(file)], body: readFileSync(file) })
        })
        await page.goto('http://modules.test/index.html')
        const value = await page.locator('#target').evaluate(el => ({ color: getComputedStyle(el).color, background: getComputedStyle(el).backgroundColor, classes: el.className, names: window.names, named: window.named }))
        const pass = value.color === 'rgb(0, 0, 255)' && value.background === 'rgb(255, 0, 0)' && Boolean(value.names?.[key]) && value.named === value.names[key] && !missing.length && !errors.length
        const row = { id: scenario.id, managed, browser: name, value, missing, errors, result: pass ? 'PASS' : 'FAIL' }; rows.push(row); console.log(JSON.stringify(row))
      } finally { await browser.close() }
    }
  } finally { rmSync(root, { recursive: true, force: true }) }
}
const summary = { builds: builds.length, buildFailures: builds.filter(r => r.result === 'FAIL').length, comparisons: rows.length, browserFailures: rows.filter(r => r.result === 'FAIL').length }
console.log(JSON.stringify(summary)); assert.equal(summary.buildFailures + summary.browserFailures, 0)
