import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, realpathSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, extname, resolve } from 'node:path'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { build } = await import(require.resolve('vite'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-vite-sass-inputs-')))
const blue = 'rgb(0, 0, 255)', black = 'rgb(0, 0, 0)', results = []
const cases = [
  { id: 'managed-additional-string', source: '@master entry;@preserve native;.example{color:$paint}', additional: '$paint:blue;' },
  { id: 'managed-additional-function', source: '@master entry;@preserve native;.example{color:$paint}', additional: true },
  { id: 'plain-additional-function', source: '.example{color:$paint}', additional: true },
  { id: 'indented-sass', extension: 'sass', source: '$paint: blue\n@master entry\n@preserve native\n.example\n  color: $paint\n' },
  { id: 'alias-use-partial-resource', source: '@use "@theme/paint";@master entry;@preserve native;', resource: true },
  { id: 'plain-partial-resource', source: '@use \"@theme/paint\";', resource: true },
  { id: 'qualified-css-import', source: '@import "./styles/blue.css" layer(shared) print;@master entry;@preserve native;', printOnly: true },
  { id: 'nested-external-import', source: '@import "./styles/external.css";@master entry;@preserve native;', printOnly: true },
  { id: 'qualified-scss-import', extension: 'css', source: '@import "./styles/blue.scss" layer(shared) print;@master entry;@preserve native;', printOnly: true },
  { id: 'alias-scss-import', extension: 'css', source: '@import "@theme/blue.scss";@master entry;@preserve native;' },
  { id: 'plain-inline-sass', source: '$paint:blue;.example{color:$paint}', suffix: '?inline', inline: true },
  { id: 'managed-inline-sass', source: '@master entry;@preserve native;$paint:blue;.example{color:$paint}', suffix: '?inline', inline: true },
  { id: 'raw-sass', source: '$paint:blue;.example{color:$paint}', suffix: '?raw', raw: true },
  { id: 'plain-css-module', extension: 'module.scss', source: '.example{color:blue}', module: true },
  { id: 'managed-css-module', extension: 'module.scss', source: '@master entry;@preserve native;.example{color:blue}', module: true }
].filter(test => !process.env.BH_CASE || process.env.BH_CASE.split(',').includes(test.id))
try {
  mkdirSync(join(root, 'styles')); mkdirSync(join(root, 'node_modules'))
  symlinkSync(resolve('node_modules/.pnpm/sass@1.104.0/node_modules/sass'), join(root, 'node_modules/sass'), 'dir')
  const files = {
    'styles/_paint.scss': '.example{color:blue;background-image:url("./pixel.svg")}',
    'styles/pixel.svg': '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><path fill="blue" d="M0 0h1v1H0z"/></svg>',
    'styles/blue.css': '.example{color:blue}',
    'styles/blue.scss': '$paint:blue;.example{color:$paint}',
    'styles/external.css': '@import "https://sass-external.test/blue.css" print;'
  }
  for (const [file, source] of Object.entries(files)) writeFileSync(join(root, file), source)
  for (const test of cases) {
    const file = `entry.${test.extension ?? 'scss'}`, request = `./${file}${test.suffix ?? ''}`, calls = []
    writeFileSync(join(root, file), test.source)
    writeFileSync(join(root, 'index.html'), '<div class="example" id="target">test</div><script type="module" src="./entry.js"></script>')
    writeFileSync(join(root, 'entry.js'), test.inline ? `import source from ${JSON.stringify(request)}; const style = document.createElement('style'); style.textContent = source; document.head.append(style)` : test.raw ? `import source from ${JSON.stringify(request)}; document.querySelector('#target').dataset.raw = source` : test.module ? `import styles from ${JSON.stringify(request)}; document.querySelector('#target').className = styles.example` : `import ${JSON.stringify(request)}`)
    const additionalData = test.additional === true ? (source, filename) => { calls.push(filename); return '$paint:blue;' + source } : test.additional
    const out = join(root, test.id)
    try {
      await build({ root, base: './', configFile: false, logLevel: 'silent', resolve: { alias: { '@theme': join(root, 'styles') } }, css: { preprocessorOptions: { scss: { additionalData } } }, plugins: process.env.BH_MASTER === '0' ? [] : createMasterCSSVitePlugin({ mode: 'static', runtime: false }), build: { outDir: out } })
    } catch (error) { const result = { id: test.id, phase: 'build', result: 'FAIL', message: error.message, calls }; results.push(result); console.log(JSON.stringify(result)); continue }
    for (const name of ['chromium', 'firefox', 'webkit']) {
      const browser = await browsers[name].launch()
      try {
        for (const media of ['screen', 'print']) {
          const page = await browser.newPage(), missing = [], errors = [], resources = []
          try {
            await page.emulateMedia({ media }); page.on('pageerror', error => errors.push(error.message))
            await page.route('**/*', route => {
              const url = new URL(route.request().url())
              if (url.host === 'sass-external.test') return route.fulfill({ contentType: 'text/css', body: '.example{color:blue}' })
              const file = join(out, decodeURIComponent(url.pathname))
              if (!existsSync(file)) { missing.push(file); return route.fulfill({ status: 404, body: 'missing' }) }
              if (file.endsWith('.svg')) resources.push(file)
              return route.fulfill({ contentType: { '.css': 'text/css', '.js': 'text/javascript', '.html': 'text/html', '.svg': 'image/svg+xml' }[extname(file)], body: readFileSync(file) })
            })
            await page.goto('http://sass-inputs.test/index.html')
            const value = await page.locator('#target').evaluate(async el => {
              const style = getComputedStyle(el), background = style.backgroundImage
              let imageLoaded = false
              if (background.startsWith('url(')) {
                const image = new Image(); image.src = background.slice(4, -1).replace(/^['"]|['"]$/g, '')
                try { await image.decode(); imageLoaded = image.naturalWidth === 1 && image.naturalHeight === 1 } catch { /* reported below */ }
              }
              return { color: style.color, raw: el.dataset.raw, className: el.className, background, imageLoaded }
            })
            const expected = test.raw || (test.printOnly && media === 'screen') ? black : blue
            const pass = value.color === expected && (!test.raw || value.raw === test.source) && (!test.module || value.className !== 'example' && value.className !== 'undefined') && (!test.resource || value.imageLoaded) && (test.additional !== true || calls.length === 1) && !missing.length && !errors.length
            const result = { id: test.id, phase: 'browser', browser: name, media, value, expected, calls, missing, errors, resources, result: pass ? 'PASS' : 'FAIL' }
            results.push(result); console.log(JSON.stringify(result))
          } finally { await page.close() }
        }
      } finally { await browser.close() }
    }
  }
  const summary = { builds: cases.length, buildFailures: results.filter(r => r.phase === 'build').length, comparisons: results.filter(r => r.phase === 'browser').length, browserFailures: results.filter(r => r.phase === 'browser' && r.result === 'FAIL').length }
  console.log(JSON.stringify(summary)); assert.equal(summary.buildFailures + summary.browserFailures, 0)
} finally { rmSync(root, { recursive: true, force: true }) }
